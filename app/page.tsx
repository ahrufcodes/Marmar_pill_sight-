"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Mic, Search, Upload, Brain, Cloud, Pill, Activity, AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import VoiceRecorder from "@/components/voice-recorder"
import MedicationResults from "@/components/medication-results"
import DatabaseStats from "@/components/database-stats"
import SystemStatusComponent from "@/components/system-status"
import GoogleCloudStatus from "@/components/google-cloud-status"

interface SearchResult {
  drug: string
  gpt4_form: string
  similarity_score: number
  description?: string
  match_confidence: "High" | "Medium" | "Low"
}

interface SystemStatus {
  database: boolean
  aiModel: boolean
  googleCloud: boolean
  webrtc: boolean
  speechToText: boolean
  textToSpeech: boolean
}

export default function PillSightApp() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchHistory, setSearchHistory] = useState<Array<{ query: string; results: SearchResult[] }>>([])
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    database: false,
    aiModel: false,
    googleCloud: false,
    webrtc: false,
    speechToText: false,
    textToSpeech: false
  })
  const [isRecording, setIsRecording] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)

  useEffect(() => {
    // Check system status on load
    checkSystemStatus()
  }, [])

  useEffect(() => {
    // Initialize database when app loads
    const initDb = async () => {
      try {
        const response = await fetch('/api/init')
        if (!response.ok) {
          throw new Error('Failed to initialize database')
        }
        const data = await response.json()
        console.log('Database initialization:', data)
      } catch (error) {
        console.error('Failed to initialize database:', error)
      }
    }

    initDb()
  }, [])

  const checkSystemStatus = async () => {
    try {
      const response = await fetch("/api/system-status")
      if (!response.ok) {
        throw new Error("Failed to fetch system status")
      }
      const status = await response.json()
      setSystemStatus(status)
    } catch (error) {
      console.error("Failed to check system status:", error)
      // Set all statuses to false on error
      setSystemStatus({
        database: false,
        aiModel: false,
        googleCloud: false,
        webrtc: false,
        speechToText: false,
        textToSpeech: false
      })
    }
  }

  const handleSearch = async (searchQuery: string = query) => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: searchQuery }),
      })

      if (!response.ok) {
        throw new Error("Search failed")
      }

      const data = await response.json()
      setResults(data.results || [])

      // Add to search history
      const newSearch = { query: searchQuery, results: data.results || [] }
      setSearchHistory((prev) => [newSearch, ...prev.slice(0, 4)]) // Keep last 5 searches
    } catch (error) {
      console.error("Search error:", error)
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleQuickSearch = (searchTerm: string) => {
    setQuery(searchTerm)
    handleSearch(searchTerm)
  }

  const handleVoiceResult = (transcript: string) => {
    setQuery(transcript)
    handleSearch(transcript)
  }

  const playAudio = async (text: string) => {
    try {
      const response = await fetch("/api/text-to-speech", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      })

      if (response.ok) {
        const audioBlob = await response.blob()
        const audioUrl = URL.createObjectURL(audioBlob)
        const audio = new Audio(audioUrl)
        audio.play()
      }
    } catch (error) {
      console.error("Text-to-speech error:", error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-blue-600 rounded-full">
              <Pill className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">MARMAR PillSight</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            AI-Powered Drug Discovery with MongoDB & Vector Search
          </p>
        </div>

        {/* System Status */}
        <SystemStatusComponent status={systemStatus} onRetry={checkSystemStatus} />

        {/* Main Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Search Area */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="text" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="text" className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Text Search
                </TabsTrigger>
                <TabsTrigger value="voice" className="flex items-center gap-2">
                  <Mic className="h-4 w-4" />
                  Voice Input
                </TabsTrigger>
                <TabsTrigger value="stats" className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Database Stats
                </TabsTrigger>
              </TabsList>

              <TabsContent value="text" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Search className="h-5 w-5" />
                      Medication Search
                    </CardTitle>
                    <CardDescription>What symptoms or medications are you looking for?</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Example: I need pain relief medication"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                        className="flex-1"
                      />
                      <Button onClick={() => handleSearch()} disabled={isSearching || !query.trim()} className="px-6">
                        {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                      </Button>
                    </div>

                    {/* Quick Search Buttons */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">Common Searches:</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuickSearch("pain relief medication")}
                          className="justify-start"
                        >
                          💊 Pain Relief
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuickSearch("fever reducer medication")}
                          className="justify-start"
                        >
                          🤒 Fever
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuickSearch("headache relief medication")}
                          className="justify-start"
                        >
                          🤕 Headache
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuickSearch("allergy relief medication")}
                          className="justify-start"
                        >
                          🤧 Allergies
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Search Results */}
                {results.length > 0 && <MedicationResults results={results} onPlayAudio={playAudio} />}

                {/* Search History */}
                {searchHistory.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Recent Searches</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {searchHistory.slice(0, 3).map((search, index) => (
                        <div key={index} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium text-sm">🔍 {search.query}</p>
                            <Badge variant="secondary">{search.results.length} results</Badge>
                          </div>
                          {search.results.length > 0 && (
                            <div className="space-y-1">
                              {search.results.slice(0, 2).map((result, idx) => (
                                <div key={idx} className="text-xs text-gray-600 flex items-center gap-2">
                                  <span
                                    className={
                                      result.similarity_score > 80
                                        ? "text-green-600"
                                        : result.similarity_score > 60
                                          ? "text-yellow-600"
                                          : "text-orange-600"
                                    }
                                  >
                                    {result.similarity_score > 80 ? "🟢" : result.similarity_score > 60 ? "🟡" : "🟠"}
                                  </span>
                                  <span>
                                    {result.drug} ({result.gpt4_form})
                                  </span>
                                  <span className="ml-auto">{result.similarity_score.toFixed(1)}%</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="voice">
                <VoiceRecorder onTranscript={handleVoiceResult} systemStatus={systemStatus} />
              </TabsContent>

              <TabsContent value="stats">
                <DatabaseStats systemStatus={systemStatus} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Database</span>
                  {systemStatus.database ? (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Offline
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">AI Model</span>
                  {systemStatus.aiModel ? (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Loaded
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Failed
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Google Cloud</span>
                  {systemStatus.googleCloud ? (
                    <Badge variant="default" className="bg-blue-100 text-blue-800">
                      <Cloud className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Offline
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Voice Recording</span>
                  {systemStatus.webrtc ? (
                    <Badge variant="default" className="bg-purple-100 text-purple-800">
                      <Mic className="h-3 w-3 mr-1" />
                      Available
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <Upload className="h-3 w-3 mr-1" />
                      Upload Only
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            <GoogleCloudStatus
              onStatusChange={(gcStatus) => {
                setSystemStatus((prev) => ({
                  ...prev,
                  speechToText: gcStatus.speechToText,
                  textToSpeech: gcStatus.textToSpeech,
                  googleCloud: gcStatus.speechToText || gcStatus.textToSpeech,
                }))
              }}
            />

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Search Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Results per search</label>
                  <Input type="number" min="1" max="10" defaultValue="5" className="w-full" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Help</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p>
                  <strong>Voice Commands:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>"Find pain relief medication"</li>
                  <li>"I need something for headache"</li>
                  <li>"Search for allergy medicine"</li>
                  <li>"What helps with fever?"</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
