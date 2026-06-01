import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export async function enrichPublicationData(rawInput: string) {
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `
    You are an expert AI metadata extractor for academic publications.
    Extract structured metadata from the following raw text or DOI reference.
    
    Raw Input:
    ${rawInput}

    Respond ONLY in valid JSON format with the following exact keys (leave as null or empty array if not found):
    {
      "title": string,
      "authors": string[],
      "year": number,
      "journalName": string,
      "conferenceName": string,
      "publisher": string,
      "abstract": string,
      "doi": string
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
    console.error('Enrichment Agent Error:', error);
    throw new Error('Failed to parse publication metadata.');
  }
}
