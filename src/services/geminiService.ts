import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/env';

// Initialize Gemini AI with API key
const genAI = new GoogleGenerativeAI(config.geminiApiKey);

/**
 * Use Gemini to extract intent and collection name from user input.
 * Returns: { intent, confidence, entities: { collectionNameRaw } }
 */
export async function geminiNLU(userInput: string): Promise<{ intent?: string; confidence?: number; entities: { collectionNameRaw?: string } }> {
  const prompt = `Extract the user's intent and the NFT collection name from the following message. 

Reply in JSON with keys: intent (get_floor_price, get_collection_stats, or unknown), confidence (0-1), and entities: { collectionNameRaw }. 

User message: "${userInput}"
`;
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  try {
    // Try to parse JSON from Gemini's response
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      const jsonString = text.substring(jsonStart, jsonEnd + 1);
      return JSON.parse(jsonString);
    }
    // Fallback: return unknown intent
    return { intent: 'unknown', confidence: 0.3, entities: {} };
  } catch (e) {
    return { intent: 'unknown', confidence: 0.3, entities: {} };
  }
}

/**
 * Use Gemini to phrase a final response to the user, given the action, collection info, and data.
 *
 * @param params: { action: 'floor_price' | 'collection_stats', collection: { name, symbol }, data: any }
 * @returns string (phrased response)
 */
export async function geminiPhraseResponse(params: { action: string, collection: { name: string, symbol: string }, data: any }): Promise<string> {
  let prompt = '';
  if (params.action === 'floor_price') {
    prompt = `Phrase a friendly, concise response to a user asking for the floor price of the NFT collection "${params.collection.name}" (symbol: ${params.collection.symbol}).
    The floor price is ${params.data.floorPrice} SOL. There are ${params.data.listed} NFTs listed. Respond as an AI assistant.`;
  } else if (params.action === 'collection_stats') {
    prompt = `Phrase a friendly, concise response to a user asking for stats for the NFT collection "${params.collection.name}" (symbol: ${params.collection.symbol}).
    Here are the stats: ${JSON.stringify(params.data)}. Respond as an AI assistant.`;
  } else {
    prompt = `Phrase a friendly, concise response to a user about the NFT collection "${params.collection.name}" (symbol: ${params.collection.symbol}). Here is the data: ${JSON.stringify(params.data)}.`;
  }
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}