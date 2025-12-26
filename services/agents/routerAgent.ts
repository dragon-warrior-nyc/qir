import { Type } from "@google/genai";
import { BaseAgent } from "../core/baseAgent";
import { getRouterPrompt } from "../prompts/routerPrompts";

export class RouterAgent extends BaseAgent {
  constructor() {
    super({ model: 'gemini-3-flash-preview' });
  }

  async determineNecessity(query: string, signal?: AbortSignal): Promise<{ needsSearch: boolean; cost: number }> {
    try {
      const prompt = getRouterPrompt(query);
      
      const { response, cost } = await this.generate(prompt, {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            needsSearch: { type: Type.BOOLEAN },
            reason: { type: Type.STRING }
          }
        }
      }, false, signal);

      const decision = JSON.parse(response.text!) as { needsSearch: boolean; reason: string };
      return { needsSearch: decision.needsSearch, cost };
    } catch (e) {
      if ((e as Error).message === 'Aborted') throw e;
      console.warn("Router failed, defaulting to search.", e);
      return { needsSearch: true, cost: 0 };
    }
  }
}