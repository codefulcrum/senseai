"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Shield, Cookie } from "lucide-react"
import { v4 as uuidv4 } from "uuid"
import Cookies from "js-cookie"

interface CookieConsentProps {
  onConsent: (deviceId: string) => void
}

export function CookieConsent({ onConsent }: CookieConsentProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Check if user has already given consent
    const hasConsent = Cookies.get("cookie_consent")
    const deviceId = Cookies.get("device_id")

    if (hasConsent && deviceId) {
      // User already consented, pass the existing device ID
      onConsent(deviceId)
    } else {
      // Show the consent banner
      setIsVisible(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Remove onConsent from dependencies to prevent re-renders

  const handleAccept = () => {
    // Generate a unique device ID
    const deviceId = uuidv4()

    // Set cookies with a long expiration (1 year)
    Cookies.set("cookie_consent", "true", { expires: 365 })
    Cookies.set("device_id", deviceId, { expires: 365 })

    // Hide the banner
    setIsVisible(false)

    // Notify parent component
    onConsent(deviceId)
  }

  if (!isVisible) {
    return null
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gray-900 border-t border-gray-800 shadow-lg">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Cookie className="h-6 w-6 text-primary" />
            <div>
              <h3 className="text-lg font-semibold text-white">Cookie Consent</h3>
              <p className="text-sm text-gray-400 max-w-2xl">
                This application uses cookies to enhance your experience and show you personalized content. We generate
                a unique device ID to associate your documents and URLs with your browser.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-white"
              onClick={handleAccept}
            >
              <Shield className="h-4 w-4 mr-2" />
              Accept
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
