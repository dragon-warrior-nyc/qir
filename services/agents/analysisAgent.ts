import { Type } from "@google/genai";
import { BaseAgent } from "../core/baseAgent";
import { ProductDetails, AnalysisResult } from "../../types";
import { getAnalysisPrompt } from "../prompts/analysisPrompts";

export class AnalysisAgent extends BaseAgent {
  constructor() {
    super({ model: 'gemini-3-pro-preview' });
  }

  async analyze(
    query: string, 
    product: ProductDetails, 
    searchContext: string, 
    signal?: AbortSignal
  ): Promise<AnalysisResult> {
    
    try {
      const prompt = getAnalysisPrompt(query, product, searchContext);

      const { response, cost } = await this.generate(prompt, {
        thinkingConfig: { thinkingBudget: 32768 }, 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            relevanceScore: { type: Type.NUMBER },
            reasoning: { type: Type.STRING },
            keyMatches: { type: Type.ARRAY, items: { type: Type.STRING } },
            missingFeatures: { type: Type.ARRAY, items: { type: Type.STRING } },
            customerUtilityAssessment: { type: Type.STRING },
            humanReviewNeeded: { type: Type.BOOLEAN },
            reviewReason: { type: Type.STRING },
          },
          required: ["relevanceScore", "reasoning", "keyMatches", "missingFeatures", "customerUtilityAssessment", "humanReviewNeeded", "reviewReason"],
        },
      }, false, signal);

      const text = response.text;
      if (!text) throw new Error("No response text from Gemini.");
      
      const result = JSON.parse(text) as AnalysisResult;
      
      result._meta = {
        cost,
        usage: {
          promptTokens: response.usageMetadata?.promptTokenCount || 0,
          candidatesTokens: response.usageMetadata?.candidatesTokenCount || 0,
        }
      };
      
      return result;

    } catch (error) {
      if ((error as Error).message === 'Aborted') throw error;
      console.error("Analysis Agent failed:", error);
      throw error;
    }
  }
}