import os
import glob


def main():
    print("Beginning transcription")

    # Define the directory and pattern for matching files
    directory = "./transcriptions"
    extensions = [
        "3gp",
        "aac",
        "ac3",
        "aiff",
        "alac",
        "amr",
        "asf",
        "avi",
        "caf",
        "dts",
        "dv",
        "eac3",
        "flac",
        "flv",
        "gif",
        "gxf",
        "h261",
        "h263",
        "h264",
        "hevc",
        "m4a",
        "m4v",
        "matroska",
        "mjpeg",
        "mkv",
        "mov",
        "mp2",
        "mp3",
        "mp4",
        "mpeg",
        "mpeg2",
        "mpegts",
        "mts",
        "ogg",
        "ogv",
        "rm",
        "rmvb",
        "swf",
        "ts",
        "vob",
        "wav",
        "webm",
        "wma",
        "wmv",
        "yuv",
    ]

    # Loop through each extension and find matching files
    for ext in extensions:
        # Use glob to find case-insensitive matches
        pattern = os.path.join(directory, f"*.{ext}")
        for file in glob.glob(pattern, recursive=False):
            # Output the command for each matching file
            print(f"./transcribe.sh {file}")


if __name__ == "__main__":
    main()
