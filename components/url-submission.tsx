// Update the URL submission component to use our new color scheme
"use client"

import type React from "react"

import { useState } from "react"
import { Link2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { submitUrl } from "@/lib/api"
import { cn } from "@/lib/utils"

interface UrlSubmissionProps {
  onSubmitSuccess: () => void
}

export function UrlSubmission({ onSubmitSuccess }: UrlSubmissionProps) {
  const [url, setUrl] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Basic URL validation
    if (!url.trim()) {
      toast({
        title: "URL required",
        description: "Please enter a valid URL",
        variant: "destructive",
      })
      return
    }

    // Simple URL format validation
    let formattedUrl = url.trim()
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = "https://" + formattedUrl
    }

    try {
      new URL(formattedUrl) // This will throw an error if the URL is invalid
    } catch (error) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      await submitUrl(formattedUrl)

      toast({
        title: "URL added successfully",
        description: "The URL has been added to your documents list",
      })

      // Reset the form
      setUrl("")
      onSubmitSuccess()
    } catch (error) {
      toast({
        title: "Submission failed",
        description: error instanceof Error ? error.message : "Failed to add URL",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Link2 className="h-4 w-4 text-gray-400" />
            </div>
            <Input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter a URL (e.g., example.com)"
              className="pl-10 bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
              disabled={isSubmitting}
            />
          </div>
          <Button
            type="submit"
            disabled={isSubmitting || !url.trim()}
            className={cn(isSubmitting && "opacity-70 cursor-not-allowed")}
          >
            {isSubmitting ? "Adding..." : "Add URL"}
          </Button>
        </div>
        <p className="text-xs text-gray-400 text-center">
          Add a URL to a webpage, article, or document that you want to chat about
        </p>
      </form>
    </div>
  )
}
