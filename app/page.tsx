"use client"

import { useState, useEffect, useCallback } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileUpload } from "@/components/file-upload"
import { UrlSubmission } from "@/components/url-submission"
import { DocumentList } from "@/components/document-list"
import { DocumentChat } from "@/components/document-chat"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { HorizontalContentFilter } from "@/components/horizontal-content-filter"
import { getDocuments, setDeviceId } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { CookieConsent } from "@/components/cookie-consent"

export default function Page() {
  const [activeTab, setActiveTab] = useState("documents")
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [activeSession, setActiveSession] = useState<{
    sessionId: string
    documentId: string
    documentName: string
  } | null>(null)
  const [contentFilter, setContentFilter] = useState<"all" | "documents" | "urls">("all")
  const [documents, setDocuments] = useState<any[]>([])
  const [deviceIdSet, setDeviceIdSet] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Only fetch documents if device ID is set
    if (deviceIdSet) {
      const fetchAllDocuments = async () => {
        try {
          const docs = await getDocuments()
          setDocuments(docs)
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to fetch documents",
            variant: "destructive",
          })
        }
      }

      fetchAllDocuments()
    }
  }, [refreshTrigger, toast, deviceIdSet])

  const handleCookieConsent = useCallback((deviceId: string) => {
    // Set the device ID in the API client
    setDeviceId(deviceId)
    setDeviceIdSet(true)

    // Refresh documents
    setRefreshTrigger((prev) => prev + 1)
  }, [])

  const handleUploadSuccess = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  const handleSessionCreated = (sessionId: string, documentId: string) => {
    // Find the document name from the documents list
    const document = documents.find((doc) => doc.id === documentId)
    const documentName = document ? document.name : "Document"

    setActiveSession({ sessionId, documentId, documentName })
    setActiveTab("chat")
  }

  const handleBackToDocuments = () => {
    setActiveSession(null)
    setActiveTab("documents")
  }

  // Get the heading text based on the current filter
  const getHeadingText = () => {
    switch (contentFilter) {
      case "documents":
        return "Your Documents"
      case "urls":
        return "Your URLs"
      default:
        return "All Content"
    }
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-secondary">
      <div className="p-6 pb-0">
        <h1 className="text-2xl font-bold text-center mb-6 text-white">Sense AI</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-800">
            <TabsTrigger value="documents" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              Documents & URLs
            </TabsTrigger>
            <TabsTrigger value="chat" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              Chat
            </TabsTrigger>
          </TabsList>

          <TabsContent value="documents" className="h-[calc(100vh-180px)]">
            <div className="flex h-full gap-6">
              {/* Left side - Document List */}
              <div className="w-1/2 flex flex-col">
                <HorizontalContentFilter activeFilter={contentFilter} onFilterChange={setContentFilter} />
                <div className="overflow-auto flex-1 pr-2">
                  <DocumentList
                    onSessionCreated={handleSessionCreated}
                    refreshTrigger={refreshTrigger}
                    filter={contentFilter}
                    deviceIdSet={deviceIdSet}
                  />
                </div>
              </div>

              {/* Right side - Upload Components */}
              <div className="w-1/2 space-y-6">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Upload Document</CardTitle>
                    <CardDescription className="text-gray-400">
                      Upload a document file (PDF, DOC, DOCX, TXT, CSV, XLSX)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FileUpload onUploadSuccess={handleUploadSuccess} />
                  </CardContent>
                </Card>

                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Add URL</CardTitle>
                    <CardDescription className="text-gray-400">
                      Add a webpage URL to chat about its content
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <UrlSubmission onSubmitSuccess={handleUploadSuccess} />
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="chat" className="h-[calc(100vh-180px)]">
            {activeSession ? (
              <DocumentChat
                sessionId={activeSession.sessionId}
                documentId={activeSession.documentId}
                documentName={activeSession.documentName}
                onBack={handleBackToDocuments}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full bg-secondary text-white">
                <p className="text-gray-400 text-center max-w-md">
                  Select a document or URL from the Documents & URLs tab to start a chat session.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Cookie Consent Banner */}
      <CookieConsent onConsent={handleCookieConsent} />
    </div>
  )
}
