import { MongoClient } from 'mongodb'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017"
export const DB_NAME = "marmar_pillsight"
export const COLLECTION_NAME = "drug_forms"

let client: MongoClient
let clientPromise: Promise<MongoClient>

if (!MONGODB_URI) {
  throw new Error("Please add your Mongo URI to .env.local")
}

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
  }

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(MONGODB_URI)
    globalWithMongo._mongoClientPromise = client.connect()
  }
  clientPromise = globalWithMongo._mongoClientPromise
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(MONGODB_URI)
  clientPromise = client.connect()
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export { clientPromise }

// Helper function to get database instance
export async function getDatabase() {
  try {
    const client = await clientPromise
    return client.db(DB_NAME)
  } catch (error) {
    console.error('Failed to get database:', error)
    throw new Error('Database connection failed')
  }
}

// Helper function to get a collection
export async function getCollection(collectionName: string) {
  const client = await clientPromise
  const db = client.db(DB_NAME)
  return db.collection(collectionName)
}

// Initialize database connection and setup
export async function initDatabase() {
  try {
    console.log('🔄 Initializing database connection...')
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection(COLLECTION_NAME)
    
    // Verify the connection
    await db.command({ ping: 1 })
    console.log('✅ Connected to MongoDB successfully')

    // Drop existing text indexes
    const indexes = await collection.indexes()
    for (const index of indexes) {
      if (index.name.includes('text')) {
        await collection.dropIndex(index.name)
        console.log(`🗑️ Dropped existing text index: ${index.name}`)
      }
    }

    // Create text search index
    await collection.createIndex(
      { 
        drug: "text",
        gpt4_form: "text",
        description: "text"
      },
      {
        weights: {
          drug: 10,
          gpt4_form: 5,
          description: 1
        },
        name: "text_search_index"
      }
    )
    console.log('✅ Created new text search index')

    // Create regular indexes for regex searches
    await collection.createIndex({ drug: 1 })
    await collection.createIndex({ gpt4_form: 1 })
    await collection.createIndex({ description: 1 })
    console.log('✅ Created regular indexes')

    // Log database status
    const stats = await db.stats()
    console.log('📊 Database Stats:', {
      collections: stats.collections,
      indexes: stats.indexes,
      avgObjSize: stats.avgObjSize,
      dataSize: stats.dataSize,
    })

    return true
  } catch (error) {
    console.error('❌ MongoDB initialization error:', error)
    return false // Return false instead of throwing to handle gracefully
  }
} 