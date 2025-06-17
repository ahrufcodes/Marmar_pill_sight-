import { NextRequest, NextResponse } from "next/server"
import { getCollection } from "@/lib/db"
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

export async function POST(request: NextRequest) {
  try {
    const { drugName, form, country } = await request.json()

    if (!drugName || !form || !country) {
      return NextResponse.json(
        { error: "Drug name, form, and country are required" },
        { status: 400 }
      )
    }

    console.log('🔍 Searching for:', { drugName, form, country })

    const collection = await getCollection('drug_forms')
    
    // First try database search
    const databaseResult = await collection
      .findOne({
        $and: [
          {
            $or: [
              { drug: { $regex: `^${drugName}$`, $options: "i" } },
              { drug: { $regex: drugName, $options: "i" } }
            ]
          },
          { gpt4_form: { $regex: form, $options: "i" } },
          { country: { $regex: country, $options: "i" } }
        ]
      })

    // If found in database, return the result
    if (databaseResult) {
      console.log('✅ Found in database:', databaseResult.drug)
      
      return NextResponse.json({
        originalDrug: drugName,
        originalForm: form,
        targetCountry: country,
        equivalent: databaseResult.drug,
        source: "database"
      })
    }

    // If not found in database, use AI
    console.log('🤖 Using AI fallback')
    
    const prompt = `As a pharmaceutical expert, I need the equivalent name for ${drugName} (${form}) in ${country}.

Important:
1. Only provide the equivalent medication name that is commonly used in ${country}
2. If it's the same name, explain any differences in branding or usage
3. Focus on accuracy and common local usage

Format the response as a JSON object with this exact structure:
{
  "equivalent": "medication name in ${country}",
  "explanation": "A brief explanation of the equivalence and any important notes about local usage"
}

Ensure:
- The equivalent name is commonly recognized in ${country}
- The explanation is clear and concise
- The JSON is valid and follows the exact structure above
- Only include verified information`

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }]}]
    });

    const response = await result.response;
    const text = response.candidates[0].content.parts[0].text;
    
    try {
      // Extract JSON from the response
      const jsonStr = text.substring(
        text.indexOf('{'),
        text.lastIndexOf('}') + 1
      )
      const aiResponse = JSON.parse(jsonStr)

      return NextResponse.json({
        originalDrug: drugName,
        originalForm: form,
        targetCountry: country,
        equivalent: aiResponse.equivalent,
        explanation: aiResponse.explanation,
        source: "ai"
      })

    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError)
      return NextResponse.json({
        error: "Failed to process AI response",
        details: "The AI response was not in the expected format"
      }, { status: 500 })
    }

  } catch (error) {
    console.error("MedCompare API error:", error)
    return NextResponse.json(
      { 
        error: "Failed to process your request",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
} 