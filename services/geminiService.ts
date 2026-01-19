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

export interface WorkflowResult {
  contextResult: SearchContextResult;
  productResult: ProductDetails;
  analysisResult: AnalysisResult;
}

/**
 * Executes the ADK Parallel Workflow:
 * 1. Parallel Branch A: Router -> Context Agent
 * 2. Parallel Branch B: Extraction Agent (if URL provided)
 * 3. Merge: Combine Context + Product Data
 * 4. Sequential: Analysis Agent
 */
export const orchestrateParallelWorkflow = async (
  query: string,
  url: string | null,
  currentProduct: ProductDetails,
  useSmartRouter: boolean,
  signal?: AbortSignal
): Promise<WorkflowResult> => {
  
  // --- Parallel Execution Block ---
  
  // Branch A: Context Gathering (Router + Search/Knowledge)
  const contextPromise = getSearchQueryContext(query, !useSmartRouter, signal);

  // Branch B: Product Extraction (only if URL provided)
  // Passing query to allow task-specific extraction focus
  const extractionPromise = url 
    ? extractProductDetailsFromUrl(url, query, signal)
    : Promise.resolve(null);

  // Await both branches simultaneously
  const [contextResult, extractedProduct] = await Promise.all([
    contextPromise,
    extractionPromise
  ]);

  if (signal?.aborted) throw new Error('Aborted');

  // --- Merge & Sequential Execution ---

  // Decide which product data to use (Extracted > Manual/Current)
  const finalProduct = extractedProduct || currentProduct;

  // Final Step: Deep Analysis
  const analysisResult = await analyzeProductRelevance(
    query, 
    finalProduct, 
    contextResult.overview, 
    signal
  );

  return {
    contextResult,
    productResult: finalProduct,
    analysisResult
  };
};

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

export const extractProductDetailsFromUrl = async (url: string, query: string = '', signal?: AbortSignal): Promise<ProductDetails> => {
  const extractor = new ExtractionAgent();
  return await extractor.extract(url, query, signal);
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