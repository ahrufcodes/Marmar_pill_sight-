import { VertexAI } from "@google-cloud/vertexai"

// Initialize Vertex AI with error handling
let vertex: VertexAI;
let model: any;
let multimodalModel: any;

try {
  // Get project ID from environment variable
  const projectId = process.env.GOOGLE_CLOUD_PROJECT || 'intimitymaster';

  // In production, we'll use the credentials from environment variable
  let credentials: any = undefined;
  
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    try {
      credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
      console.log('✅ Loaded Google Cloud credentials from environment variable');
    } catch (error) {
      console.error('❌ Failed to parse Google Cloud credentials:', error);
    }
  }

  vertex = new VertexAI({
    project: projectId,
    location: 'us-central1',
    credentials: credentials // This will be undefined in local (using default credentials) and set in production
  });

  // Initialize both models - one for text and one for multimodal
  model = vertex.preview.getGenerativeModel({
    model: "gemini-2.0-flash-001",
    generation_config: {
      maxOutputTokens: 2048,
      temperature: 0.4,
      topP: 0.8,
      topK: 40
    }
  });

  multimodalModel = vertex.preview.getGenerativeModel({
    model: "gemini-2.0-pro-vision-001", // Using the vision model which has better multimodal capabilities
    generation_config: {
      maxOutputTokens: 2048,
      temperature: 0.4,
      topP: 0.8,
      topK: 40
    }
  });

  console.log('✅ Vertex AI initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize Vertex AI:', error);
  model = null;
  multimodalModel = null;
}

export async function getAIExplanation(medication: any) {
  if (!model) {
    return "AI explanations are temporarily unavailable. Please try again later.";
  }

  try {
    console.log('🔄 Starting AI explanation for:', medication.drug);
    
    const prompt = `As a healthcare AI assistant, provide two clear explanations for ${medication.drug} (${medication.gpt4_form}):

1. Technical (Healthcare Professional) Explanation:
• Mechanism of action and pharmacological class
• Primary therapeutic effects and indications
• Key clinical considerations and contraindications

2. Patient-Friendly Explanation:
• What the medication does in simple terms
• Common uses and benefits
• Important things to remember

Format the response with clear headings and bullet points. Keep explanations concise but informative. Include only verified medical information.`;

    // Generate content with the model
    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: prompt
        }]
      }]
    });

    // Wait for the response to be ready
    const response = await result.response;
    
    console.log('✅ Generated explanation for:', medication.drug);
    
    if (!response?.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.error('Invalid response structure:', response);
      throw new Error('Invalid AI response structure');
    }

    // Process the response to ensure proper formatting
    let text = response.candidates[0].content.parts[0].text;
    
    // Ensure proper markdown formatting
    text = text.replace(/^([12]\. )(.*?):/gm, '### $2:')  // Convert numbered lists to headers
           .replace(/^[•●]/gm, '-')                        // Standardize bullet points
           .trim();

    return text;

  } catch (error) {
    console.error('❌ AI Explanation error:', error);
    if (error.message?.includes('quota')) {
      return "AI service quota exceeded. Please try again later.";
    } else if (error.message?.includes('permission')) {
      return "AI service configuration issue. Please contact support.";
    } else {
      return "Unable to generate AI explanation at the moment. Please try again later.";
    }
  }
}

// New function for handling audio-based queries
export async function getAudioBasedExplanation(audioContent: string, query: string) {
  if (!multimodalModel) {
    return "Audio processing is temporarily unavailable. Please try again later.";
  }

  try {
    console.log('🔄 Processing audio-based query');
    
    const prompt = `As a healthcare AI assistant, analyze this audio query about medication and provide a clear, helpful response. 
    Consider both the audio content and the transcribed text: "${query}"
    
    Provide:
    1. A direct answer to the query
    2. Any relevant medication information
    3. Important safety considerations
    
    Keep the response clear, accurate, and focused on verified medical information.`;

    // Generate content with the multimodal model
    const result = await multimodalModel.generateContent({
      contents: [{
        role: "user",
        parts: [
          { text: prompt },
          { inlineData: { data: audioContent, mimeType: "audio/wav" } }
        ]
      }]
    });

    // Wait for the response to be ready
    const response = await result.response;
    
    console.log('✅ Generated audio-based response');
    
    if (!response?.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.error('Invalid response structure:', response);
      throw new Error('Invalid AI response structure');
    }

    return response.candidates[0].content.parts[0].text;

  } catch (error) {
    console.error('❌ Audio processing error:', error);
    if (error.message?.includes('quota')) {
      return "AI service quota exceeded. Please try again later.";
    } else if (error.message?.includes('permission')) {
      return "AI service configuration issue. Please contact support.";
    } else {
      return "Unable to process audio query at the moment. Please try again later.";
    }
  }
} 