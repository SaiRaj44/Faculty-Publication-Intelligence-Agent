import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export async function validatePublication(publicationData: any) {
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `
    You are an expert academic publication validator for a university. 
    Analyze the following publication metadata and determine if it is valid, identifying any issues like predatory journals, missing required fields, or suspicious author formatting.

    Publication Data:
    ${JSON.stringify(publicationData, null, 2)}

    Respond ONLY in valid JSON format with the following structure:
    {
      "isValid": boolean,
      "overallScore": number (0 to 100),
      "issues": string[],
      "suggestions": string[],
      "agentResponse": "A brief 1-2 sentence summary of your validation."
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    // Clean up potential markdown formatting from the response
    if (text.startsWith('\`\`\`json')) {
      text = text.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '');
    }

    return JSON.parse(text.trim());
  } catch (error) {
    console.error('Validation Agent Error:', error);
    return {
      isValid: false,
      overallScore: 0,
      issues: ['AI Validation Agent failed to process the request.'],
      suggestions: [],
      agentResponse: 'Validation encountered a technical error.'
    };
  }
}
