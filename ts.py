import torch
import torchaudio
from transformers import AutoModelForSpeechSeq2Seq, AutoProcessor, pipeline
from pyannote.audio import Pipeline
from dotenv import load_dotenv
import json
import os

load_dotenv()

device = "cuda:0" if torch.cuda.is_available() else "cpu"
torch_dtype = torch.float16 if torch.cuda.is_available() else torch.float32

model_id = "openai/whisper-large-v3-turbo"

model = AutoModelForSpeechSeq2Seq.from_pretrained(
    model_id, torch_dtype=torch_dtype, low_cpu_mem_usage=True, use_safetensors=True
)
model.to(device)

processor = AutoProcessor.from_pretrained(model_id)

pipe = pipeline(
    "automatic-speech-recognition",
    model=model,
    tokenizer=processor.tokenizer,
    feature_extractor=processor.feature_extractor,
    torch_dtype=torch_dtype,
    device=device,
    chunk_length_s=30,
)


def parse_rttm(rttm_file):
    """Parse RTTM file into a list of speaker segments"""
    segments = []
    with open(rttm_file, "r") as f:
        for line in f:
            parts = line.strip().split()
            if len(parts) >= 8:
                start_time = float(parts[3])
                duration = float(parts[4])
                speaker = parts[7]
                segments.append(
                    {
                        "start": start_time,
                        "end": start_time + duration,
                        "speaker": speaker,
                    }
                )
    return segments


def get_speaker_for_timestamp(timestamp, speaker_segments):
    """Find the speaker for a given timestamp"""
    start_time, end_time = timestamp
    matching_speakers = set()

    for segment in speaker_segments:
        # Check for overlap
        if segment["start"] <= end_time and segment["end"] >= start_time:
            matching_speakers.add(segment["speaker"])

    if len(matching_speakers) == 1:
        return list(matching_speakers)[0]
    elif len(matching_speakers) > 1:
        return list(matching_speakers)[0]  # Return first speaker in case of multiple
    return "UNKNOWN"


def process_audio(audio_file):
    # Run whisper transcription
    result = pipe(
        audio_file,
        return_timestamps="word",
        generate_kwargs={"language": "english"},
    )

    with open("audio.json", "w") as f:
        json.dump(result["chunks"], f, indent=4)

    # Run diarization
    waveform, sample_rate = torchaudio.load(audio_file)
    pipeline = Pipeline.from_pretrained(
        "pyannote/speaker-diarization-3.1",
        use_auth_token=os.getenv("HF_TOKEN"),
    )
    pipeline.to(torch.device("cuda"))

    diarization = pipeline({"waveform": waveform, "sample_rate": sample_rate})

    # Save RTTM file
    with open("audio.rttm", "w") as rttm:
        diarization.write_rttm(rttm)

    # Parse speaker segments
    speaker_segments = parse_rttm("audio.rttm")

    # Combine transcription with speaker labels
    aligned_output = []
    current_segment = None

    for chunk in result["chunks"]:
        timestamp = chunk["timestamp"]
        speaker = get_speaker_for_timestamp(timestamp, speaker_segments)

        if current_segment is None:
            # Start first segment
            current_segment = {
                "timestamp": (timestamp[0], timestamp[1]),
                "text": chunk["text"],
                "speaker": speaker,
            }
        elif speaker == current_segment["speaker"]:
            # Same speaker, extend current segment
            current_segment["timestamp"] = (
                current_segment["timestamp"][0],
                timestamp[1],
            )
            current_segment["text"] += chunk["text"]
        else:
            # New speaker, save current segment and start new one
            aligned_output.append(current_segment)
            current_segment = {
                "timestamp": (timestamp[0], timestamp[1]),
                "text": chunk["text"],
                "speaker": speaker,
            }

    # Add the last segment
    if current_segment is not None:
        aligned_output.append(current_segment)

    return aligned_output


if __name__ == "__main__":
    sample = "processed-audio/2024.08.01_20.31.44.wav"
    aligned_results = process_audio(sample)

    # Print results
    for segment in aligned_results:
        print(f"[{segment['speaker']}] {segment['timestamp']}: {segment['text']}")
