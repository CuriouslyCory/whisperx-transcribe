import torch
from transformers import AutoModelForSpeechSeq2Seq, AutoProcessor, pipeline
from jiwer import wer
import os
import json
from typing import Dict, List, Tuple


def load_whisper_pipeline(model_id: str) -> pipeline:
    device = "cuda:0" if torch.cuda.is_available() else "cpu"
    torch_dtype = torch.float16 if torch.cuda.is_available() else torch.float32

    model = AutoModelForSpeechSeq2Seq.from_pretrained(
        model_id, torch_dtype=torch_dtype, low_cpu_mem_usage=True, use_safetensors=True
    )
    model.to(device)

    processor = AutoProcessor.from_pretrained(model_id)

    return pipeline(
        "automatic-speech-recognition",
        model=model,
        tokenizer=processor.tokenizer,
        feature_extractor=processor.feature_extractor,
        torch_dtype=torch_dtype,
        device=device,
    )


def evaluate_models(
    audio_files: Dict[str, str], model_ids: List[str]
) -> Dict[str, Dict[str, float]]:
    """
    Evaluate multiple Whisper models against a set of audio files with known transcriptions

    audio_files: Dict of {audio_file_path: known_transcription}
    model_ids: List of Whisper model IDs to test
    """
    results = {}

    for model_id in model_ids:
        print(f"Testing model: {model_id}")
        pipe = load_whisper_pipeline(model_id)
        model_results = {}

        for audio_path, reference_text in audio_files.items():
            prediction = pipe(audio_path)["text"]
            error_rate = wer(reference_text, prediction)
            model_results[audio_path] = {
                "wer": error_rate,
                "reference": reference_text,
                "prediction": prediction,
            }

        results[model_id] = model_results

    return results


def main():
    # Example model IDs to compare
    models_to_test = [
        "openai/whisper-tiny",
        "openai/whisper-small",
        "openai/whisper-medium",
        "openai/whisper-large-v2",
        "openai/whisper-large-v3-turbo",
        "distil-whisper/distil-large-v2",
        "distil-whisper/distil-large-v3",
    ]

    # Example test data structure
    # In practice, you'd want to load this from a proper test dataset
    test_files = {
        "path/to/audio1.wav": "known transcription for audio 1",
        "path/to/audio2.wav": "known transcription for audio 2",
    }

    results = evaluate_models(test_files, models_to_test)

    # Save results
    with open("whisper_comparison_results.json", "w") as f:
        json.dump(results, f, indent=2)

    # Print summary
    for model_id, model_results in results.items():
        avg_wer = sum(r["wer"] for r in model_results.values()) / len(model_results)
        print(f"\n{model_id}:")
        print(f"Average WER: {avg_wer:.4f}")


if __name__ == "__main__":
    main()
