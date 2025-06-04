import os
import json
import shutil
import datetime
from langchain_community.document_loaders import (
    PyPDFLoader,
    Docx2txtLoader,
    TextLoader,
    CSVLoader,
    UnstructuredExcelLoader,
    WebBaseLoader
)
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain.vectorstores import FAISS
from config.settings import UPLOAD_DIR, VECTORSTORE_DIR, URL_DIR, SESSION_DATA_DIR, SESSION_METADATA_FILE, CHAT_SESSIONS_FILE


async def process_document(doc_id: str, file_path: str, file_extension: str, embeddings):
    try:
        # Load document based on file type
        if file_extension == ".pdf":
            loader = PyPDFLoader(file_path)
        elif file_extension in [".docx", ".doc"]:
            loader = Docx2txtLoader(file_path)
        elif file_extension == ".txt":
            loader = TextLoader(file_path)
        elif file_extension == ".csv":
            loader = CSVLoader(file_path)
        elif file_extension in [".xlsx", ".xls"]:
            loader = UnstructuredExcelLoader(file_path)
        else:
            raise ValueError(f"Unsupported file type: {file_extension}")

        # Load the document
        documents = loader.load()

        # Split the document into chunks
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200
        )
        chunks = text_splitter.split_documents(documents)

        # Create a vector store
        vectorstore = FAISS.from_documents(chunks, embeddings)

        # Save the vector store
        vectorstore_path = os.path.join(VECTORSTORE_DIR, doc_id)
        vectorstore.save_local(vectorstore_path)

        # Update metadata with content size
        doc_dir = os.path.join(UPLOAD_DIR, doc_id)
        metadata_path = os.path.join(doc_dir, "metadata.json")
        if os.path.exists(metadata_path):
            with open(metadata_path, "r") as f:
                metadata = json.load(f)

            # Update with actual content size (sum of all chunks)
            content_size = sum(len(chunk.page_content) for chunk in chunks)
            metadata["size"] = content_size

            with open(metadata_path, "w") as f:
                json.dump(metadata, f)

        return True
    except Exception as e:
        print(f"Error processing document: {e}")
        return False


async def process_url(url_id: str, url: str, embeddings):
    try:
        # Create a WebBaseLoader for the URL
        loader = WebBaseLoader(url)

        # Load the content
        documents = loader.load()

        # Get content size
        content_size = sum(len(doc.page_content) for doc in documents)

        # Update metadata with actual content size and title
        url_dir = os.path.join(URL_DIR, url_id)
        metadata_path = os.path.join(url_dir, "metadata.json")

        if os.path.exists(metadata_path):
            with open(metadata_path, "r") as f:
                metadata = json.load(f)

            # Update size
            metadata["size"] = content_size

            # Try to extract title from first document
            if documents and hasattr(documents[0], 'metadata') and 'title' in documents[0].metadata:
                metadata["name"] = documents[0].metadata['title']

            with open(metadata_path, "w") as f:
                json.dump(metadata, f)

        # Split the content into chunks
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200
        )
        chunks = text_splitter.split_documents(documents)

        # Create a vector store
        vectorstore = FAISS.from_documents(chunks, embeddings)

        # Save the vector store with a special prefix to distinguish from documents
        vectorstore_path = os.path.join(VECTORSTORE_DIR, f"url_{url_id}")
        vectorstore.save_local(vectorstore_path)

        return True
    except Exception as e:
        print(f"Error processing URL: {e}")
        return False


def save_session_data(session_metadata: dict, chat_sessions: dict):
    """Save session metadata and chat sessions to JSON files."""
    os.makedirs(SESSION_DATA_DIR, exist_ok=True)

    # Save session metadata
    serializable_metadata = {
        key: {
            "created_at": value["created_at"].isoformat(),
            "message_count": value["message_count"],
            "device_id": value.get("device_id")  # Include device_id in serialized metadata
        } for key, value in session_metadata.items()
    }
    with open(SESSION_METADATA_FILE, "w") as f:
        json.dump(serializable_metadata, f)

    # Save chat session memory (only the conversation history)
    serializable_sessions = {}
    for session_id, chain in chat_sessions.items():
        memory = chain.memory
        if hasattr(memory, 'buffer'):
            chat_history = []
            for msg in memory.buffer:
                if msg.__class__.__name__ == "HumanMessage":
                    chat_history.append({"role": "user", "content": msg.content})
                elif msg.__class__.__name__ == "AIMessage":
                    chat_history.append({"role": "assistant", "content": msg.content})
            serializable_sessions[session_id] = {"chat_history": chat_history}
    with open(CHAT_SESSIONS_FILE, "w") as f:
        json.dump(serializable_sessions, f)


def load_session_data():
    """Load session metadata and chat sessions from JSON files."""
    session_metadata = {}
    chat_sessions = {}

    # Load session metadata
    if os.path.exists(SESSION_METADATA_FILE):
        with open(SESSION_METADATA_FILE, "r") as f:
            data = json.load(f)
            session_metadata = {
                key: {
                    "created_at": datetime.datetime.fromisoformat(value["created_at"]),
                    "message_count": value["message_count"],
                    "device_id": value.get("device_id")  # Load device_id from serialized metadata
                } for key, value in data.items()
            }
            print(session_metadata)

    # Load chat sessions
    if os.path.exists(CHAT_SESSIONS_FILE):
        with open(CHAT_SESSIONS_FILE, "r") as f:
            chat_sessions = json.load(f)
            print(chat_sessions)

    return session_metadata, chat_sessions
