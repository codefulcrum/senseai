"use client"

import { useState, useEffect } from "react"
import {
  Trash2,
  FileText,
  FileSpreadsheet,
  FileCode,
  Link,
  Copy,
  Check,
  ExternalLink,
  MessageCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { type Document, getDocuments, deleteDocument, createSession } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface DocumentWithSource extends Document {
  source?: "file" | "url"
  sourceUrl?: string
}

interface DocumentListProps {
  onSessionCreated: (sessionId: string, documentId: string) => void
  refreshTrigger: number
  filter: "documents" | "urls" | "all"
  deviceIdSet?: boolean
}

export function DocumentList({
  onSessionCreated,
  refreshTrigger,
  filter = "all",
  deviceIdSet = true,
}: DocumentListProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [copiedBubbleId, setCopiedBubbleId] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (deviceIdSet) {
      fetchDocuments()
    }
  }, [refreshTrigger, deviceIdSet])

  // Reset copied states after 2 seconds
  useEffect(() => {
    if (copiedId) {
      const timer = setTimeout(() => {
        setCopiedId(null)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [copiedId])

  useEffect(() => {
    if (copiedBubbleId) {
      const timer = setTimeout(() => {
        setCopiedBubbleId(null)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [copiedBubbleId])

  const fetchDocuments = async () => {
    setIsLoading(true)
    try {
      const docs = await getDocuments()
      setDocuments(docs)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch documents",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (docId: string) => {
    try {
      await deleteDocument(docId)
      setDocuments(documents.filter((doc) => doc.id !== docId))
      toast({
        title: "Document deleted",
        description: "The document has been deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive",
      })
    } finally {
      setDocumentToDelete(null)
    }
  }

  const handleCreateSession = async (docId: string) => {
    try {
      const session = await createSession(docId)
      onSessionCreated(session.id, docId)
      toast({
        title: "Session created",
        description: "You can now chat about this content",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create chat session",
        variant: "destructive",
      })
    }
  }

  const copyIframeToClipboard = async (docId: string, docName: string) => {
    // Get the current origin (protocol + hostname + port)
    const origin = window.location.origin

    // Create the iframe HTML code
    const iframeCode = `<iframe 
  src="${origin}/embed/chat/${docId}" 
  width="100%" 
  height="600" 
  frameborder="0" 
  title="Chat with ${docName}"
  allow="clipboard-write"
  style="border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);"
></iframe>`

    try {
      await navigator.clipboard.writeText(iframeCode)
      setCopiedId(docId)
      toast({
        title: "Iframe code copied!",
        description: "You can now embed this chat in your website or open in a new tab.",
      })
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please try again or copy manually.",
        variant: "destructive",
      })
    }
  }

  const copyChatBubbleToClipboard = async (docId: string, docName: string) => {
    // Get the current origin (protocol + hostname + port)
    const origin = window.location.origin

    // Create the chat bubble script
    const chatBubbleScript = `<!-- Start Sense AI Chat Bubble -->
<script>
(function() {
  // Create chat bubble container
  const bubbleContainer = document.createElement('div');
  bubbleContainer.id = 'doc-ai-chat-bubble-container';
  bubbleContainer.style.position = 'fixed';
  bubbleContainer.style.bottom = '20px';
  bubbleContainer.style.right = '20px';
  bubbleContainer.style.zIndex = '9999';
  document.body.appendChild(bubbleContainer);

  // Create chat bubble button
  const bubbleButton = document.createElement('button');
  bubbleButton.id = 'doc-ai-chat-bubble';
  bubbleButton.style.width = '60px';
  bubbleButton.style.height = '60px';
  bubbleButton.style.borderRadius = '50%';
  bubbleButton.style.backgroundColor = '#f23b48';
  bubbleButton.style.color = '#fff';
  bubbleButton.style.border = 'none';
  bubbleButton.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
  bubbleButton.style.cursor = 'pointer';
  bubbleButton.style.display = 'flex';
  bubbleButton.style.alignItems = 'center';
  bubbleButton.style.justifyContent = 'center';
  bubbleButton.style.transition = 'transform 0.3s ease';
  bubbleButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
  bubbleButton.title = "Chat with ${docName}";
  bubbleContainer.appendChild(bubbleButton);

  // Create chat window
  const chatWindow = document.createElement('div');
  chatWindow.id = 'doc-ai-chat-window';
  chatWindow.style.position = 'fixed';
  chatWindow.style.bottom = '90px';
  chatWindow.style.right = '20px';
  chatWindow.style.width = '350px';
  chatWindow.style.height = '500px';
  chatWindow.style.backgroundColor = '#141121';
  chatWindow.style.borderRadius = '12px';
  chatWindow.style.boxShadow = '0 5px 20px rgba(0, 0, 0, 0.2)';
  chatWindow.style.display = 'none';
  chatWindow.style.overflow = 'hidden';
  chatWindow.style.transition = 'all 0.3s ease';
  chatWindow.style.zIndex = '9998';
  
  // Create iframe for chat
  const chatIframe = document.createElement('iframe');
  chatIframe.src = "${origin}/embed/chat/${docId}";
  chatIframe.style.width = '100%';
  chatIframe.style.height = '100%';
  chatIframe.style.border = 'none';
  chatIframe.title = "Chat with ${docName}";
  chatWindow.appendChild(chatIframe);
  
  document.body.appendChild(chatWindow);

  // Toggle chat window when bubble is clicked
  let isOpen = false;
  bubbleButton.addEventListener('click', function() {
    if (isOpen) {
      chatWindow.style.display = 'none';
      bubbleButton.style.transform = 'rotate(0deg)';
    } else {
      chatWindow.style.display = 'block';
      bubbleButton.style.transform = 'rotate(90deg)';
    }
    isOpen = !isOpen;
  });

  // Close chat when clicking outside
  document.addEventListener('click', function(event) {
    if (isOpen && !chatWindow.contains(event.target) && event.target !== bubbleButton) {
      chatWindow.style.display = 'none';
      bubbleButton.style.transform = 'rotate(0deg)';
      isOpen = false;
    }
  });
})();
</script>
<!-- End Sense AI Chat Bubble -->`

    try {
      await navigator.clipboard.writeText(chatBubbleScript)
      setCopiedBubbleId(docId)
      toast({
        title: "Chat bubble script copied!",
        description: "You can now add this chat bubble to your website.",
      })
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please try again or copy manually.",
        variant: "destructive",
      })
    }
  }

  const openInNewTab = async (docId: string) => {
    try {
      // Create a session first
      const session = await createSession(docId)

      // Open the standalone chat page in a new tab
      window.open(`/standalone/chat/${docId}?session=${session.id}`, "_blank")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to open chat in new tab",
        variant: "destructive",
      })
    }
  }

  const getFileIcon = (type: string, source?: string) => {
    if (source === "url") {
      return <Link className="h-6 w-6 text-primary" />
    } else if (type.includes("pdf") || type.includes("word")) {
      return <FileText className="h-6 w-6 text-primary" />
    } else if (type.includes("csv") || type.includes("sheet")) {
      return <FileSpreadsheet className="h-6 w-6 text-primary" />
    } else {
      return <FileCode className="h-6 w-6 text-primary" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB"
    else return (bytes / 1048576).toFixed(1) + " MB"
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // Filter documents based on the selected filter
  const filteredDocuments = documents.filter((doc) => {
    const docWithSource = doc as DocumentWithSource
    if (filter === "all") return true
    if (filter === "documents") return docWithSource.source !== "url"
    if (filter === "urls") return docWithSource.source === "url"
    return true
  })

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (filteredDocuments.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-900 rounded-lg p-6">
        <p className="text-gray-400">
          {filter === "documents"
            ? "No documents added yet"
            : filter === "urls"
              ? "No URLs added yet"
              : "No documents or URLs added yet"}
        </p>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {filteredDocuments.map((doc) => {
          const docWithSource = doc as DocumentWithSource
          const isUrl = docWithSource.source === "url"
          const isCopied = copiedId === doc.id
          const isBubbleCopied = copiedBubbleId === doc.id

          return (
            <Card key={doc.id} className="overflow-hidden bg-gray-800 border-gray-700">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  {getFileIcon(doc.type, docWithSource.source)}
                  <CardTitle className="text-base truncate text-white">{doc.name}</CardTitle>
                  {isUrl && (
                    <Badge variant="outline" className="ml-auto bg-primary text-white border-primary">
                      URL
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-xs text-gray-400">
                  {formatFileSize(doc.size)} • {formatDate(doc.uploadedAt)}
                  {isUrl && docWithSource.sourceUrl && (
                    <div className="mt-1 truncate">
                      <a
                        href={docWithSource.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {docWithSource.sourceUrl}
                      </a>
                    </div>
                  )}
                </CardDescription>
              </CardHeader>
              <CardFooter className="pt-2 flex flex-wrap gap-2 justify-between">
                <div className="flex flex-wrap gap-2">
                  <Button variant="default" size="sm" onClick={() => handleCreateSession(doc.id)}>
                    {isUrl ? "Chat with URL" : "Chat with document"}
                  </Button>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-gray-700 border-gray-600 hover:bg-gray-600"
                        onClick={() => copyIframeToClipboard(doc.id, doc.name)}
                      >
                        {isCopied ? (
                          <>
                            <Check className="h-4 w-4 mr-1 text-green-400" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-1" />
                            Copy iframe
                          </>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Copy iframe code to embed this chat</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-gray-700 border-gray-600 hover:bg-gray-600"
                        onClick={() => copyChatBubbleToClipboard(doc.id, doc.name)}
                      >
                        {isBubbleCopied ? (
                          <>
                            <Check className="h-4 w-4 mr-1 text-green-400" />
                            Copied
                          </>
                        ) : (
                          <>
                            <MessageCircle className="h-4 w-4 mr-1" />
                            Copy Chat bubble
                          </>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Copy chat bubble script for your website</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-gray-700 border-gray-600 hover:bg-gray-600"
                        onClick={() => openInNewTab(doc.id)}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Visit
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Open chat in a new tab</p>
                    </TooltipContent>
                  </Tooltip>
                </div>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-primary hover:bg-gray-700">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-gray-800 border-gray-700 text-white">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete {isUrl ? "URL" : "Document"}</AlertDialogTitle>
                      <AlertDialogDescription className="text-gray-400">
                        Are you sure you want to delete this {isUrl ? "URL" : "document"}? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-gray-700 text-white hover:bg-gray-600">Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-primary hover:bg-primary/80"
                        onClick={() => handleDelete(doc.id)}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </TooltipProvider>
  )
}
