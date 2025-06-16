"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, Cloud, Mic, Volume2, RefreshCw, Settings } from "lucide-react"

interface GoogleCloudStatusProps {
  onStatusChange?: (status: any) => void
}

export default function GoogleCloudStatus({ onStatusChange }: GoogleCloudStatusProps) {
  const [status, setStatus] = useState({
    speechToText: false,
    textToSpeech: false,
    projectId: "intimitymaster",
    loading: true,
    lastChecked: null as Date | null,
  })

  const checkGoogleCloudStatus = async () => {
    setStatus((prev) => ({ ...prev, loading: true }))

    try {
      const response = await fetch("/api/system-status")
      const data = await response.json()

      const newStatus = {
        speechToText: data.speechToText || false,
        textToSpeech: data.textToSpeech || false,
        projectId: "intimitymaster",
        loading: false,
        lastChecked: new Date(),
      }

      setStatus(newStatus)
      onStatusChange?.(newStatus)
    } catch (error) {
      console.error("Failed to check Google Cloud status:", error)
      setStatus((prev) => ({ ...prev, loading: false }))
    }
  }

  useEffect(() => {
    checkGoogleCloudStatus()
  }, [])

  const isFullyOperational = status.speechToText && status.textToSpeech
  const isPartiallyOperational = status.speechToText || status.textToSpeech

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            Google Cloud AI Services
          </div>
          <Button variant="outline" size="sm" onClick={checkGoogleCloudStatus} disabled={status.loading}>
            <RefreshCw className={`h-3 w-3 mr-1 ${status.loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Status */}
        <Alert
          className={
            isFullyOperational
              ? "border-green-200 bg-green-50"
              : isPartiallyOperational
                ? "border-yellow-200 bg-yellow-50"
                : "border-red-200 bg-red-50"
          }
        >
          {isFullyOperational ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          )}
          <AlertDescription className={isFullyOperational ? "text-green-800" : "text-yellow-800"}>
            {isFullyOperational
              ? "All Google Cloud AI services are operational"
              : isPartiallyOperational
                ? "Some Google Cloud AI services are available"
                : "Google Cloud AI services are not available"}
          </AlertDescription>
        </Alert>

        {/* Service Details */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Mic className="h-4 w-4 text-gray-600" />
              <span className="font-medium">Speech-to-Text</span>
            </div>
            <Badge variant={status.speechToText ? "default" : "secondary"}>
              {status.speechToText ? "Active" : "Inactive"}
            </Badge>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-gray-600" />
              <span className="font-medium">Text-to-Speech</span>
            </div>
            <Badge variant={status.textToSpeech ? "default" : "secondary"}>
              {status.textToSpeech ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>

        {/* Project Information */}
        <div className="border-t pt-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Project ID:</span>
            <code className="bg-gray-100 px-2 py-1 rounded text-xs">{status.projectId}</code>
          </div>
          {status.lastChecked && (
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-gray-600">Last Checked:</span>
              <span className="text-xs text-gray-500">{status.lastChecked.toLocaleTimeString()}</span>
            </div>
          )}
        </div>

        {/* Configuration Help */}
        {!isFullyOperational && (
          <Alert>
            <Settings className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <div className="space-y-2">
                <p>
                  <strong>Configuration Steps:</strong>
                </p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>Ensure google-credentials.json is in your project root</li>
                  <li>Enable Speech-to-Text and Text-to-Speech APIs in Google Cloud Console</li>
                  <li>Verify service account has proper permissions</li>
                  <li>
                    Check that the project ID matches: <code>intimitymaster</code>
                  </li>
                </ol>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Features Available */}
        <div className="text-xs text-gray-600">
          <p>
            <strong>Available Features:</strong>
          </p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li className={status.speechToText ? "text-green-600" : "text-gray-400"}>Voice medication search</li>
            <li className={status.textToSpeech ? "text-green-600" : "text-gray-400"}>Audio medication information</li>
            <li className="text-green-600">Text-based search (always available)</li>
            <li className="text-green-600">Medication database access</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
