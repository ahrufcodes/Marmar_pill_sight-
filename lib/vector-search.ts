import { MongoClient } from 'mongodb';
import { clientPromise, DB_NAME, COLLECTION_NAME } from './db';

// Initialize vector search index
export async function initVectorSearch() {
  try {
    console.log('🔄 Initializing vector search...');
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    // Drop existing text indexes
    const indexes = await collection.indexes();
    const textIndexes = indexes.filter(index => index.name.includes('text'));
    for (const index of textIndexes) {
      await collection.dropIndex(index.name);
    }

    // Create text search index with updated weights
    console.log('📊 Creating text search index...');
    await collection.createIndex(
      { 
        drug: "text",
        gpt4_form: "text",
        description: "text",
        common_uses: "text"
      },
      {
        weights: {
          drug: 10,
          gpt4_form: 5,
          description: 2,
          common_uses: 1
        },
        name: "text_search",
        default_language: "english"
      }
    );

    // Create regular indexes for exact matches
    await collection.createIndex({ drug: 1 });
    await collection.createIndex({ gpt4_form: 1 });

    return true;
  } catch (error) {
    console.error('❌ Failed to initialize search:', error);
    return false;
  }
}

// Perform vector search
export async function vectorSearch(query: string, limit: number = 5) {
  try {
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    // First try text search
    const textResults = await collection
      .find(
        { $text: { $search: query } },
        { score: { $meta: "textScore" } }
      )
      .sort({ score: { $meta: "textScore" } })
      .limit(limit)
      .toArray();

    if (textResults.length > 0) {
      return textResults;
    }

    // Fallback to regex search
    return await collection
      .find({
        $or: [
          { drug: { $regex: query, $options: "i" } },
          { gpt4_form: { $regex: query, $options: "i" } },
          { description: { $regex: query, $options: "i" } },
          { common_uses: { $regex: query, $options: "i" } }
        ]
      })
      .limit(limit)
      .toArray();
  } catch (error) {
    console.error('❌ Vector search error:', error);
    return [];
  }
}

// Helper function to convert embedding to search terms
async function generateSearchText(embedding: number[]): Promise<string> {
  // Get the most significant dimensions
  const significantDimensions = embedding
    .map((value, index) => ({ value: Math.abs(value), index }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
  
  // Convert to search terms based on the medical domain
  const searchTerms = significantDimensions.map(dim => {
    const value = embedding[dim.index];
    // Map dimensions to common medical search terms
    const terms = [
      'medication', 'drug', 'medicine',
      'tablet', 'capsule', 'syrup',
      'pain', 'relief', 'treatment',
      'symptom', 'condition', 'health'
    ];
    return terms[dim.index % terms.length];
  });
  
  return searchTerms.join(' ');
} 