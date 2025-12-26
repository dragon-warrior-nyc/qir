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

      const config = needsSearch ? { tools: [{ googleSearch: {} }] } : {};

      const { response, cost } = await this.generate(prompt, config, needsSearch, signal);

      const overview = response.text || "Could not retrieve context.";
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

      const result: SearchContextResult = {
        overview,
        groundingChunks: groundingChunks as any[],
        source: needsSearch ? 'SEARCH' : 'KNOWLEDGE',
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
        source: 'KNOWLEDGE'
      };
    }
  }
}