import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// --- PRICING CONSTANTS (Est. USD) ---
export const PRICE_SEARCH_REQUEST = 0.035;
export const PRICE_FLASH_INPUT_1M = 0.075;
export const PRICE_FLASH_OUTPUT_1M = 0.30;
export const PRICE_PRO_INPUT_1M = 3.50;
export const PRICE_PRO_OUTPUT_1M = 10.50;

/**
 * Helper to get the AI Client using the system-provided API key
 */
export const getClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

/**
 * Helper to calculate cost based on usage and model type
 */
export function calculateCost(
  usage: GenerateContentResponse['usageMetadata'], 
  modelType: 'flash' | 'pro', 
  hasSearch: boolean
): number {
  let cost = 0;
  
  if (hasSearch) {
    cost += PRICE_SEARCH_REQUEST;
  }

  if (usage) {
    const input = usage.promptTokenCount || 0;
    const output = usage.candidatesTokenCount || 0;

    if (modelType === 'flash') {
      cost += (input / 1_000_000) * PRICE_FLASH_INPUT_1M;
      cost += (output / 1_000_000) * PRICE_FLASH_OUTPUT_1M;
    } else {
      cost += (input / 1_000_000) * PRICE_PRO_INPUT_1M;
      cost += (output / 1_000_000) * PRICE_PRO_OUTPUT_1M;
    }
  }

  return cost;
}