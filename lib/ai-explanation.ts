import { VertexAI } from "@google-cloud/vertexai"
import path from "path"

// Initialize Vertex AI with error handling
let vertex: VertexAI;
let model: any;

try {
  vertex = new VertexAI({
    project: 'intimitymaster',
    location: 'us-central1',
    keyFile: path.join(process.cwd(), 'key.json')
  });

  model = vertex.preview.getGenerativeModel({
    model: "gemini-pro",
    generation_config: {
      max_output_tokens: 2048,
      temperature: 0.4,
      top_p: 0.8,
      top_k: 40
    }
  });

  console.log('✅ Vertex AI initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize Vertex AI:', error);
}

export async function getAIExplanation(medication: any) {
  if (!model) {
    throw new Error('Vertex AI model not initialized');
  }

  try {
    console.log('🔄 Starting AI explanation for:', medication.drug);
    
    const prompt = `As a medical expert, provide two concise explanations for ${medication.drug} (${medication.gpt4_form}):

1. Technical (Pharmacological) Explanation:
- Focus on mechanism of action
- Key pharmacological properties
- Clinical significance

2. Simple (Patient-Friendly) Explanation:
- How it helps in simple terms
- Basic usage information
- Key things to know

Keep each explanation to 2-3 sentences. Include only factual, verified information.`

    const chat = model.startChat()
    console.log('💬 Chat started, sending prompt...');
    
    const result = await chat.sendMessage({
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    })

    console.log('✅ Received AI response for:', medication.drug);
    
    if (!result?.response?.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid AI response structure');
    }

    return result.response.candidates[0].content.parts[0].text
  } catch (error) {
    console.error('❌ AI Explanation error:', error);
    throw error;
  }
} 