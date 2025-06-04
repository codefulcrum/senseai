import os
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
UPLOAD_DIR = "uploads"
VECTORSTORE_DIR = "vectorstores"
URL_DIR = "urls"
SESSION_DATA_DIR = "session_data"
SESSION_METADATA_FILE = os.path.join(SESSION_DATA_DIR, "session_metadata.json")
CHAT_SESSIONS_FILE = os.path.join(SESSION_DATA_DIR, "chat_sessions.json")
