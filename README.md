# Transcription Helper

These scripts are designed to take audio files, transcribe them, and add the conversation transcripts to a database for future use.

The heavy lifting is done with [whisperX](https://github.com/m-bain/whisperX).

## Setup

To use this you'll need to first install [whisperx](https://github.com/m-bain/whisperX?tab=readme-ov-file#setup-%EF%B8%8F)

If you want your transcripts to be stored in a database copy the `.env.example` file to `.env` and fill in the appropriate values. Then install the additional python requirements in the same python environment as whisperX (usually `whisperx`):

```bash
pip install -r requirements.txt
```

## Usage

If not already active, activate your conda environment:

```bash
conda activate whisperx
```

### Transcribing Audio

Drop your audio files into the root of the project and then run the script:

```bash
./ts.sh <audio_file>
```

This will transcribe the audio file with speaker diarization. The transcripts will be inserted into ./transcripts/<today's date>_<index>.vtt. The audio file will be moved to ./audio/<today's date>_<index>.<ext>.

### Adding Transcripts to Database

To add the transcripts to the database run:

```bash
python add-to-db.py <transcript_file>
```

This will create the table if it doesn't exist and insert the conversation into the database.

If processing transcripts from a past date, you can use the `-d <YYYY-MM-DD>` flag to specify the date of the conversation.

```bash
python add-to-db.py <transcript_file> -d <YYYY-MM-DD>
```
