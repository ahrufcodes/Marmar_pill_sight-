"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Mic, Upload, Square, Loader2, AlertCircle, CheckCircle } from "lucide-react"

interface VoiceRecorderProps {
  onTranscript: (transcript: string) => void
  systemStatus: {
    webrtc: boolean
    googleCloud: boolean
  }
}

export default function VoiceRecorder({ onTranscript, systemStatus }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [transcript, setTranscript] = useState("")
  const [recordingTime, setRecordingTime] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [webrtcAvailable, setWebrtcAvailable] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    checkWebRTCAvailability()
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  const checkWebRTCAvailability = async () => {
    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("WebRTC is not supported in this browser")
      }

      // Try to get audio permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(track => track.stop()) // Clean up
      setWebrtcAvailable(true)
    } catch (err) {
      console.warn("WebRTC not available:", err)
      setWebrtcAvailable(false)
    }
  }

  const startRecording = async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
        },
      })

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      })

      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" })
        const url = URL.createObjectURL(audioBlob)
        setAudioUrl(url)

        // Process the audio
        await processAudio(audioBlob)

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start(1000) // Collect data every second
      setIsRecording(true)
      setRecordingTime(0)

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } catch (err) {
      setError("Failed to access microphone. Please check permissions.")
      console.error("Recording error:", err)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)

      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true)
    try {
      const formData = new FormData()
      formData.append("audio", audioBlob, "recording.webm")

      const response = await fetch("/api/speech-to-text", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to process audio")
      }

      const data = await response.json()
      if (data.transcript) {
        setTranscript(data.transcript)
        onTranscript(data.transcript)
      } else {
        setError("No speech detected in the recording")
      }
    } catch (err) {
      setError("Failed to process audio. Please try again.")
      console.error("Audio processing error:", err)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsProcessing(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("audio", file)

      const response = await fetch("/api/speech-to-text", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to process audio file")
      }

      const data = await response.json()
      if (data.transcript) {
        setTranscript(data.transcript)
        onTranscript(data.transcript)

        // Create audio URL for playback
        const url = URL.createObjectURL(file)
        setAudioUrl(url)
      } else {
        setError("No speech detected in the audio file")
      }
    } catch (err) {
      setError("Failed to process audio file. Please try again.")
      console.error("File processing error:", err)
    } finally {
      setIsProcessing(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Voice Search
          </CardTitle>
          <CardDescription>Use your voice to search for medications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Live Recording */}
          <div className="space-y-4">
            <h4 className="font-medium">🎙️ Live Recording</h4>

            {webrtcAvailable ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Button
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isProcessing}
                    variant={isRecording ? "destructive" : "default"}
                    size="lg"
                  >
                    {isRecording ? (
                      <>
                        <Square className="h-4 w-4 mr-2" />
                        Stop Recording
                      </>
                    ) : (
                      <>
                        <Mic className="h-4 w-4 mr-2" />
                        Start Recording
                      </>
                    )}
                  </Button>

                  {isRecording && (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                      <span className="text-sm font-mono">{formatTime(recordingTime)}</span>
                    </div>
                  )}
                </div>

                {isRecording && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">🔴 Recording in progress... Speak your question!</p>
                    <Progress value={((recordingTime % 60) / 60) * 100} className="w-full" />
                  </div>
                )}
              </div>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>Live recording is not available. Please use file upload instead.</AlertDescription>
              </Alert>
            )}
          </div>

          {/* File Upload */}
          <div className="space-y-3">
            <h4 className="font-medium">📁 Upload Audio File</h4>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600 mb-2">Choose an audio file containing your drug query</p>
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                disabled={isProcessing}
                className="hidden"
                id="audio-upload"
              />
              <label htmlFor="audio-upload">
                <Button variant="outline" disabled={isProcessing} asChild>
                  <span>
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Choose File
                      </>
                    )}
                  </span>
                </Button>
              </label>
            </div>
            <p className="text-xs text-gray-500">Supported formats: WAV, MP3, FLAC, OGG, M4A</p>
          </div>

          {/* Audio Playback */}
          {audioUrl && (
            <div className="space-y-2">
              <h4 className="font-medium">🔊 Recorded Audio</h4>
              <audio controls className="w-full">
                <source src={audioUrl} type="audio/webm" />
                Your browser does not support the audio element.
              </audio>
            </div>
          )}

          {/* Transcript */}
          {transcript && (
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Transcription
              </h4>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm">{transcript}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Voice Commands Help */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Voice Commands</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p className="font-medium">Try saying:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>"Find pain relief medication"</li>
              <li>"I need something for headache"</li>
              <li>"Search for allergy medicine"</li>
              <li>"What medications help with fever?"</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Browser Compatibility */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Browser Compatibility</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Chrome/Edge (Recommended)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Firefox (Supported)</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <span>Safari (Limited Support)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
