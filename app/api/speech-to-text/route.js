import { NextResponse } from "next/server"
import { SpeechClient } from "@google-cloud/speech"
import path from "path"
import { getAudioBasedExplanation } from "@/lib/ai-explanation"

// Initialize Google Cloud Speech client with your credentials
let speechClient = null

try {
  const credentialsPath = path.join(process.cwd(), "google-credentials.json")
  speechClient = new SpeechClient({
    keyFilename: credentialsPath,
    projectId: "intimitymaster",
  })
  console.log("✅ Google Cloud Speech client initialized successfully")
} catch (error) {
  console.warn("⚠️ Google Cloud Speech client initialization failed:", error)
}

export async function POST(request) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get("audio")

    if (!audioFile) {
      return NextResponse.json({ error: "Audio file is required" }, { status: 400 })
    }

    console.log(`📁 Processing audio file: ${audioFile.name} (${audioFile.size} bytes)`)

    // Convert file to buffer
    const audioBuffer = Buffer.from(await audioFile.arrayBuffer())
    const audioBase64 = audioBuffer.toString('base64')

    // Try Google Cloud Speech-to-Text first
    if (speechClient) {
      try {
        const transcript = await googleSpeechToText(audioBuffer, audioFile.type)
        console.log(`✅ Google Speech-to-Text successful: "${transcript}"`)
        
        // Get enhanced response using multimodal model
        const enhancedResponse = await getAudioBasedExplanation(audioBase64, transcript)
        
        return NextResponse.json({
          transcript,
          enhancedResponse,
          source: "google-cloud",
          confidence: "high",
        })
      } catch (googleError) {
        console.warn("⚠️ Google Speech-to-Text failed:", googleError)
      }
    }

    // Fallback to mock response for demo
    const mockTranscript = generateMockTranscript(audioFile.name)
    console.log(`🎭 Using mock transcript: "${mockTranscript}"`)

    return NextResponse.json({
      transcript: mockTranscript,
      enhancedResponse: "This is a mock response. In production, this would be an AI-generated response based on your audio query.",
      source: "mock",
      confidence: "demo",
    })
  } catch (error) {
    console.error("❌ Speech-to-text API error:", error)
    return NextResponse.json({ error: "Failed to process audio" }, { status: 500 })
  }
}

async function googleSpeechToText(audioBuffer, mimeType) {
  if (!speechClient) {
    throw new Error("Google Cloud Speech client not available")
  }

  // Determine encoding based on file type
  let encoding = "WEBM_OPUS"
  let sampleRateHertz = 16000

  if (mimeType.includes("wav")) {
    encoding = "LINEAR16"
    sampleRateHertz = 16000
  } else if (mimeType.includes("mp3")) {
    encoding = "MP3"
    sampleRateHertz = 16000
  } else if (mimeType.includes("flac")) {
    encoding = "FLAC"
    sampleRateHertz = 16000
  }

  const request = {
    audio: {
      content: audioBuffer.toString("base64"),
    },
    config: {
      encoding,
      sampleRateHertz,
      languageCode: "en-US",
      enableAutomaticPunctuation: true,
      model: "medical_conversation", // Optimized for medical terminology
      useEnhanced: true,
      alternativeLanguageCodes: ["en-GB", "en-AU"], // Fallback languages
    },
  }

  console.log(`🎤 Sending audio to Google Cloud Speech-to-Text (${encoding}, ${sampleRateHertz}Hz)`)

  const [response] = await speechClient.recognize(request)

  if (!response.results || response.results.length === 0) {
    throw new Error("No speech detected in audio")
  }

  const transcription = response.results
    .map((result) => result.alternatives?.[0]?.transcript)
    .filter(Boolean)
    .join(" ")

  if (!transcription) {
    throw new Error("Empty transcription result")
  }

  return transcription.trim()
}

function generateMockTranscript(filename) {
  const mockTranscripts = [
    "I need pain relief medication for my headache",
    "Find something for fever and body aches",
    "Search for allergy medicine that won't make me drowsy",
    "What helps with stomach pain and nausea",
    "I'm looking for blood pressure medication",
    "Can you find anti-inflammatory drugs",
    "I need something for cold and flu symptoms",
    "Search for sleep aid medication",
  ]

  return mockTranscripts[Math.floor(Math.random() * mockTranscripts.length)]
}
