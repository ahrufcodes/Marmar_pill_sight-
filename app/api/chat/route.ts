import { NextRequest, NextResponse } from "next/server"
import { VertexAI } from "@google-cloud/vertexai"
import path from "path"
import { getCollection } from "@/lib/db"

export const runtime = 'nodejs' // Force Node.js runtime

const MONGODB_URI = process.env.MONGODB_URI
const DB_NAME = "marmar-pillsight"
const COLLECTION_NAME = "drug_forms"

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable inside .env.local")
}

// Initialize Vertex AI
let vertex: VertexAI;
let model: any;

try {
  vertex = new VertexAI({
    project: 'intimitymaster',
    location: 'us-central1',
    keyFile: path.join(process.cwd(), 'google-credentials.json')
  });

  model = vertex.preview.getGenerativeModel({
    model: "gemini-pro",
    generation_config: {
      max_output_tokens: 2048,
      temperature: 0.4,
      top_p: 0.8,
      top_k: 40
    }
  });

  console.log('✅ Chat Vertex AI initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize Chat Vertex AI:', error);
  model = null;
}

export async function POST(request: NextRequest) {
  try {
    const { message, conversation = [] } = await request.json()

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    if (!model) {
      return NextResponse.json({ 
        error: "Chat service is temporarily unavailable",
        message: "The AI chat service is currently unavailable. Please try again later.",
        medications: []
      }, { status: 503 })
    }

    // Get collection
    const collection = await getCollection('drug_forms')

    // Query medications from MongoDB based on symptoms/conditions
    const medications = await collection
      .find({
        $or: [
          { description: { $regex: message, $options: "i" } },
          { drug: { $regex: message, $options: "i" } },
          { gpt4_form: { $regex: message, $options: "i" } }
        ]
      })
      .limit(5)
      .toArray()

    // Prepare chat context with medication information
    const chatContext = `User Query: ${message}

Found Medications:
${medications.map(med => `- ${med.drug} (${med.gpt4_form})`).join('\n')}

Please provide a helpful response about these medications, focusing on:
1. How they relate to the user's query
2. Key differences between the options
3. General safety considerations
4. When to consult a healthcare provider

Keep the response concise and easy to understand.`

    // Get response from Vertex AI
    const history = conversation.map(msg => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }]
    }));

    // Add current message to history
    history.push({
      role: "user",
      parts: [{ text: chatContext }]
    });

    const result = await model.generateContent({
      contents: history
    });

    const text = result.response.candidates[0].content.parts[0].text;

    return NextResponse.json({
      message: text,
      medications: medications.map(med => ({
        drug: med.drug,
        form: med.gpt4_form,
        description: med.description
      }))
    })
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json(
      { 
        error: "Failed to process your request. Please try again.",
        message: "Chat service is temporarily unavailable. Please try using the search function instead.",
        medications: []
      },
      { status: 500 }
    )
  }
}
 