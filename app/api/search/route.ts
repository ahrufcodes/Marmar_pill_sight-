import { NextRequest, NextResponse } from "next/server"
import { getCollection } from "@/lib/db"
import { SentenceTransformer } from "@/lib/embeddings"
import { vectorSearch } from "@/lib/vector-search"
import { getAIExplanation } from "@/lib/ai-explanation"

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json()

    if (!query) {
      return NextResponse.json({ error: "Search query is required" }, { status: 400 })
    }

    console.log('🔄 Processing search query:', query)

    // Generate embedding for the search query
    const queryEmbedding = await SentenceTransformer.encode(query)

    // Perform vector search
    console.log('🔄 Performing vector search...')
    const searchResults = await vectorSearch(queryEmbedding)

    // Map confidence levels based on similarity scores
    const resultsWithConfidence = searchResults.map(result => ({
      ...result,
      match_confidence: result.similarity_score > 80 ? "High" : result.similarity_score > 60 ? "Medium" : "Low"
    }))

    console.log(`✅ Found ${resultsWithConfidence.length} results`)

    // If we have results, try to get AI explanations
    if (resultsWithConfidence.length > 0) {
      try {
        console.log('🤖 Generating AI explanations for', resultsWithConfidence.length, 'results')
        const resultsWithExplanations = await Promise.all(
          resultsWithConfidence.map(async (result) => {
            try {
              console.log('📝 Generating explanation for:', result.drug)
              const explanation = await getAIExplanation(result)
              console.log('✅ Generated explanation for:', result.drug)
              return {
                ...result,
                ai_explanation: explanation
              }
            } catch (aiError) {
              console.error("AI Explanation error for", result.drug, ":", aiError)
              return {
                ...result,
                ai_explanation: "AI explanation unavailable at the moment."
              }
            }
          })
        )
        return NextResponse.json({ results: resultsWithExplanations })
      } catch (aiError) {
        console.error("AI Explanations batch error:", aiError)
        // Return results without AI explanations if AI fails
        return NextResponse.json({ 
          results: resultsWithConfidence,
          warning: "AI explanations are temporarily unavailable."
        })
      }
    }

    // No results found
    return NextResponse.json({ 
      results: [],
      message: "No matching medications found." 
    })

  } catch (error) {
    console.error("Search API error:", error)
    return NextResponse.json({ 
      error: "An unexpected error occurred. Please try again later." 
    }, { status: 500 })
  }
}
