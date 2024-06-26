# Transcription Helper

These scripts are designed to take audio files, transcribe them, and add the conversation transcripts to a database for future use.

The heavy lifting is done with [whisperX](https://github.com/m-bain/whisperX).

## Setup

To use this you'll need to first install [whisperx](https://github.com/m-bain/whisperX?tab=readme-ov-file#setup-%EF%B8%8F)

If you want your transcripts to be stored in a database copy the `.env.example` file to `.env` and fill in the appropriate values. Then install the additional python requirements in the same python environment as whisperX (usually `whisperx`):

```bash
pip install -r requirements.txt
```

## Transcripts GUI

There is a gui to help browse and clean up the transcripts. To install cd into the `frontend-gui` directory and run:

```bash
npm install
# ensure your db connection string is in ./frontend-gui/.env
npm run db:push
npm run dev
```

## Usage

If not already active, activate your conda environment:

```bash
conda activate whisperx
```

Add your audio files to the root of the project. Then run:

```bash
./run-all.sh
```

This runs `python bulk-ts.py` to create transcriptions for all audio files in the root of the project. Then it runs `python bulk-add-to-db.py` to add all the transcripts to the database.

See below for instructions on how to run each script individually.

### Transcribing Audio (Audio file => Text transcript)

Drop your audio files into the root of the project and then run the script:

```bash
./ts.sh <audio_file>
```

This will transcribe the audio file with speaker diarization. The transcripts will be inserted into ./transcripts/<today's date>_<index>.vtt. The audio file will be moved to ./processed-audio/<today's date>_<index>.<ext>.

### Adding Transcripts to Database

To add the transcripts to the database run:

```bash
python add-to-db.py <transcript_file>
```

This will create the table if it doesn't exist and insert the conversations into the database. Transcript entries further than 45 seconds apart are considered "new" conversations and marked as such in the database. Once processed the transcript file will be moved to ./transcripts/&lt;filename&gt;.**processed**.vtt.

If processing transcripts from a past date, you can use the `-d <YYYY-MM-DD>` flag to specify the date of the conversation.

```bash
python add-to-db.py <transcript_file> -d <YYYY-MM-DD>
```

### Bulk Adding Transcripts to Database

If you have multiple transcripts to process for a single day you can use the "./bulk-add-to-db.sh" script. This script will process all transcripts in the ./transcripts directory for a given date.

```bash
./bulk-add-to-db.sh <YYYY-MM-DD>
```
