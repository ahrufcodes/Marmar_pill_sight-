import { NextResponse } from "next/server"
import { VertexAI } from "@google-cloud/vertexai"

// Initialize Vertex AI with the correct configuration
const vertexAI = new VertexAI({
  project: process.env.GOOGLE_CLOUD_PROJECT || "",
  location: 'us-central1'
});

const model = vertexAI.preview.getGenerativeModel({
  model: "gemini-2.0-flash-001",
  generation_config: {
    maxOutputTokens: 2048,
    temperature: 0.4,
    topP: 0.8,
    topK: 40
  }
});

export async function GET() {
  try {
    console.log('🤖 Testing Vertex AI...')
    
    const prompt = `As a pharmaceutical expert, provide equivalent medications for Panadol (tablet) commonly used in UK.
    Focus on:
    1. Common brand names in different markets
    2. Generic alternatives
    3. Market availability

    Format the response as a JSON object with this structure:
    {
      "equivalents": [
        {
          "name": "medication name",
          "market": "country name",
          "availability": "Available/Limited/Unavailable"
        }
      ]
    }

    Only include verified medications and ensure the JSON is valid.`

    console.log('📝 Sending prompt to Vertex AI...')
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }]}]
    });

    const response = await result.response;
    const text = response.candidates[0].content.parts[0].text;
    console.log('✅ Received Vertex AI response:', text)

    try {
      // Extract JSON from the response
      const jsonStr = text.substring(
        text.indexOf('{'),
        text.lastIndexOf('}') + 1
      )
      const aiResponse = JSON.parse(jsonStr)

      return NextResponse.json({
        success: true,
        aiResponse,
        rawResponse: text
      })

    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError)
      return NextResponse.json({
        success: false,
        error: "Failed to parse AI response",
        rawResponse: text
      })
    }

  } catch (error) {
    console.error("Vertex AI Test error:", error)
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    })
  }
} 