// API client for interacting with the FastAPI backend

export interface Document {
  id: string
  name: string
  type: string
  uploadedAt: string
  size: number
}

export interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

export interface Session {
  id: string
  documentId: string
  createdAt: string
}

// Replace with your actual API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

// Device ID for filtering documents
let currentDeviceId: string | null = null

// Set the device ID
export function setDeviceId(deviceId: string) {
  currentDeviceId = deviceId
}

// Get the current device ID
export function getDeviceId(): string | null {
  return currentDeviceId
}

// Upload a document
export async function uploadDocument(file: File): Promise<Document> {
  const formData = new FormData()
  formData.append("file", file)

  // Add device_id to the form data if available
  if (currentDeviceId) {
    formData.append("device_id", currentDeviceId)
  }

  const response = await fetch(`${API_URL}/upload`, {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`)
  }

  return response.json()
}

// Get all documents
export async function getDocuments(): Promise<Document[]> {
  // Include device_id as a query parameter if available
  const url = currentDeviceId
    ? `${API_URL}/documents?device_id=${encodeURIComponent(currentDeviceId)}`
    : `${API_URL}/documents`

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Failed to fetch documents: ${response.statusText}`)
  }

  return response.json()
}

// Delete a document
export async function deleteDocument(docId: string): Promise<void> {
  // Include device_id as a query parameter if available
  const url = currentDeviceId
    ? `${API_URL}/documents/${docId}?device_id=${encodeURIComponent(currentDeviceId)}`
    : `${API_URL}/documents/${docId}`

  const response = await fetch(url, {
    method: "DELETE",
  })

  if (!response.ok) {
    throw new Error(`Failed to delete document: ${response.statusText}`)
  }
}

// Create a new chat session for a document
export async function createSession(docId: string): Promise<Session> {
  // Include device_id in the request body if available
  const body = currentDeviceId ? { device_id: currentDeviceId } : {}

  const response = await fetch(`${API_URL}/create_session/${docId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(`Failed to create session: ${response.statusText}`)
  }

  return response.json()
}

// Send a chat message
export async function sendChatMessage(sessionId: string, message: string): Promise<ChatMessage> {
  const payload: any = {
    session_id: sessionId,
    message,
  }

  // Add device_id to the payload if available
  if (currentDeviceId) {
    payload.device_id = currentDeviceId
  }

  const response = await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(`Chat failed: ${response.statusText}`)
  }

  return response.json()
}

// Submit a URL to be processed
export async function submitUrl(url: string): Promise<Document> {
  const payload: any = { url }

  // Add device_id to the payload if available
  if (currentDeviceId) {
    payload.device_id = currentDeviceId
  }

  const response = await fetch(`${API_URL}/add_url`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(`URL submission failed: ${response.statusText}`)
  }

  return response.json()
}
