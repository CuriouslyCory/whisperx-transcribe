#!/bin/bash

# Check if a file name is provided
if [ -z "$1" ]; then
    echo "Please provide a file name."
    exit 1
fi

# Use the first argument as the file name
FILENAME="$1"

# Remove the extension from the file name
BASENAME="${FILENAME%.*}"

whisperx "$FILENAME" --diarize --model="large-v2" --hf_token="$HF_TOKEN" --language="en"

# Get the current date in YYYY.MM.DD format
DATE=$(date +%Y.%m.%d)
# Create the new output file name
# Check if the new output file already exists
if [ -e "./transcriptions/${DATE}.srt" ]; then
    # Find the next available index
    index=1
    while [ -e "./transcriptions/${DATE}_${index}.srt" ]; do
        index=$((index + 1))
    done
    # Add the index to the new output file name
    NEW_OUTPUT_BASE="${DATE}_${index}"
else
    NEW_OUTPUT_BASE="${DATE}"
fi
# Move the output file to the new file name
echo "Saving transcription as ./transcriptions/${NEW_OUTPUT_BASE}.vtt"
mv "$BASENAME.vtt" "./transcriptions/${NEW_OUTPUT_BASE}.vtt"
mv "$FILENAME" "./processed-audio/${NEW_OUTPUT_BASE}.${FILENAME##*.}"
rm -f "${BASENAME}.txt" "${BASENAME}.tsv" "${BASENAME}.json" "${BASENAME}.srt"