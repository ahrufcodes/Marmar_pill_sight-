import { NextResponse } from 'next/server'
import { getCollection } from '@/lib/db'
import { initVectorSearch } from '@/lib/vector-search'

export const runtime = 'nodejs' // Force Node.js runtime

export async function GET() {
  try {
    console.log('🌱 Starting database initialization...')
    console.log('🔄 Testing MongoDB connection...')
    
    const collection = await getCollection('drug_forms')
    console.log('✅ Successfully connected to MongoDB')
    
    // Create basic indexes
    console.log('📊 Creating basic indexes...')
    await collection.createIndex({ drug: 1 })
    await collection.createIndex({ gpt4_form: 1 })
    console.log('✅ Basic indexes created successfully')
    
    // Initialize vector search
    console.log('🔄 Starting vector search initialization...')
    const searchInit = await initVectorSearch()
    
    // Get current count
    const count = await collection.countDocuments()
    console.log(`✅ Database contains ${count} documents`)
    
    return NextResponse.json({ 
      status: 'Database initialized successfully',
      documentCount: count,
      vectorSearch: searchInit.vectorSearch ? 'enabled' : 'fallback'
    })
    
  } catch (error) {
    console.error('❌ Database initialization error:', error)
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      })
    }
    return NextResponse.json(
      { error: 'Failed to initialize database', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 