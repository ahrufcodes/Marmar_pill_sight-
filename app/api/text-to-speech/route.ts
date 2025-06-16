import { type NextRequest, NextResponse } from "next/server"
import { TextToSpeechClient } from "@google-cloud/text-to-speech"
import path from "path"

// Initialize Google Cloud Text-to-Speech client
let ttsClient: TextToSpeechClient | null = null

try {
  const credentialsPath = path.join(process.cwd(), "google-credentials.json")
  ttsClient = new TextToSpeechClient({
    keyFilename: credentialsPath,
    projectId: "intimitymaster",
  })
  console.log("✅ Google Cloud Text-to-Speech client initialized successfully")
} catch (error) {
  console.warn("⚠️ Google Cloud Text-to-Speech client initialization failed:", error)
}

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    console.log(`🗣️ Generating speech for: "${text.substring(0, 50)}..."`)

    // Try Google Cloud Text-to-Speech
    if (ttsClient) {
      try {
        const audioBuffer = await googleTextToSpeech(text)
        console.log(`✅ Google Text-to-Speech successful (${audioBuffer.length} bytes)`)

        return new NextResponse(audioBuffer, {
          headers: {
            "Content-Type": "audio/mpeg",
            "Content-Length": audioBuffer.length.toString(),
            "Cache-Control": "public, max-age=3600", // Cache for 1 hour
          },
        })
      } catch (googleError) {
        console.warn("⚠️ Google Text-to-Speech failed:", googleError)
      }
    }

    // Fallback - return error message
    console.log("🚫 Text-to-speech service not available")
    return NextResponse.json(
      {
        error: "Text-to-speech service temporarily unavailable",
        fallback: "Please read the text response instead",
      },
      { status: 503 },
    )
  } catch (error) {
    console.error("❌ Text-to-speech API error:", error)
    return NextResponse.json({ error: "Failed to generate speech" }, { status: 500 })
  }
}

async function googleTextToSpeech(text: string): Promise<Buffer> {
  if (!ttsClient) {
    throw new Error("Google Cloud Text-to-Speech client not available")
  }

  // Clean and prepare text for speech synthesis
  const cleanText = text
    .replace(/[^\w\s.,!?-]/g, "") // Remove special characters
    .substring(0, 5000) // Limit text length

  const request = {
    input: { text: cleanText },
    voice: {
      languageCode: "en-US",
      name: "en-US-Neural2-F", // High-quality neural voice
      ssmlGender: "FEMALE" as const,
    },
    audioConfig: {
      audioEncoding: "MP3" as const,
      speakingRate: 0.9, // Slightly slower for medical terms
      pitch: 0.0,
      volumeGainDb: 0.0,
      effectsProfileId: ["headphone-class-device"], // Optimize for headphones
    },
  }

  console.log(`🎵 Synthesizing speech with Google Cloud TTS`)

  const [response] = await ttsClient.synthesizeSpeech(request)

  if (!response.audioContent) {
    throw new Error("No audio content generated")
  }

  return Buffer.from(response.audioContent)
}
