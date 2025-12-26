import { BaseAgent } from "../core/baseAgent";
import { ProductDetails } from "../../types";
import { getExtractionPrompt } from "../prompts/extractionPrompts";

const cache = new Map<string, ProductDetails>();

export class ExtractionAgent extends BaseAgent {
  constructor() {
    super({ model: 'gemini-3-flash-preview' });
  }

  async extract(url: string, signal?: AbortSignal): Promise<ProductDetails> {
    const cacheKey = url.trim();
    if (cache.has(cacheKey) && !signal?.aborted) return cache.get(cacheKey)!;

    try {
      const prompt = getExtractionPrompt(url);
      
      const { response, cost } = await this.generate(prompt, {
        tools: [{ googleSearch: {} }],
      }, true, signal); // hasSearch = true

      let text = response.text;

      if (!text) {
          console.warn("Extraction Agent: No text generated.");
          return this.getErrorDetails(cost);
      }
      
      text = text.trim().replace(/^```json\s*/, "").replace(/\s*```$/, "").replace(/^```\s*/, "");

      let rawDetails;
      try {
          rawDetails = JSON.parse(text);
      } catch (e) {
          console.warn("Extraction Agent: JSON parse failed", e);
          throw new Error("Failed to parse extracted data.");
      }
      
      const details: ProductDetails = {
        name: rawDetails.name || '',
        description: rawDetails.description || '',
        price: rawDetails.price || '',
        category: rawDetails.category || '',
        brand: rawDetails.brand || '',
        size: rawDetails.size || '',
        color: rawDetails.color || '',
        gender: rawDetails.gender || '',
        badge: rawDetails.badge || '', 
        _meta: { cost }
      };
      
      cache.set(cacheKey, details);
      return details;

    } catch (error) {
      if ((error as Error).message === 'Aborted') throw error;
      console.error("Extraction Agent failed:", error);
      throw new Error("Could not extract details. URL might be invalid.");
    }
  }

  private getErrorDetails(cost: number): ProductDetails {
    return {
      name: '', description: '', price: '', category: '', brand: '', size: '', color: '', gender: '', badge: '',
      _meta: { cost }
    };
  }
}