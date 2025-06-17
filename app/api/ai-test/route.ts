import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

// Initialize Google AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "")
const model = genAI.getGenerativeModel({ model: "gemini-pro" })

export async function GET() {
  try {
    console.log('🤖 Testing AI...')
    
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

    console.log('📝 Sending prompt to AI...')
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    console.log('✅ Received AI response:', text)

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
    console.error("AI Test error:", error)
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    })
  }
} 