import { Type } from "@google/genai";
import { BaseAgent } from "../core/baseAgent";
import { ProductDetails, AnalysisResult } from "../../types";
import { getQAPrompt } from "../prompts/qaPrompts";

export class QAAgent extends BaseAgent {
  constructor() {
    // Using Flash for QA as it's a classification/review task on existing reasoning
    super({ model: 'gemini-3-flash-preview' });
  }

  async assessQuality(
    query: string,
    product: ProductDetails,
    analysisResult: Partial<AnalysisResult>,
    searchContext: string,
    signal?: AbortSignal
  ): Promise<{ humanReviewNeeded: boolean; reviewReason: string; cost: number }> {
    try {
      const prompt = getQAPrompt(query, product, analysisResult, searchContext);

      const { response, cost } = await this.generate(prompt, {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            humanReviewNeeded: { type: Type.BOOLEAN },
            reviewReason: { type: Type.STRING }
          },
          required: ["humanReviewNeeded", "reviewReason"]
        }
      }, false, signal);

      const text = response.text;
      if (!text) throw new Error("QA Agent provided no response.");

      const result = JSON.parse(text);

      return {
        humanReviewNeeded: result.humanReviewNeeded,
        reviewReason: result.reviewReason || "",
        cost
      };

    } catch (error) {
      if ((error as Error).message === 'Aborted') throw error;
      console.error("QA Agent failed:", error);
      // Fail safe: If QA fails, flag for review just in case
      return {
        humanReviewNeeded: true,
        reviewReason: "Automated QA check failed.",
        cost: 0
      };
    }
  }
}