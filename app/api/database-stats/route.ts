import { NextResponse } from "next/server"
import { getCollection } from "@/lib/db"

export async function GET() {
  try {
    const collection = await getCollection('drug_forms')
    
    // Get total count
    const totalMedications = await collection.countDocuments()

    // Get form distribution
    const formDistribution = await collection
      .aggregate([
        { $group: { _id: "$gpt4_form", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
      .toArray()

    // Calculate percentages
    const formDistributionWithPercentage = formDistribution.map((form) => ({
      form: form._id,
      count: form.count,
      percentage: (form.count / totalMedications) * 100,
    }))

    // Get popular searches (based on common conditions/symptoms)
    const popularSearches = [
      { query: "pain relief", count: await collection.countDocuments({ description: /pain relief/i }) },
      { query: "headache", count: await collection.countDocuments({ description: /headache/i }) },
      { query: "fever", count: await collection.countDocuments({ description: /fever/i }) },
      { query: "allergy", count: await collection.countDocuments({ description: /allergy/i }) },
      { query: "blood pressure", count: await collection.countDocuments({ description: /blood pressure/i }) },
    ]

    return NextResponse.json({
      totalMedications,
      formDistribution: formDistributionWithPercentage,
      recentSearches: totalMedications, // Using total count as placeholder
      popularSearches,
    })
  } catch (error) {
    console.error("Database stats error:", error)
    return NextResponse.json({ 
      error: "Failed to fetch database statistics. Please try again later or contact support if the issue persists." 
    }, { status: 500 })
  }
}
