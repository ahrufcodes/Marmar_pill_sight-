import { MongoClient, MongoClientOptions } from 'mongodb'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

export const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://marmarpillsight:1Pne2qkJyEZuKzgh@marmar-pill-new.fghp7jt.mongodb.net/'
export const DB_NAME = "marmar-pillsight"
export const COLLECTION_NAME = "drug_forms"

// MongoDB connection options
const options: MongoClientOptions = {
  maxPoolSize: 10,
  minPoolSize: 5,
  retryWrites: true,
  w: 'majority',
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  compressors: 'none', // Disable compression
  zlibCompressionLevel: 0, // Disable zlib compression
  autoEncryption: undefined, // Remove auto-encryption completely
  forceServerObjectId: true, // Let server assign _id
}

let client: MongoClient
let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
  }

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(MONGODB_URI, options)
    globalWithMongo._mongoClientPromise = client.connect()
      .then(client => {
        console.log('✅ MongoDB connected in development mode')
        return client
      })
      .catch(err => {
        console.error('❌ MongoDB connection error in development:', err)
        throw err
      })
  }
  clientPromise = globalWithMongo._mongoClientPromise
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(MONGODB_URI, options)
  clientPromise = client.connect()
    .then(client => {
      console.log('✅ MongoDB connected in production mode')
      return client
    })
    .catch(err => {
      console.error('❌ MongoDB connection error in production:', err)
      throw err
    })
}

// Export a module-scoped MongoClient promise
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
  try {
    const db = await getDatabase()
    return db.collection(collectionName)
  } catch (error) {
    console.error(`Failed to get collection ${collectionName}:`, error)
    throw new Error('Collection access failed')
  }
}

// Initialize database connection and setup
export async function initDatabase() {
  try {
    console.log('🔄 Initializing database connection...')
    const client = await clientPromise
    const db = client.db(DB_NAME)
    
    // Verify the connection
    await db.command({ ping: 1 })
    console.log('✅ Connected to MongoDB successfully')

    // Create indexes if they don't exist
    const collections = await db.listCollections().toArray()
    const drugFormsExists = collections.some(col => col.name === 'drug_forms')

    if (!drugFormsExists) {
      console.log('📦 Creating drug_forms collection and indexes...')
      await db.createCollection('drug_forms')
      
      // Create indexes
      const indexPromises = [
        db.collection('drug_forms').createIndex({ drug: 1 }, { background: true }),
        db.collection('drug_forms').createIndex({ gpt4_form: 1 }, { background: true }),
        db.collection('drug_forms').createIndex(
          { description: "text" }, 
          { 
            background: true,
            weights: {
              drug: 10,
              gpt4_form: 5,
              description: 1
            }
          }
        )
      ]

      await Promise.all(indexPromises)
      console.log('✅ Indexes created successfully')
    }

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