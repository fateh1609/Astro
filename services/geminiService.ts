
import { GoogleGenAI, Chat, Schema } from "@google/genai";
import { BASE_SYSTEM_INSTRUCTION } from '../constants';
import { logTokenUsage } from './dbService';
import { verifyJWT } from './securityService';

let ai: GoogleGenAI | null = null;
let chatSession: Chat | null = null;
let currentInstruction: string = BASE_SYSTEM_INSTRUCTION;

// Helper to identify user from token or context
const getCurrentUserId = (): string => {
    const token = localStorage.getItem('astro_token');
    if (token) {
        return verifyJWT(token) || 'anonymous';
    }
    return 'anonymous';
};

const trackUsageToDb = (prompt: string, response: string, feature: 'chat' | 'horoscope' = 'chat') => {
    // Estimate tokens: 1 token ~= 4 chars (Rough Estimate)
    // Detailed analysis shows approx 0.25 tokens per char
    const inputTokens = Math.ceil(prompt.length / 4);
    const outputTokens = Math.ceil(response.length / 4);
    
    // Log directly to Supabase via dbService
    const userId = getCurrentUserId();
    logTokenUsage(userId, feature, inputTokens, outputTokens);
};

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

  chatSession = client.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: currentInstruction,
      temperature: 0.7,
      maxOutputTokens: 2000,
    }
  });
  return chatSession;
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const sendMessageToGemini = async (message: string, isPremium: boolean = false): Promise<string> => {
  if (!chatSession) {
    await initializeChat();
  }
  if (!chatSession) {
    throw new Error("Failed to initialize chat session");
  }

  const maxRetries = 3;
  let attempt = 0;

  const enhancedMessage = isPremium ? message : `${message} (BE CONCISE & PROVIDE ONLY A GIST)`;

  while (attempt < maxRetries) {
    try {
      const result = await chatSession.sendMessage({
        message: enhancedMessage
      });
      const responseText = result.text || "The stars are clouded...";
      
      // Log DB Usage
      trackUsageToDb(enhancedMessage, responseText, 'chat');
      
      return responseText;
    } catch (error: any) {
      const isQuotaError = error?.status === 429 || error?.code === 429 || error?.message?.includes('quota');
      if (isQuotaError) {
        attempt++;
        if (attempt < maxRetries) {
            await delay(Math.pow(2, attempt) * 1000);
            continue;
        }
      }
      return "A cosmic interference disrupted my connection. Please try again.";
    }
  }
  return "Connection failed.";
};

export const generateJsonContent = async (prompt: string, maxTokens: number = 2000, schema?: Schema): Promise<any> => {
    const client = getAI();
    try {
        const response = await client.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: schema,
                maxOutputTokens: maxTokens
            }
        });
        
        let text = response.text;
        if (!text) return null;
        
        // Log DB Usage
        trackUsageToDb(prompt, text, 'horoscope');
        
        if (text.trim().startsWith('```')) {
            text = text.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/```$/, '').trim();
        }

        try {
            return JSON.parse(text);
        } catch (parseError) {
            console.warn("JSON Parse failed, attempting standard cleanup", parseError);
            const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            try {
                 return JSON.parse(cleanText);
            } catch (e2) {
                 console.error("Final JSON Parse Error. Raw text:", text);
                 return null; 
            }
        }
    } catch (e) {
        console.error("JSON Generation Error:", e);
        return null;
    }
};
