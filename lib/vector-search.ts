import { MongoClient } from 'mongodb';
import { clientPromise, DB_NAME, COLLECTION_NAME } from './db';

// Initialize vector search index
export async function initVectorSearch() {
  try {
    console.log('🔄 Initializing vector search...');
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    // Create text search index as fallback
    console.log('📊 Creating text search index...');
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
    );

    // Try to create vector search index if supported
    try {
      const indexName = "vector_index";
      const indexes = await collection.listIndexes().toArray();
      console.log('Current indexes:', indexes);
      const indexExists = indexes.some(index => index.name === indexName);
      
      if (!indexExists) {
        console.log('Creating vector search index...');
        await db.command({
          createSearchIndex: COLLECTION_NAME,
          name: indexName,
          definition: {
            mappings: {
              dynamic: true,
              fields: {
                embeddings: {
                  dimensions: 384,
                  similarity: "euclidean",
                  type: "knnVector",
                }
              }
            }
          }
        });
        console.log('✅ Vector search index created successfully');
        return { vectorSearch: true };
      } else {
        console.log('ℹ️ Vector search index already exists');
        return { vectorSearch: true };
      }
    } catch (vectorError) {
      console.log('ℹ️ Vector search not available, using text search fallback');
      return { vectorSearch: false };
    }
  } catch (error) {
    console.error('❌ Failed to initialize search:', error);
    return { vectorSearch: false };
  }
}

// Function to perform vector search
export async function vectorSearch(queryEmbedding: number[], limit: number = 5) {
  try {
    console.log('🔍 Performing vector search with embedding:', queryEmbedding.slice(0, 5), '...');
    const client = await clientPromise;
    const collection = client.db(DB_NAME).collection(COLLECTION_NAME);

    try {
      // Try vector search first
      const results = await collection.aggregate([
        {
          $search: {
            index: "vector_index",
            knnBeta: {
              vector: queryEmbedding,
              path: "embeddings",
              k: limit
            }
          }
        },
        {
          $project: {
            drug: 1,
            gpt4_form: 1,
            description: 1,
            score: { $meta: "searchScore" }
          }
        }
      ]).toArray();

      if (results.length > 0) {
        console.log(`✅ Vector search found ${results.length} results`);
        return results.map(result => ({
          ...result,
          similarity_score: Math.max(0, Math.min(100, (1 - result.score) * 100))
        }));
      }
    } catch (vectorError) {
      console.log('ℹ️ Vector search failed, falling back to text search');
    }

    // Fallback to text search
    const searchText = await generateSearchText(queryEmbedding);
    const results = await collection.find(
      { $text: { $search: searchText } },
      {
        score: { $meta: "textScore" },
        projection: {
          drug: 1,
          gpt4_form: 1,
          description: 1
        }
      }
    )
    .sort({ score: { $meta: "textScore" } })
    .limit(limit)
    .toArray();

    console.log(`✅ Text search found ${results.length} results`);
    return results.map(result => ({
      ...result,
      similarity_score: Math.max(0, Math.min(100, result.score * 50)) // Convert text score to percentage
    }));

  } catch (error) {
    console.error('❌ Search error:', error);
    throw error;
  }
}

// Helper function to convert embedding back to searchable text
async function generateSearchText(embedding: number[]): Promise<string> {
  // Use the most significant dimensions to generate search terms
  const significantTerms = embedding
    .map((value, index) => ({ value: Math.abs(value), index }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)
    .map(item => `dimension_${item.index}`)
    .join(' ');
  
  return significantTerms;
} 