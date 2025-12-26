import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// --- PRICING CONSTANTS (Est. USD) ---
export const PRICE_SEARCH_REQUEST = 0.035;
export const PRICE_FLASH_INPUT_1M = 0.075;
export const PRICE_FLASH_OUTPUT_1M = 0.30;
export const PRICE_PRO_INPUT_1M = 3.50;
export const PRICE_PRO_OUTPUT_1M = 10.50;

export interface AgentConfig {
  model: string;
}

export abstract class BaseAgent {
  protected ai: GoogleGenAI;
  protected modelName: string;

  constructor(config?: AgentConfig) {
    // API key is strictly sourced from environment as per requirements
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    this.modelName = config?.model || 'gemini-3-flash-preview';
  }

  protected calculateCost(
    usage: GenerateContentResponse['usageMetadata'], 
    hasSearch: boolean = false
  ): number {
    let cost = 0;
    if (hasSearch) cost += PRICE_SEARCH_REQUEST;
    
    if (usage) {
      const input = usage.promptTokenCount || 0;
      const output = usage.candidatesTokenCount || 0;
      
      const isPro = this.modelName.includes('pro');
      
      const rates = isPro
        ? { in: PRICE_PRO_INPUT_1M, out: PRICE_PRO_OUTPUT_1M }
        : { in: PRICE_FLASH_INPUT_1M, out: PRICE_FLASH_OUTPUT_1M };

      cost += (input / 1_000_000) * rates.in;
      cost += (output / 1_000_000) * rates.out;
    }
    return cost;
  }

  protected async generate(
    contents: any, 
    config: any = {}, 
    hasSearch: boolean = false,
    signal?: AbortSignal
  ): Promise<{ response: GenerateContentResponse; cost: number }> {
    try {
      if (signal?.aborted) {
        throw new Error('Aborted');
      }

      // Note: We check signal status before and after call to ensure UI responsiveness,
      // as not all SDK versions strictly abort the underlying fetch promise immediately in the preview.
      
      const result = await this.ai.models.generateContent({
        model: this.modelName,
        contents,
        config,
      });
      
      if (signal?.aborted) {
        throw new Error('Aborted');
      }

      const cost = this.calculateCost(result.usageMetadata, hasSearch);
      return { response: result, cost };
    } catch (error) {
      if (signal?.aborted || (error as Error).message === 'Aborted') {
        throw new Error('Aborted');
      }
      console.error(`[${this.constructor.name}] Generation failed:`, error);
      throw error;
    }
  }
}