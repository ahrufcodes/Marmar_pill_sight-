"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertCircle, RefreshCw, Database, Brain, Cloud, Mic, Volume2 } from "lucide-react"

interface SystemStatusProps {
  status: {
    database: boolean
    aiModel: boolean
    googleCloud: boolean
    webrtc: boolean
    speechToText?: boolean
    textToSpeech?: boolean
  }
  onRetry: () => void
}

export default function SystemStatus({ status, onRetry }: SystemStatusProps) {
  const hasIssues = !status.database || !status.aiModel

  if (!hasIssues && status.googleCloud) {
    return (
      <Alert className="mb-6 border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <div className="flex items-center justify-between">
            <span>All systems operational. Ready to search medications!</span>
            <div className="flex gap-1">
              <Badge variant="default" className="bg-green-100 text-green-800 text-xs">
                <Cloud className="h-3 w-3 mr-1" />
                Google Cloud Active
              </Badge>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert variant={hasIssues ? "destructive" : "default"} className="mb-6">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="font-medium">System Status</p>
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="h-3 w-3 mr-1" />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          <Badge variant={status.database ? "default" : "destructive"} className="text-xs justify-start">
            <Database className="h-3 w-3 mr-1" />
            Database {status.database ? "✓" : "✗"}
          </Badge>

          <Badge variant={status.aiModel ? "default" : "destructive"} className="text-xs justify-start">
            <Brain className="h-3 w-3 mr-1" />
            AI Model {status.aiModel ? "✓" : "✗"}
          </Badge>

          <Badge variant={status.googleCloud ? "default" : "secondary"} className="text-xs justify-start">
            <Cloud className="h-3 w-3 mr-1" />
            Google Cloud {status.googleCloud ? "✓" : "✗"}
          </Badge>

          <Badge variant={status.speechToText ? "default" : "secondary"} className="text-xs justify-start">
            <Mic className="h-3 w-3 mr-1" />
            Speech-to-Text {status.speechToText ? "✓" : "✗"}
          </Badge>

          <Badge variant={status.textToSpeech ? "default" : "secondary"} className="text-xs justify-start">
            <Volume2 className="h-3 w-3 mr-1" />
            Text-to-Speech {status.textToSpeech ? "✓" : "✗"}
          </Badge>

          <Badge variant={status.webrtc ? "default" : "secondary"} className="text-xs justify-start">
            <Mic className="h-3 w-3 mr-1" />
            Voice Recording {status.webrtc ? "✓" : "✗"}
          </Badge>
        </div>

        {!status.googleCloud && (
          <div className="text-sm text-gray-600 bg-blue-50 p-2 rounded">
            💡 <strong>Google Cloud Services:</strong> Speech recognition and text-to-speech features will use fallback
            modes. For full functionality, ensure your Google Cloud credentials are properly configured.
          </div>
        )}
      </AlertDescription>
    </Alert>
  )
}
