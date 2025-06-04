"use client"

import { useEffect, useState, use } from "react"
import { DocumentChat } from "@/components/document-chat"
import { createSession, getDocuments } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useSearchParams } from "next/navigation"

export default function StandaloneChatPage({ params }: { params: { docId: string } }) {
  // Unwrap params using React.use()
  const unwrappedParams = use(params)
  const docId = unwrappedParams.docId

  const [sessionId, setSessionId] = useState<string | null>(null)
  const [documentName, setDocumentName] = useState<string>("Document")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const sessionParam = searchParams.get("session")

  useEffect(() => {
    async function initializeSession() {
      try {
        setIsLoading(true)

        // First, get the document name
        const documents = await getDocuments()
        const document = documents.find((doc: any) => doc.id === docId)

        if (document) {
          setDocumentName(document.name)
          document.title = `Chat with ${document.name}`
        }

        // Use the session from URL params if available, otherwise create a new one
        if (sessionParam) {
          setSessionId(sessionParam)
        } else {
          // Create a new session
          const session = await createSession(docId)
          setSessionId(session.id)
        }
      } catch (err) {
        console.error("Failed to initialize chat:", err)
        setError("Failed to initialize chat. The document may not exist or is still processing.")
        toast({
          title: "Error",
          description: "Failed to initialize chat session",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    initializeSession()
  }, [docId, sessionParam, toast])

  // Update document title
  useEffect(() => {
    if (documentName !== "Document") {
      document.title = `Chat with ${documentName}`
    }
  }, [documentName])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-secondary">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error || !sessionId) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-secondary text-white p-6">
        <div className="bg-gray-800 rounded-lg p-8 max-w-md text-center">
          <h2 className="text-xl font-semibold mb-4">Error Loading Chat</h2>
          <p className="text-gray-400">{error || "Failed to initialize chat session."}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-secondary">
      <DocumentChat
        sessionId={sessionId}
        documentId={docId}
        documentName={documentName}
        onBack={() => window.close()}
        embedded={false}
      />
    </div>
  )
}
