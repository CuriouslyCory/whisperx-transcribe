#!/bin/bash

# Activate the whisperx conda environment
# This environment has the correct versions of cuDNN and CUDA
eval "$(conda shell.bash hook)"
conda activate whisper

# Set environment variables to fix TensorFloat-32 warning
export PYTHONPATH=$PYTHONPATH:/home/curiouslycory/miniconda3/envs/whisper/lib/python3.12/site-packages/
# export TORCH_ALLOW_TF32_CUBLAS_OVERRIDE=1

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

# Create directories if they don't exist
mkdir -p "./transcriptions" "./processed-audio"

# Run whisperx with parameters
whisperx "$NEW_FILENAME" --diarize --model="large-v3-turbo" --hf_token="$HF_TOKEN" --align_model WAV2VEC2_ASR_LARGE_LV60K_960H --language="en" --output_format="vtt" --output_dir="./transcriptions" --min_speakers 3 --max_speakers 3

# Move the processed file
# mv "$NEW_FILENAME" "./processed-audio/${NEW_FILENAME}"