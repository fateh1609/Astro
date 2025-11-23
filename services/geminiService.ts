
import { GoogleGenAI, Chat } from "@google/genai";
import { BASE_SYSTEM_INSTRUCTION } from '../constants';

let ai: GoogleGenAI | null = null;
let chatSession: Chat | null = null;
let currentInstruction: string = BASE_SYSTEM_INSTRUCTION;

const getAI = () => {
  if (!ai) {
    if (!process.env.API_KEY) {
      console.error("API_KEY is missing from environment variables");
      throw new Error("API Key missing");
    }
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return ai;
};

export const initializeChat = async (customInstruction?: string): Promise<Chat> => {
  const client = getAI();
  
  if (customInstruction) {
    currentInstruction = customInstruction;
  }

  // Create new chat session
  chatSession = client.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: currentInstruction,
      temperature: 0.7,
    }
  });
  return chatSession;
};

// Helper for delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const sendMessageToGemini = async (message: string): Promise<string> => {
  if (!chatSession) {
    await initializeChat();
  }
  if (!chatSession) {
    throw new Error("Failed to initialize chat session");
  }

  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const result = await chatSession.sendMessage({
        message: message
      });
      return result.text || " The stars are clouded... I cannot see the answer right now.";
    } catch (error: any) {
      console.error(`Gemini API Error (Attempt ${attempt + 1}/${maxRetries}):`, error);

      // Check for common rate limit or quota errors
      const isQuotaError = error?.status === 429 || 
                           error?.code === 429 || 
                           error?.message?.includes('429') || 
                           error?.message?.includes('quota') ||
                           error?.status === 'RESOURCE_EXHAUSTED';
      
      const isServerOverload = error?.status === 503 || error?.code === 503;

      if (isQuotaError || isServerOverload) {
        attempt++;
        if (attempt < maxRetries) {
            // Exponential backoff: 2s, 4s, 8s
            const waitTime = Math.pow(2, attempt) * 1000;
            await delay(waitTime);
            continue;
        } else {
             return "The cosmic energies are overwhelming right now (High Traffic). Please try asking again in a few moments.";
        }
      }

      // If it's not a retryable error or we've run out of retries for other reasons
      return "A cosmic interference disrupted my connection. Please try again.";
    }
  }
  
  return "Connection failed after multiple attempts.";
};
