import { NextResponse } from "next/server"
import { getCollection, initDatabase } from "@/lib/db"

export async function GET() {
  try {
    // Initialize database
    const initResult = await initDatabase()
    console.log('Database initialization result:', initResult)

    // Get collection
    const collection = await getCollection('drug_forms')
    
    // Get total count
    const totalMedications = await collection.countDocuments()

    // Get sample documents
    const sampleDocs = await collection
      .find({})
      .limit(5)
      .toArray()

    return NextResponse.json({
      status: "success",
      initialized: initResult,
      totalMedications,
      sampleDocs,
      indexes: await collection.indexes()
    })
  } catch (error) {
    console.error("Database check error:", error)
    return NextResponse.json({ 
      status: "error",
      error: "Failed to check database status",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
} 