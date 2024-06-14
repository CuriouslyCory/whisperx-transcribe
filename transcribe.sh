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

# Assuming the output filename is the same as the input but with a .srt extension
OUTPUT_FILE="${BASENAME}.srt"

# Uncomment to remove the timestamps and other formatting leaving just the speaker labels and dialog
# sed -i -r 's@^[0-9]+$@@g' "$OUTPUT_FILE"
# sed -i -r 's@^[0-9]{2}:[0-9]{2}:[0-9]{2},[0-9]{3} --> [0-9]{2}:[0-9]{2}:[0-9]{2},[0-9]{3}$@@g' "$OUTPUT_FILE"
# sed -i -zr 's@\n+@\n@g' "$OUTPUT_FILE"

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
echo "Saving transcription as ./transcriptions/${NEW_OUTPUT_BASE}.srt"
mv "$OUTPUT_FILE" "./transcriptions/${NEW_OUTPUT_BASE}.srt"
mv "$BASENAME.vtt" "./transcriptions/${NEW_OUTPUT_BASE}.vtt"
mv "$FILENAME" "./processed/${NEW_OUTPUT_BASE}.${FILENAME##*.}"
rm -f "${BASENAME}.txt" "${BASENAME}.tsv" "${BASENAME}.json"