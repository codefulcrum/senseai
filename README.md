# Sense AI 

This project is a sense AI that allows users to upload documents or add URLs and chat with an AI about the content.

## Features

- Upload documents (PDF, DOC, DOCX, TXT, CSV, XLSX)
- Add URLs to chat about web content
- Chat with AI about document or URL content
- Document and URL management

## Setup Instructions

### Prerequisites

- Node.js 18.17.0 or later (20.x LTS recommended)
- Python 3.8 or later
- OpenAI API key

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd senseai_api
   
2. Install Python dependencies:
   ```bash
    pip install -r requirements.txt
    ```
3. Set up environment variables:

- Create a `.env` file in the `senseai_api` directory with the following content:
   ```env
   OPENAI_API_KEY=your_openai_api_key
   ```
  
5. Run the backend server:
   ```bash
    uvicorn main:app --reload
    ```
### Frontend Setup
1. Node version:
   ```bash
   nvm use 20
   ```
2. Install Node.js dependencies:
   ```bash
    npm install
    ```
3. Start the frontend development server:
4. ```bash
   npm run dev
   ```
### Usage
1. Open your web browser and go to `http://localhost:3000` to access the frontend.
2. Upload a document or add a URL to start chatting with the AI.
3. Use the chat interface to interact with the AI about the content of the uploaded document or URL.
4. Manage your documents and URLs through the provided interface.

