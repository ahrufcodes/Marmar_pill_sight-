import { NextResponse } from "next/server"
import { MongoClient } from "mongodb"
import { SpeechClient } from "@google-cloud/speech"
import { TextToSpeechClient } from "@google-cloud/text-to-speech"
import { SentenceTransformer } from "@/lib/embeddings"
import path from "path"

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable inside .env.local")
}

export async function GET() {
  const status = {
    database: false,
    aiModel: false,
    googleCloud: false,
    webrtc: false, // Will be checked on client side
    speechToText: false,
    textToSpeech: false,
  }

  // Check MongoDB connection
  try {
    console.log("🔍 Checking MongoDB connection...")
    const client = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    })
    await client.connect()
    await client.db().admin().ping()
    await client.close()
    status.database = true
    console.log("✅ MongoDB connection successful")
  } catch (error) {
    console.warn("❌ MongoDB connection failed:", error)
  }

  // Check if AI model (SentenceTransformer) is working
  try {
    console.log("🔍 Checking AI model...")
    // Test encode with a simple string
    const testEmbedding = await SentenceTransformer.encode("test")
    const testEmbedding2 = await SentenceTransformer.encode("test2")
    const similarity = SentenceTransformer.cosineSimilarity(testEmbedding, testEmbedding2)
    status.aiModel = Array.isArray(testEmbedding) && testEmbedding.length > 0 && typeof similarity === 'number'
    console.log("✅ AI model check successful")
  } catch (error) {
    console.warn("❌ AI model check failed:", error)
  }

  // Check Google Cloud Speech-to-Text
  try {
    console.log("🔍 Checking Google Cloud Speech-to-Text...")
    const credentialsPath = path.join(process.cwd(), "google-credentials.json")
    const speechClient = new SpeechClient({
      keyFilename: credentialsPath,
      projectId: "intimitymaster",
    })

    // Test with a simple request
    await speechClient.getProjectId()
    status.speechToText = true
    status.googleCloud = true
    console.log("✅ Google Cloud Speech-to-Text available")
  } catch (error) {
    console.warn("❌ Google Cloud Speech-to-Text check failed:", error)
  }

  // Check Google Cloud Text-to-Speech
  try {
    console.log("🔍 Checking Google Cloud Text-to-Speech...")
    const credentialsPath = path.join(process.cwd(), "google-credentials.json")
    const ttsClient = new TextToSpeechClient({
      keyFilename: credentialsPath,
      projectId: "intimitymaster",
    })

    await ttsClient.getProjectId()
    status.textToSpeech = true
    status.googleCloud = true
    console.log("✅ Google Cloud Text-to-Speech available")
  } catch (error) {
    console.warn("❌ Google Cloud Text-to-Speech check failed:", error)
  }

  // Overall Google Cloud status
  status.googleCloud = status.speechToText || status.textToSpeech

  console.log("📊 System Status Summary:", status)

  return NextResponse.json(status)
}
