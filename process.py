import psycopg2
from webvtt import WebVTT
from datetime import datetime, date
import argparse
from dotenv import load_dotenv
import os

load_dotenv()


# Database connection parameters
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")

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

args = parser.parse_args()

# Read and parse the VTT file
for caption in WebVTT().read(args.vtt_file):
    speaker = (
        caption.raw_text.split(":")[0].strip("[]")
        if ":" in caption.raw_text
        else "Unknown"
    )

    start_time = parse_vtt_time(caption.start)
    end_time = parse_vtt_time(caption.end)
    duration = datetime.combine(date.min, end_time) - datetime.combine(
        date.min, start_time
    )
    content = caption.text.strip()
    if speaker:
        content = content.replace("[" + speaker + "]:", "").strip()

    # Insert data into the table
    cur.execute(
        """INSERT INTO transcripts (speaker, date, start_time, end_time, duration, content) VALUES (%s, %s, %s, %s, %s, %s)""",
        (speaker, args.date, start_time, end_time, duration, content),
    )

conn.commit()

# Close the database connection
cur.close()
conn.close()
