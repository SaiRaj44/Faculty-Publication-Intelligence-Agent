import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

// Initialize the Google Generative AI client
const apiKey = process.env.GEMINI_API_KEY || '';
export const geminiClient = new GoogleGenerativeAI(apiKey);

/**
 * Get the main Pro model for complex reasoning and structured output
 */
export const getModel = (): GenerativeModel => {
  if (!apiKey) console.warn('GEMINI_API_KEY is not set');
  return geminiClient.getGenerativeModel({ model: 'gemini-1.5-pro' });
};

/**
 * Get the Flash model for faster, cheaper tasks like classification
 */
export const getFlashModel = (): GenerativeModel => {
  if (!apiKey) console.warn('GEMINI_API_KEY is not set');
  return geminiClient.getGenerativeModel({ model: 'gemini-1.5-flash' });
};

/**
 * Helper to generate text content with retry logic
 */
export const generateContent = async (
  prompt: string,
  systemInstruction?: string,
  retries = 3
): Promise<string> => {
  let attempt = 0;
  while (attempt < retries) {
    try {
      const model = geminiClient.getGenerativeModel({ 
        model: 'gemini-1.5-pro',
        ...(systemInstruction ? { systemInstruction } : {})
      });
      
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      attempt++;
      console.error(`Gemini API error (attempt ${attempt}/${retries}):`, error);
      if (attempt >= retries) throw error;
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
  throw new Error('Failed to generate content after max retries');
};

/**
 * Helper to generate structured JSON content
 */
export const generateStructuredContent = async <T>(
  prompt: string,
  systemInstruction?: string,
  retries = 3
): Promise<T> => {
  let attempt = 0;
  while (attempt < retries) {
    try {
      const model = geminiClient.getGenerativeModel({ 
        model: 'gemini-1.5-pro',
        generationConfig: { responseMimeType: 'application/json' },
        ...(systemInstruction ? { systemInstruction } : {})
      });
      
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return JSON.parse(text) as T;
    } catch (error) {
      attempt++;
      console.error(`Gemini API JSON error (attempt ${attempt}/${retries}):`, error);
      if (attempt >= retries) throw error;
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
  throw new Error('Failed to generate structured content after max retries');
};
