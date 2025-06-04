from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks, Form, Query
from fastapi.middleware.cors import CORSMiddleware
import os
import uuid
import shutil
import datetime
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain.vectorstores import FAISS
from langchain.chains import ConversationalRetrievalChain
from langchain.memory import ConversationBufferMemory
import json
from urllib.parse import urlparse
from models.models import ChatRequest, UrlRequest, SessionRequest
from config.settings import OPENAI_API_KEY, UPLOAD_DIR, VECTORSTORE_DIR, URL_DIR, SESSION_DATA_DIR
from utils.document_processing import process_document, process_url, save_session_data, load_session_data
from typing import Optional

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create directories
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(VECTORSTORE_DIR, exist_ok=True)
os.makedirs(URL_DIR, exist_ok=True)
os.makedirs(SESSION_DATA_DIR, exist_ok=True)

# Store chat sessions and their metadata
session_metadata, persisted_sessions = load_session_data()
chat_sessions = {}

# Initialize OpenAI embeddings and model
embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
llm = ChatOpenAI(temperature=0, model="gpt-3.5-turbo", api_key=OPENAI_API_KEY)


@app.get("/")
def read_root():
    return {"message": "Document Chat API is running"}


@app.post("/upload")
async def upload_file(
        file: UploadFile = File(...),
        device_id: Optional[str] = Form(None),
        background_tasks: BackgroundTasks = None
):
    doc_id = str(uuid.uuid4())
    filename = file.filename
    file_extension = os.path.splitext(filename)[1].lower()
    doc_dir = os.path.join(UPLOAD_DIR, doc_id)
    os.makedirs(doc_dir, exist_ok=True)
    file_path = os.path.join(doc_dir, filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size = os.path.getsize(file_path)

    # Initialize session metadata at upload time
    session_metadata[doc_id] = {
        "created_at": datetime.datetime.now(),
        "message_count": 0,
        "device_id": device_id  # Store device_id in session metadata
    }

    if background_tasks:
        background_tasks.add_task(process_document, doc_id, file_path, file_extension, embeddings)
    else:
        await process_document(doc_id, file_path, file_extension, embeddings)

    metadata = {
        "id": doc_id,
        "name": filename,
        "type": file_extension[1:],
        "uploadedAt": session_metadata[doc_id]["created_at"].isoformat(),
        "size": file_size,
        "source": "file",
        "device_id": device_id  # Include device_id in metadata
    }

    with open(os.path.join(doc_dir, "metadata.json"), "w") as f:
        json.dump(metadata, f)

    # Save session metadata
    save_session_data(session_metadata, chat_sessions)

    return metadata


@app.post("/add_url")
async def add_url(url_data: UrlRequest, background_tasks: BackgroundTasks = None):
    url_id = str(uuid.uuid4())
    url = url_data.url
    device_id = url_data.device_id  # Extract device_id from request

    url_dir = os.path.join(URL_DIR, url_id)
    os.makedirs(url_dir, exist_ok=True)
    url_file_path = os.path.join(url_dir, "url.txt")

    with open(url_file_path, "w") as f:
        f.write(url)

    try:
        parsed_url = urlparse(url)
        domain = parsed_url.netloc
        path = parsed_url.path
        name = domain + (path if path and path != "/" else "")
    except:
        name = url[:50]

    # Initialize session metadata at URL addition time
    session_metadata[url_id] = {
        "created_at": datetime.datetime.now(),
        "message_count": 0,
        "device_id": device_id  # Store device_id in session metadata
    }

    metadata = {
        "id": url_id,
        "name": name,
        "type": "url/html",
        "uploadedAt": session_metadata[url_id]["created_at"].isoformat(),
        "size": len(url),
        "source": "url",
        "sourceUrl": url,
        "device_id": device_id  # Include device_id in metadata
    }

    with open(os.path.join(url_dir, "metadata.json"), "w") as f:
        json.dump(metadata, f)

    if background_tasks:
        background_tasks.add_task(process_url, url_id, url, embeddings)
    else:
        await process_url(url_id, url, embeddings)

    # Save session metadata
    save_session_data(session_metadata, chat_sessions)

    return metadata


@app.get("/documents")
async def get_documents(device_id: Optional[str] = Query(None)):
    docs = []

    if os.path.exists(UPLOAD_DIR):
        for doc_id in os.listdir(UPLOAD_DIR):
            doc_dir = os.path.join(UPLOAD_DIR, doc_id)
            if os.path.isdir(doc_dir):
                metadata_path = os.path.join(doc_dir, "metadata.json")
                if os.path.exists(metadata_path):
                    with open(metadata_path, "r") as f:
                        metadata = json.load(f)

                        # Filter by device_id if provided
                        if device_id is None or metadata.get("device_id") == device_id:
                            docs.append(metadata)
                else:
                    files = os.listdir(doc_dir)
                    if files:
                        filename = next((f for f in files if f != "metadata.json"), None)
                        if filename:
                            file_path = os.path.join(doc_dir, filename)
                            file_extension = os.path.splitext(filename)[1].lower()[1:]
                            # Only include documents without device_id when no filter is applied
                            if device_id is None:
                                docs.append({
                                    "id": doc_id,
                                    "name": filename,
                                    "type": file_extension,
                                    "size": os.path.getsize(file_path),
                                    "uploadedAt": datetime.datetime.fromtimestamp(
                                        os.path.getctime(file_path)).isoformat(),
                                    "source": "file"
                                })

    if os.path.exists(URL_DIR):
        for url_id in os.listdir(URL_DIR):
            url_dir = os.path.join(URL_DIR, url_id)
            if os.path.isdir(url_dir):
                metadata_path = os.path.join(url_dir, "metadata.json")
                if os.path.exists(metadata_path):
                    with open(metadata_path, "r") as f:
                        metadata = json.load(f)

                        # Filter by device_id if provided
                        if device_id is None or metadata.get("device_id") == device_id:
                            docs.append(metadata)

    return docs


@app.post("/chat")
async def chat(request: ChatRequest):
    if not request.messages:
        raise HTTPException(status_code=400, detail="No message provided")

    message = request.messages
    session_id = request.session_ids
    device_id = request.device_id  # Extract device_id from request

    # Check if session metadata exists
    if session_id not in session_metadata:
        raise HTTPException(status_code=404, detail="Session metadata not found")

    # Verify device_id if provided
    if device_id and session_metadata[session_id].get("device_id") and session_metadata[session_id][
        "device_id"] != device_id:
        raise HTTPException(status_code=403, detail="You don't have permission to access this session")

    # Load or get retrieval chain if not already loaded
    if session_id not in chat_sessions:
        doc_dir = os.path.join(UPLOAD_DIR, session_id)
        url_dir = os.path.join(URL_DIR, session_id)
        is_document = os.path.exists(doc_dir)
        is_url = os.path.exists(url_dir)

        if not (is_document or is_url):
            raise HTTPException(status_code=404, detail="Document or URL not found")

        vectorstore_path = os.path.join(VECTORSTORE_DIR, session_id if is_document else f"url_{session_id}")

        if not os.path.exists(vectorstore_path):
            raise HTTPException(status_code=404, detail="Content not processed yet")

        try:
            vectorstore = FAISS.load_local(vectorstore_path, embeddings, allow_dangerous_deserialization=True)
            memory = ConversationBufferMemory(
                memory_key="chat_history",
                return_messages=True
            )

            # Restore chat history from persisted sessions
            if session_id in persisted_sessions:
                for msg in persisted_sessions[session_id]["chat_history"]:
                    if msg["role"] == "user":
                        memory.save_context({"input": msg["content"]}, {"output": ""})
                    elif msg["role"] == "assistant":
                        memory.save_context({"input": ""}, {"output": msg["content"]})

            retrieval_chain = ConversationalRetrievalChain.from_llm(
                llm=llm,
                retriever=vectorstore.as_retriever(),
                memory=memory
            )
            chat_sessions[session_id] = retrieval_chain
        except Exception as e:
            print(f"Error loading session: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    # Check session limits
    current_time = datetime.datetime.now()
    session_start = session_metadata[session_id]["created_at"]
    time_elapsed = (current_time - session_start).total_seconds()
    message_count = session_metadata[session_id]["message_count"]
    print(f"Session ID: {session_id}, Time Elapsed: {time_elapsed}, Message Count: {message_count}")

    if time_elapsed > 3600:
        return {
            "role": "assistant",
            "content": "Session has ended due to time limit (1 hour)",
            "source_documents": [],
            "messages_remaining": 0,
            "session_expires_in": 0
        }

    if message_count >= 20:
        return {
            "role": "assistant",
            "content": "Session has ended due to message limit (20 messages)",
            "source_documents": [],
            "messages_remaining": 0,
            "session_expires_in": 3600 - time_elapsed
        }

    # Process the chat message
    retrieval_chain = chat_sessions[session_id]
    formatted_history = []

    for entry in request.history:
        if entry.get("role") == "user":
            formatted_history.append((entry.get("content"), ""))
        elif entry.get("role") == "assistant":
            if formatted_history:
                last_user_msg, _ = formatted_history.pop()
                formatted_history.append((last_user_msg, entry.get("content")))

    try:
        response = retrieval_chain.invoke({
            "question": message,
            "chat_history": formatted_history
        })

        session_metadata[session_id]["message_count"] += 1
        save_session_data(session_metadata, chat_sessions)

        return {
            "role": "assistant",
            "content": response["answer"],
            "source_documents": response.get("source_documents", []),
            "messages_remaining": 20 - session_metadata[session_id]["message_count"],
            "session_expires_in": 3600 - time_elapsed
        }
    except Exception as e:
        print(f"Error during chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/create_session/{doc_id}")
async def create_session(doc_id: str, request: SessionRequest = None):
    # Extract device_id from request body if provided
    device_id = None
    if request:
        device_id = request.device_id

    doc_dir = os.path.join(UPLOAD_DIR, doc_id)
    url_dir = os.path.join(URL_DIR, doc_id)
    is_document = os.path.exists(doc_dir)
    is_url = os.path.exists(url_dir)

    if not (is_document or is_url):
        raise HTTPException(status_code=404, detail="Document or URL not found")

    if doc_id not in session_metadata:
        raise HTTPException(status_code=404,
                            detail="Session metadata not found; please upload the document or URL again")

    # Verify device_id if provided
    if device_id and session_metadata[doc_id].get("device_id") and session_metadata[doc_id]["device_id"] != device_id:
        raise HTTPException(status_code=403, detail="You don't have permission to access this document")

    vectorstore_path = os.path.join(VECTORSTORE_DIR, doc_id if is_document else f"url_{doc_id}")

    if not os.path.exists(vectorstore_path):
        raise HTTPException(status_code=404, detail="Content not processed yet")

    try:
        vectorstore = FAISS.load_local(vectorstore_path, embeddings, allow_dangerous_deserialization=True)
        memory = ConversationBufferMemory(
            memory_key="chat_history",
            return_messages=True
        )

        # Restore chat history if exists
        if doc_id in persisted_sessions:
            for msg in persisted_sessions[doc_id]["chat_history"]:
                if msg["role"] == "user":
                    memory.save_context({"input": msg["content"]}, {"output": ""})
                elif msg["role"] == "assistant":
                    memory.save_context({"input": ""}, {"output": msg["content"]})

        print("Chat memory: ", memory.chat_memory.messages)

        retrieval_chain = ConversationalRetrievalChain.from_llm(
            llm=llm,
            retriever=vectorstore.as_retriever(),
            memory=memory
        )
        chat_sessions[doc_id] = retrieval_chain
        save_session_data(session_metadata, chat_sessions)
        return {"id": doc_id, "status": "created"}
    except Exception as e:
        print(f"Error creating session: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/documents/{doc_id}")
async def delete_document(doc_id: str, device_id: Optional[str] = Query(None)):
    # Check if document exists and verify device_id if provided
    doc_dir = os.path.join(UPLOAD_DIR, doc_id)
    if os.path.exists(doc_dir):
        # Verify device_id if provided
        if device_id and doc_id in session_metadata:
            doc_device_id = session_metadata[doc_id].get("device_id")
            if doc_device_id and doc_device_id != device_id:
                raise HTTPException(status_code=403, detail="You don't have permission to delete this document")

        shutil.rmtree(doc_dir, ignore_errors=True)
        vectorstore_path = os.path.join(VECTORSTORE_DIR, doc_id)
        if os.path.exists(vectorstore_path):
            shutil.rmtree(vectorstore_path, ignore_errors=True)
        if doc_id in chat_sessions:
            del chat_sessions[doc_id]
        if doc_id in session_metadata:
            del session_metadata[doc_id]
        if doc_id in persisted_sessions:
            del persisted_sessions[doc_id]
        save_session_data(session_metadata, chat_sessions)
        return {"status": "deleted"}

    # Check if URL exists and verify device_id if provided
    url_dir = os.path.join(URL_DIR, doc_id)
    if os.path.exists(url_dir):
        # Verify device_id if provided
        if device_id and doc_id in session_metadata:
            doc_device_id = session_metadata[doc_id].get("device_id")
            if doc_device_id and doc_device_id != device_id:
                raise HTTPException(status_code=403, detail="You don't have permission to delete this URL")

        shutil.rmtree(url_dir, ignore_errors=True)
        vectorstore_path = os.path.join(VECTORSTORE_DIR, f"url_{doc_id}")
        if os.path.exists(vectorstore_path):
            shutil.rmtree(vectorstore_path, ignore_errors=True)
        if doc_id in chat_sessions:
            del chat_sessions[doc_id]
        if doc_id in session_metadata:
            del session_metadata[doc_id]
        if doc_id in persisted_sessions:
            del persisted_sessions[doc_id]
        save_session_data(session_metadata, chat_sessions)
        return {"status": "deleted"}

    raise HTTPException(status_code=404, detail="Document or URL not found")
