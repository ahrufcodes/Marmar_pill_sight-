import { NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

export async function GET() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    return NextResponse.json({ error: 'MongoDB URI not found' })
  }

  const client = new MongoClient(uri)

  try {
    await client.connect()
    
    // Check DrugFormDB
    const drugFormDb = client.db('DrugFormDB')
    const drugFormCollections = await drugFormDb.listCollections().toArray()
    const drugFormStats = {
      collections: drugFormCollections.map(c => c.name),
      counts: {}
    }
    
    // Get counts for each collection
    for (const collection of drugFormCollections) {
      drugFormStats.counts[collection.name] = await drugFormDb.collection(collection.name).countDocuments()
    }

    // Check marmar-pillsight
    const marmarDb = client.db('marmar-pillsight')
    const marmarCollections = await marmarDb.listCollections().toArray()
    const marmarStats = {
      collections: marmarCollections.map(c => c.name),
      counts: {}
    }
    
    // Get counts for each collection
    for (const collection of marmarCollections) {
      marmarStats.counts[collection.name] = await marmarDb.collection(collection.name).countDocuments()
    }

    return NextResponse.json({
      DrugFormDB: drugFormStats,
      'marmar-pillsight': marmarStats
    })

  } catch (error) {
    console.error('Database check error:', error)
    return NextResponse.json({ error: 'Failed to check databases' }, { status: 500 })
  } finally {
    await client.close()
  }
} 