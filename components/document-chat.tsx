"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { ArrowUpIcon, ArrowLeftIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { AutoResizeTextarea } from "@/components/autoresize-textarea"
import type { ChatMessage } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface DocumentChatProps {
  sessionId: string
  documentId: string
  documentName?: string
  onBack: () => void
  embedded?: boolean
}

export function DocumentChat({
  sessionId,
  documentId,
  documentName = "Document",
  onBack,
  embedded = false,
}: DocumentChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    // Add a welcome message
    setMessages([
      {
        role: "assistant",
        content: `I'm ready to answer questions about "${documentName}". What would you like to know?`,
      },
    ])
  }, [sessionId, documentName])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: ChatMessage = {
      role: "user",
      content: input,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      console.log("Session ID on Post:", sessionId)
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [userMessage], // Just send the current message
          session_ids: sessionId,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.statusText}`)
      }

      const data = await response.json()

      // Add the assistant's response to the chat
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.content || data.message || "I couldn't process that request.",
        },
      ])
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      })
      console.error("Chat error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      const form = e.currentTarget.form
      if (form) form.requestSubmit()
    }
  }

  return (
    <TooltipProvider>
      <div className="flex h-full flex-col bg-secondary text-white">
        {!embedded && (
          <div className="flex items-center gap-2 border-b border-gray-800 p-4">
            <Button variant="ghost" size="icon" onClick={onBack} className="text-white hover:bg-gray-800">
              <ArrowLeftIcon size={16} />
            </Button>
            <h2 className="text-lg font-semibold truncate">{documentName}</h2>
          </div>
        )}
        {embedded && (
          <div className="border-b border-gray-800 p-4">
            <h2 className="text-lg font-semibold text-center truncate">{documentName}</h2>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                "max-w-[80%] rounded-xl px-3 py-2 text-sm",
                message.role === "assistant"
                  ? "self-start bg-gray-800 text-white"
                  : "self-end bg-primary text-white ml-auto",
              )}
            >
              {message.content}
            </div>
          ))}
          {isLoading && (
            <div className="self-start bg-gray-800 text-white max-w-[80%] rounded-xl px-3 py-2 text-sm">
              <div className="flex space-x-1">
                <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce"></div>
                <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce [animation-delay:0.2s]"></div>
                <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce [animation-delay:0.4s]"></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form
          onSubmit={handleSubmit}
          className="border-input bg-gray-800 focus-within:ring-primary/50 relative mx-6 mb-6 flex items-center rounded-[16px] border border-gray-700 px-3 py-1.5 pr-8 text-sm focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-0"
        >
          <AutoResizeTextarea
            onKeyDown={handleKeyDown}
            onChange={(v) => setInput(v)}
            value={input}
            placeholder={`Ask a question about "${documentName}"...`}
            className="placeholder:text-gray-400 flex-1 bg-transparent focus:outline-none text-white"
            disabled={isLoading}
          />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="absolute bottom-1 right-1 size-6 rounded-full text-primary hover:bg-gray-700"
                disabled={isLoading || !input.trim()}
              >
                <ArrowUpIcon size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent sideOffset={12}>Submit</TooltipContent>
          </Tooltip>
        </form>
      </div>
    </TooltipProvider>
  )
}
