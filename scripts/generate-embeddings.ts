import { MongoClient } from 'mongodb'
import { SentenceTransformer } from '../lib/embeddings'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://marmarpillsight:1Pne2qkJyEZuKzgh@marmar-pill-new.fghp7jt.mongodb.net/'
const DB_NAME = "marmar-pillsight"
const COLLECTION_NAME = "drug_forms"

async function generateEmbeddings() {
  console.log('🔄 Starting embeddings generation...')
  
  const client = new MongoClient(MONGODB_URI)
  
  try {
    await client.connect()
    console.log('✅ Connected to MongoDB')
    
    const collection = client.db(DB_NAME).collection(COLLECTION_NAME)
    
    // Get all documents that don't have embeddings yet
    const documents = await collection.find({
      embeddings: { $exists: false }
    }).toArray()
    
    console.log(`📝 Found ${documents.length} documents without embeddings`)
    
    let processed = 0
    for (const doc of documents) {
      try {
        // Generate embedding from combined text fields
        const text = [
          doc.drug,
          doc.gpt4_form,
          doc.description,
          doc.category,
          doc.common_uses
        ].filter(Boolean).join(' ')
        
        const embedding = await SentenceTransformer.encode(text)
        
        // Update document with embedding
        await collection.updateOne(
          { _id: doc._id },
          { 
            $set: { 
              embeddings: embedding,
              vector_updated_at: new Date()
            } 
          }
        )
        
        processed++
        if (processed % 100 === 0) {
          console.log(`✅ Processed ${processed}/${documents.length} documents`)
        }
      } catch (error) {
        console.error(`❌ Error processing document ${doc._id}:`, error)
      }
    }
    
    console.log(`✅ Completed! Generated embeddings for ${processed} documents`)
    
  } catch (error) {
    console.error('❌ Script error:', error)
  } finally {
    await client.close()
  }
}

// Run the script
generateEmbeddings()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  }) 