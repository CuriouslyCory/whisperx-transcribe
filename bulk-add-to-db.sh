#!/bin/bash

# The arg should be a date in the format YYYY.MM.DD
if [ -z "$1" ]; then
    echo "Please provide a date in the format YYYY-MM-DD."
    exit 1
else
    DATE="$1"
fi

# Create a new variable and populate it with YYYY-MM-DD format
NEW_DATE=$(date -d "$DATE" +%Y.%m.%d)
echo "Processing transcriptions for $NEW_DATE"

# For each file in the ./transcriptions directory that matches the pattern {$NEW_DATE}*.vtt run the following command
for file in ./transcriptions/"$NEW_DATE"*.vtt; do
  python add-to-db.py "$file" -d "$DATE"
done