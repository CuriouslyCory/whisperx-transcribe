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

# # Create the table if it does not exist
# cur.execute(
#     """-- Table: public.frontend-gui_transcripts

# -- DROP TABLE IF EXISTS public."frontend-gui_transcripts";

# CREATE TABLE IF NOT EXISTS public."frontend-gui_transcripts"
# (
#     id integer NOT NULL DEFAULT nextval('"frontend-gui_transcripts_id_seq"'::regclass),
#     session_id uuid NOT NULL,
#     conversation integer NOT NULL,
#     speaker character varying(255) COLLATE pg_catalog."default" NOT NULL,
#     date date NOT NULL,
#     start_time time without time zone NOT NULL,
#     end_time time without time zone NOT NULL,
#     duration interval NOT NULL,
#     content text COLLATE pg_catalog."default" NOT NULL,
#     CONSTRAINT "frontend-gui_transcripts_pkey" PRIMARY KEY (id)
# )

# TABLESPACE pg_default;

# ALTER TABLE IF EXISTS public."frontend-gui_transcripts"
#     OWNER to "lifeTranscriptsAdmin";
# -- Index: conversation_idx

# -- DROP INDEX IF EXISTS public.conversation_idx;

# CREATE INDEX IF NOT EXISTS conversation_idx
#     ON public."frontend-gui_transcripts" USING btree
#     (conversation ASC NULLS LAST)
#     TABLESPACE pg_default;
# -- Index: session_id_idx

# -- DROP INDEX IF EXISTS public.session_id_idx;

# CREATE INDEX IF NOT EXISTS session_id_idx
#     ON public."frontend-gui_transcripts" USING btree
#     (session_id ASC NULLS LAST)
#     TABLESPACE pg_default;
# -- Index: speaker_idx

# -- DROP INDEX IF EXISTS public.speaker_idx;

# CREATE INDEX IF NOT EXISTS speaker_idx
#     ON public."frontend-gui_transcripts" USING btree
#     (speaker COLLATE pg_catalog."default" ASC NULLS LAST)
#     TABLESPACE pg_default;
# """
# )
# conn.commit()


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
        """INSERT INTO
        public."frontend-gui_transcripts" (session_id, conversation, speaker, date, start_time, end_time, duration, content)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """,
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
basefilename = os.path.basename(new_filename)
shutil.move(new_filename, os.path.join(new_directory, basefilename))
print(f"Processed VTT file: {args.vtt_file}")
print(f"Session ID: {args.session_id}")
