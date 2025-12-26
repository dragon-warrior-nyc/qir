import { RouterAgent } from "./agents/routerAgent";
import { ContextAgent } from "./agents/contextAgent";
import { ExtractionAgent } from "./agents/extractionAgent";
import { AnalysisAgent } from "./agents/analysisAgent";
import { ProductDetails, SearchContextResult, AnalysisResult } from "../types";

/**
 * Orchestrator Service
 * Instantiates agents and manages the workflow.
 */

// --- Orchestration Methods ---

export const getSearchQueryContext = async (
    query: string, 
    forceSearch: boolean = false,
    signal?: AbortSignal
): Promise<SearchContextResult> => {
  
  // 1. Initialize Agents
  const router = new RouterAgent();
  const contextAgent = new ContextAgent();

  let needsSearch = forceSearch;
  let routerCost = 0;

  if (signal?.aborted) throw new Error('Aborted');

  // 2. Logic Flow
  if (!forceSearch) {
      const decision = await router.determineNecessity(query, signal);
      needsSearch = decision.needsSearch;
      routerCost = decision.cost;
      console.log(`[Orchestrator] Router Decision for "${query}": Search Needed = ${needsSearch}`);
  } else {
      console.log(`[Orchestrator] Skipping Router: Forcing search.`);
  }

  if (signal?.aborted) throw new Error('Aborted');

  // 3. Execution
  const result = await contextAgent.getContext(query, needsSearch, signal);

  // 4. Cost Aggregation
  if (result._meta) {
    result._meta.cost += routerCost;
  }

  return result;
};

export const extractProductDetailsFromUrl = async (url: string, signal?: AbortSignal): Promise<ProductDetails> => {
  const extractor = new ExtractionAgent();
  return await extractor.extract(url, signal);
};

export const analyzeProductRelevance = async (
  query: string,
  product: ProductDetails,
  searchContext: string,
  signal?: AbortSignal
): Promise<AnalysisResult> => {
  const analyzer = new AnalysisAgent();
  return await analyzer.analyze(query, product, searchContext, signal);
};