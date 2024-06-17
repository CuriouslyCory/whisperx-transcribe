#!/bin/bash

# The arg should be a date in the format YYYY.MM.DD
if [ -z "$1" ]; then
    NEW_DATE=""
    DATE=$(date +%Y-%m-%d)
else
    DATE="$1"
    # Create a new variable and populate it with YYYY-MM-DD format
    NEW_DATE=$(date -d "$DATE" +%Y.%m.%d)
    echo "Processing transcriptions for $NEW_DATE"
fi

# For each file in the ./transcriptions directory that matches the pattern {$NEW_DATE}*.vtt run the following command
for file in ./transcriptions/"$NEW_DATE"*.vtt; do
  python add-to-db.py "$file" -d "$DATE"
done