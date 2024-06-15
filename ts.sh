#!/bin/bash

# Check if a file name is provided
if [ -z "$1" ]; then
    echo "Please provide a file name."
    exit 1
fi

# Use the first argument as the file name
FILENAME="$1"

# Get the current date in YYYY.MM.DD_HH.MM.SS format
DATE=$(date +%Y.%m.%d_%H.%M.%S)

NEW_FILENAME="${DATE}.${FILENAME##*.}"
mv "$FILENAME" "$NEW_FILENAME"

whisperx "$NEW_FILENAME" --diarize --model="large-v2" --hf_token="$HF_TOKEN" --language="en" --output_format="vtt" --output_dir="./transcriptions"

mv "$NEW_FILENAME" "./processed-audio/${NEW_FILENAME}"