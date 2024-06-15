import psycopg2
from webvtt import WebVTT
from datetime import datetime, date, timedelta
import argparse
from dotenv import load_dotenv
import os
import uuid
import shutil

load_dotenv()


# Database connection parameters
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")

# Various other constants
NEW_CONVERSATION_THRESHOLD = (
    45  # How many seconds should pass before a conversation is considered "new"
)

# Connect to the PostgreSQL database
conn = psycopg2.connect(
    host=DB_HOST, port=DB_PORT, dbname=DB_NAME, user=DB_USER, password=DB_PASSWORD
)

cur = conn.cursor()

# Create the table if it does not exist
cur.execute(
    """
CREATE TABLE IF NOT EXISTS transcripts (
    id SERIAL PRIMARY KEY,
    session_id UUID,
    conversation INT,
    speaker VARCHAR(255),
    date DATE,
    start_time TIME,
    end_time TIME,
    duration INTERVAL,
    content TEXT
)
"""
)
conn.commit()


# Function to parse VTT time format to Python time
def parse_vtt_time(time_str):
    dt = datetime.strptime(time_str, "%H:%M:%S.%f")
    return dt.time()


# Argument parser setup
parser = argparse.ArgumentParser(
    description="Process a VTT file and insert records into a PostgreSQL database."
)
parser.add_argument("vtt_file", type=str, help="Path to the VTT file")
parser.add_argument(
    "-d",
    "--date",
    type=str,
    help="Date for the records in YYYY-MM-DD format",
    default=date.today().strftime("%Y-%m-%d"),
)
parser.add_argument(
    "-s",
    "--session_id",
    type=str,
    help="Session ID for the records",
    default=str(uuid.uuid4()),
)

args = parser.parse_args()

# Generate a unique session_id for this run
conversation = 1

# Read and parse the VTT file
for caption in WebVTT().read(args.vtt_file):
    # capture the speaker if set, otherwise set to "Unknown"
    speaker = (
        caption.raw_text.split(":")[0].strip("[]")
        if ":" in caption.raw_text
        else "Unknown"
    )

    start_time = parse_vtt_time(caption.start)

    # Rough indicator of a new "conversation". If the start time is more than NEW_CONVERSATION_THRESHOLD seconds after the previous end time, increment the conversation number
    try:
        if datetime.combine(date.min, start_time) > datetime.combine(
            date.min, end_time
        ) + timedelta(seconds=NEW_CONVERSATION_THRESHOLD):
            conversation += 1
    except NameError:
        pass

    end_time = parse_vtt_time(caption.end)

    duration = datetime.combine(date.min, end_time) - datetime.combine(
        date.min, start_time
    )

    content = caption.text.strip()
    if speaker:
        content = content.replace("[" + speaker + "]:", "").strip()

    # Insert data into the table
    cur.execute(
        """INSERT INTO transcripts (session_id, conversation, speaker, date, start_time, end_time, duration, content) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
        (
            args.session_id,
            conversation,
            speaker,
            args.date,
            start_time,
            end_time,
            duration,
            content,
        ),
    )

conn.commit()

# Close the database connection
cur.close()
conn.close()

# Update the filename to add "inserted" to the end before the extension
filename = args.vtt_file.split(".")
filename.insert(-1, "inserted")
new_filename = ".".join(filename)
os.rename(args.vtt_file, new_filename)
# Move the file to the ./transcripts/inserted directory
new_directory = "./transcriptions/inserted"
shutil.move(new_filename, os.path.join(new_directory, new_filename))
print(f"Processed VTT file: {args.vtt_file}")
print(f"Session ID: {args.session_id}")
