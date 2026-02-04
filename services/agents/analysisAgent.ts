import { Type } from "@google/genai";
import { BaseAgent } from "../core/baseAgent";
import { ProductDetails, AnalysisResult } from "../../types";
import { getAnalysisPrompt } from "../prompts/analysisPrompts";

export class AnalysisAgent extends BaseAgent {
  constructor() {
    super({ model: 'gemini-3-pro-preview' });
  }

  // Returns Omit<AnalysisResult, 'humanReviewNeeded' | 'reviewReason'> efficiently, 
  // but we return Partial<AnalysisResult> to keep it simple for the service layer
  async analyze(
    query: string, 
    product: ProductDetails, 
    searchContext: string, 
    signal?: AbortSignal
  ): Promise<Partial<AnalysisResult>> {
    
    try {
      const prompt = getAnalysisPrompt(query, product, searchContext);

      const { response, cost } = await this.generate(prompt, {
        thinkingConfig: { thinkingBudget: 32768 }, 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            relevanceScore: { type: Type.STRING }, // Use STRING to support "N.A."
            ratingLabel: { type: Type.STRING },
            reasoning: { type: Type.STRING },
            keyMatches: { type: Type.ARRAY, items: { type: Type.STRING } },
            missingFeatures: { type: Type.ARRAY, items: { type: Type.STRING } },
            customerUtilityAssessment: { type: Type.STRING },
          },
          required: ["relevanceScore", "ratingLabel", "reasoning", "keyMatches", "missingFeatures", "customerUtilityAssessment"],
        },
      }, false, signal);

      const text = response.text;
      if (!text) throw new Error("No response text from Gemini.");
      
      const result = JSON.parse(text);
      
      // Post-processing to convert numeric strings back to numbers if possible
      let finalScore: number | string = "N.A.";
      if (result.relevanceScore !== "N.A.") {
          finalScore = Number(result.relevanceScore);
          // Fallback if parsing fails for some reason
          if (isNaN(finalScore)) finalScore = "N.A.";
      }

      const parsedResult: Partial<AnalysisResult> = {
          ...result,
          relevanceScore: finalScore
      };
      
      parsedResult._meta = {
        cost,
        usage: {
          promptTokens: response.usageMetadata?.promptTokenCount || 0,
          candidatesTokens: response.usageMetadata?.candidatesTokenCount || 0,
        }
      };
      
      return parsedResult;

    } catch (error) {
      if ((error as Error).message === 'Aborted') throw error;
      console.error("Analysis Agent failed:", error);
      throw error;
    }
  }
}