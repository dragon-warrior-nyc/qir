import { Type } from "@google/genai";
import { BaseAgent } from "../core/baseAgent";
import { ProductDetails, AnalysisResult, CriticEvaluation } from "../../types";
import { getCriticPrompt } from "../prompts/criticPrompts";

export class CriticAgent extends BaseAgent {
  constructor() {
    // Critic uses a high-intelligence model (Pro) to judge the output effectively
    super({ model: 'gemini-3-pro-preview' });
  }

  async evaluate(
    query: string, 
    product: ProductDetails, 
    context: string,
    currentAnalysis: AnalysisResult,
    signal?: AbortSignal
  ): Promise<CriticEvaluation> {
    try {
      const prompt = getCriticPrompt(query, product, context, currentAnalysis);

      const { response, cost } = await this.generate(prompt, {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            satisfactory: { type: Type.BOOLEAN },
            scoreAdjustmentNeeded: { type: Type.BOOLEAN },
            critique: { type: Type.STRING },
            suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["satisfactory", "scoreAdjustmentNeeded", "suggestions", "critique"]
        }
      }, false, signal);

      const text = response.text;
      if (!text) throw new Error("Critic provided no response.");

      const result = JSON.parse(text) as CriticEvaluation;
      result._meta = { cost };

      return result;

    } catch (error) {
      if ((error as Error).message === 'Aborted') throw error;
      console.error("Critic Agent failed:", error);
      // Fail open: If critic fails, assume satisfactory to prevent infinite loops of error
      return {
        satisfactory: true,
        scoreAdjustmentNeeded: false,
        critique: "Critic unavailable",
        suggestions: [],
        _meta: { cost: 0 }
      };
    }
  }
}