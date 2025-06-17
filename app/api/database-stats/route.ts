import { NextResponse } from "next/server"
import { getCollection } from "@/lib/db"

export async function GET() {
  try {
    const collection = await getCollection('drug_forms')
    
    // Get total count
    const totalMedications = await collection.countDocuments()

    // Get sample documents
    const sampleDocs = await collection
      .find({})
      .limit(10)
      .toArray()

    // Get unique forms
    const uniqueForms = await collection.distinct('gpt4_form')

    // Get unique drugs starting with each letter
    const drugsByLetter = await collection.aggregate([
      {
        $group: {
          _id: { $substr: ["$drug", 0, 1] },
          count: { $sum: 1 },
          examples: { $push: "$drug" }
        }
      },
      { $sort: { _id: 1 } }
    ]).toArray()

    return NextResponse.json({
      status: "success",
      totalMedications,
      uniqueForms,
      drugsByLetter,
      sampleDocs
    })
  } catch (error) {
    console.error("Database stats error:", error)
    return NextResponse.json({ 
      status: "error",
      error: "Failed to get database stats",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
