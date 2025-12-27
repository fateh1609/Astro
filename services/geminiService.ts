
import { GoogleGenAI, Chat, Schema } from "@google/genai";
import { BASE_SYSTEM_INSTRUCTION } from '../constants';

let ai: GoogleGenAI | null = null;
let chatSession: Chat | null = null;
let currentInstruction: string = BASE_SYSTEM_INSTRUCTION;

// Usage Tracking
export const apiUsage = {
    totalRequests: 0,
    estimatedTokens: 0,
    lastReset: new Date().toISOString()
};

const trackUsage = (prompt: string, response: string) => {
    apiUsage.totalRequests += 1;
    // Rough estimate: 4 chars = 1 token. Improved for Hindi which is more token-dense.
    const tokenMultiplier = prompt.match(/[\u0900-\u097F]/) ? 2 : 1; 
    apiUsage.estimatedTokens += Math.ceil(((prompt.length + response.length) / 4) * tokenMultiplier);
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
      // Default safety to prevent massive run-on responses
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

  // Append verbosity instruction to reduce output tokens for free users
  const enhancedMessage = isPremium ? message : `${message} (BE CONCISE & PROVIDE ONLY A GIST)`;

  while (attempt < maxRetries) {
    try {
      const result = await chatSession.sendMessage({
        message: enhancedMessage
      });
      const responseText = result.text || "The stars are clouded...";
      trackUsage(enhancedMessage, responseText);
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
        trackUsage(prompt, text);
        
        // Robust cleanup: remove markdown blocks if model wraps JSON
        if (text.trim().startsWith('```')) {
            text = text.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/```$/, '').trim();
        }

        try {
            return JSON.parse(text);
        } catch (parseError) {
            console.warn("JSON Parse failed, attempting standard cleanup", parseError);
            // Fallback for tricky markdown
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
