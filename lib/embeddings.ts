// Medical-focused text embedding service
export class SentenceTransformer {
  // Medical term weights to boost importance of medical terminology
  private static readonly MEDICAL_WEIGHTS: { [key: string]: number } = {
    // Symptoms and conditions (highest weight)
    pain: 2.5,
    fever: 2.5,
    headache: 2.5,
    nausea: 2.5,
    inflammation: 2.5,
    infection: 2.5,
    allergy: 2.5,
    cough: 2.5,
    cold: 2.5,
    flu: 2.5,

    // Actions and effects (high weight)
    relief: 2.0,
    reduce: 2.0,
    treat: 2.0,
    treatment: 2.0,
    helps: 2.0,
    healing: 2.0,
    reduces: 2.0,
    relieves: 2.0,
    treating: 2.0,
    fighting: 2.0,

    // Medical terms (medium-high weight)
    medication: 1.8,
    medicine: 1.8,
    drug: 1.8,
    tablet: 1.8,
    capsule: 1.8,
    oral: 1.8,
    dose: 1.8,
    dosage: 1.8,
    prescription: 1.8,
    otc: 1.8,

    // Descriptive terms (medium weight)
    severe: 1.5,
    mild: 1.5,
    chronic: 1.5,
    acute: 1.5,
    temporary: 1.5,
    persistent: 1.5,
    occasional: 1.5,
    regular: 1.5,
    
    // Brand related (lower weight)
    generic: 1.2,
    brand: 1.2,
    name: 1.2,
  };

  static async encode(text: string): Promise<number[]> {
    // Convert text to lowercase and split into words
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .split(/\s+/)
      .filter(word => word.length > 0);

    // Initialize embedding vector
    const dimension = 384; // Increased dimension for better medical term representation
    const embedding = new Array(dimension).fill(0);

    // Process each word
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      
      // Calculate word weight (boost medical terms)
      const weight = this.MEDICAL_WEIGHTS[word] || 1.0;
      
      // Use multiple hashing functions for better distribution
      const hash1 = this.hashString(word);
      const hash2 = this.hashString(word.split('').reverse().join(''));
      const hash3 = this.hashString(word + 'medical'); // Medical context hash
      
      // Distribute word information across the vector
      for (let j = 0; j < Math.min(word.length * 3, dimension / 3); j++) {
        const pos1 = Math.abs(hash1 + j) % dimension;
        const pos2 = Math.abs(hash2 + j) % dimension;
        const pos3 = Math.abs(hash3 + j) % dimension;
        
        // Add weighted contributions with enhanced medical context
        embedding[pos1] += Math.cos(hash1 * j) * weight * (1.5 / (i + 1));
        embedding[pos2] += Math.sin(hash2 * j) * weight * (1.5 / (i + 1));
        embedding[pos3] += Math.tan(hash3 * j) * weight * (1.5 / (i + 1));
      }

      // Add n-gram features for medical terms
      if (i < words.length - 1) {
        const bigram = words[i] + ' ' + words[i + 1];
        const bigramHash = this.hashString(bigram);
        const bigramWeight = (this.MEDICAL_WEIGHTS[words[i]] || 1.0) * (this.MEDICAL_WEIGHTS[words[i + 1]] || 1.0);
        
        for (let j = 0; j < 12; j++) {
          const pos = Math.abs(bigramHash + j) % dimension;
          embedding[pos] += Math.cos(bigramHash * j) * bigramWeight * 0.8;
        }
      }

      // Add trigram features for common medical phrases
      if (i < words.length - 2) {
        const trigram = words[i] + ' ' + words[i + 1] + ' ' + words[i + 2];
        const trigramHash = this.hashString(trigram);
        const trigramWeight = 
          (this.MEDICAL_WEIGHTS[words[i]] || 1.0) * 
          (this.MEDICAL_WEIGHTS[words[i + 1]] || 1.0) * 
          (this.MEDICAL_WEIGHTS[words[i + 2]] || 1.0);
        
        for (let j = 0; j < 8; j++) {
          const pos = Math.abs(trigramHash + j) % dimension;
          embedding[pos] += Math.sin(trigramHash * j) * trigramWeight * 0.5;
        }
      }
    }

    // Add positional encoding with medical context boost
    for (let i = 0; i < dimension; i++) {
      embedding[i] += Math.sin(i / dimension) * 0.15;
      if (i % 3 === 0) { // Boost medical term positions
        embedding[i] *= 1.2;
      }
    }

    // Normalize the vector
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / (magnitude || 1));
  }

  private static hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }

  static cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length');
    }
    
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    
    // Enhanced similarity calculation with medical context boost
    const similarity = dotProduct / (magnitudeA * magnitudeB);
    return Math.pow(similarity, 0.8); // Slightly boost lower similarities to be more inclusive
  }
}
