#!/bin/bash
echo "Running bulk transcription"
python bulk-ts.py
echo "Bulk transcription complete"
echo "Bulk processing transcriptions"
./bulk-add-to-db.sh
echo "Bulk processing complete"