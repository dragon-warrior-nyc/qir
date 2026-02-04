import { Type } from "@google/genai";
import { BaseAgent } from "../core/baseAgent";
import { SearchContextResult } from "../../types";
import { getSearchIntentPrompt, getKnowledgeIntentPrompt } from "../prompts/contextPrompts";

const cache = new Map<string, SearchContextResult>();

export class ContextAgent extends BaseAgent {
  constructor() {
    super({ model: 'gemini-3-flash-preview' });
  }

  async getContext(query: string, needsSearch: boolean, signal?: AbortSignal): Promise<SearchContextResult> {
    const cacheKey = `${query.trim().toLowerCase()}_${needsSearch}`;
    if (cache.has(cacheKey) && !signal?.aborted) return cache.get(cacheKey)!;

    try {
      const prompt = needsSearch 
        ? getSearchIntentPrompt(query)
        : getKnowledgeIntentPrompt(query);

      const config = {
        tools: needsSearch ? [{ googleSearch: {} }] : [],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING, enum: ["PRODUCT", "INFORMATIONAL", "NONSENSICAL"] },
            overview: { type: Type.STRING }
          },
          required: ["category", "overview"]
        }
      };

      const { response, cost } = await this.generate(prompt, config, needsSearch, signal);
      
      let overview = "Could not retrieve context.";
      let category: SearchContextResult['queryCategory'] = 'PRODUCT';

      if (response.text) {
          try {
              const json = JSON.parse(response.text);
              overview = json.overview;
              category = json.category;
          } catch (e) {
              console.warn("Context Agent JSON parse error, falling back to raw text", e);
              overview = response.text;
          }
      }

      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

      const result: SearchContextResult = {
        overview,
        groundingChunks: groundingChunks as any[],
        source: needsSearch ? 'SEARCH' : 'KNOWLEDGE',
        queryCategory: category,
        _meta: { cost }
      };

      cache.set(cacheKey, result);
      return result;

    } catch (error) {
      if ((error as Error).message === 'Aborted') throw error;
      console.error("Context Agent failed:", error);
      return {
        overview: "Context search unavailable.",
        groundingChunks: [],
        source: 'KNOWLEDGE',
        queryCategory: 'PRODUCT' // Default safe fallback
      };
    }
  }
}