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
    const collection = await getCollection('drug_forms')

    // Try text search first
    const textResults = await collection
      .find(
        { $text: { $search: query } },
        { score: { $meta: "textScore" } }
      )
      .sort({ score: { $meta: "textScore" } })
      .limit(10)
      .toArray()

    if (textResults.length > 0) {
      return NextResponse.json({
        results: textResults.map(result => ({
          ...result,
          confidence: "high",
          source: "database",
          similarity_score: 90 // High confidence text match
        }))
      })
    }

    // Fallback to regex search
    const regexResults = await collection
      .find({
        $or: [
          { drug: { $regex: query, $options: "i" } },
          { gpt4_form: { $regex: query, $options: "i" } },
          { description: { $regex: query, $options: "i" } },
          { common_uses: { $regex: query, $options: "i" } }
        ]
      })
      .limit(10)
      .toArray()

    if (regexResults.length > 0) {
      return NextResponse.json({
        results: regexResults.map(result => ({
          ...result,
          confidence: "medium",
          source: "database",
          similarity_score: 70 // Medium confidence regex match
        }))
      })
    }

    return NextResponse.json({
      results: [],
      message: "No matching medications found. Try rephrasing your search or using different keywords."
    })
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json(
      { error: "Failed to search medications" },
      { status: 500 }
    )
  }
}
