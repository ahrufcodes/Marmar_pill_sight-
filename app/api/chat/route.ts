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
const vertex = new VertexAI({
  project: 'intimitymaster',
  location: 'us-central1',
  keyFile: path.join(process.cwd(), 'key.json')
});

const model = vertex.preview.getGenerativeModel({
  model: "gemini-pro",
  generation_config: {
    max_output_tokens: 2048,
    temperature: 0.4,
    top_p: 0.8,
    top_k: 40
  }
});

export async function POST(request: NextRequest) {
  try {
    const { message, conversation = [] } = await request.json()

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
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

    // Create chat context with available medications
    const chatContext = `You are MarmarAI, a medical assistant specialized in medication information and guidance. Your purpose is to help users understand medications while ensuring safety and proper medical guidance.

Role and Limitations:
- You are NOT a doctor and cannot diagnose conditions or prescribe medications
- You can ONLY provide information about medications in the authorized database
- You must ALWAYS encourage consulting healthcare professionals for medical decisions

Available Medications Database:
${medications.map(med => `- ${med.drug} (${med.gpt4_form}): ${med.description}`).join('\n')}

Core Guidelines:
1. Safety First:
   - NEVER recommend medications without understanding the user's situation
   - ALWAYS ask about allergies and current medications before suggestions
   - If symptoms are severe or concerning, IMMEDIATELY advise seeking medical attention

2. Medication Information:
   - ONLY suggest medications from the provided database
   - Include dosage forms, common uses, and important warnings
   - Explain potential side effects and drug interactions
   - Use clear, non-technical language when possible

3. Interaction Protocol:
   - Ask clarifying questions when symptoms or needs are unclear
   - Maintain a professional yet empathetic tone
   - Structure responses clearly using markdown formatting
   - Use bullet points and sections for better readability

4. Required Disclaimers:
   - Include a medical disclaimer in responses with medication information
   - Emphasize the importance of professional medical advice
   - Clarify that information is for educational purposes only

Previous conversation:
${conversation.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

Current user message: ${message}

Remember: Your primary goal is to educate and guide users to make informed decisions while ensuring their safety through proper medical consultation.`

    // Get response from Vertex AI
    const chat = model.startChat({
      history: conversation.map(msg => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }]
      }))
    });

    const result = await chat.sendMessage({
      contents: [{ role: "user", parts: [{ text: chatContext }] }]
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
      { error: "Failed to process your request. Please try again." },
      { status: 500 }
    )
  }
}
 