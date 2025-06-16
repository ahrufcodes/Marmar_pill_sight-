"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Loader2, Send, AlertCircle, Volume2 } from "lucide-react"
import ReactMarkdown from "react-markdown"

interface Message {
  role: "user" | "assistant"
  content: string
}

interface ChatInterfaceProps {
  onPlayAudio?: (text: string) => void
}

export default function ChatInterface({ onPlayAudio }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput("")
    setError(null)
    setIsLoading(true)

    // Add user message to chat
    setMessages(prev => [...prev, { role: "user", content: userMessage }])

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          conversation: messages
        })
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      const data = await response.json()
      
      // Add assistant message to chat
      setMessages(prev => [...prev, { role: "assistant", content: data.message }])
    } catch (err) {
      setError("Failed to get response. Please try again.")
      console.error("Chat error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[600px]">
      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <CardTitle>Medical Assistant</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === "user"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-900"
                }`}
              >
                <div className="prose prose-sm">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
                {message.role === "assistant" && onPlayAudio && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() => onPlayAudio(message.content)}
                  >
                    <Volume2 className="h-4 w-4 mr-1" />
                    Listen
                  </Button>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />

          {error && (
            <div className="flex items-center justify-center">
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {error}
              </Badge>
            </div>
          )}

          {isLoading && (
            <div className="flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          )}
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe your symptoms or ask about medications..."
          disabled={isLoading}
        />
        <Button type="submit" disabled={isLoading || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
} 