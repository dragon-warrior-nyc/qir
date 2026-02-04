import { RouterAgent } from "./agents/routerAgent";
import { ContextAgent } from "./agents/contextAgent";
import { ExtractionAgent } from "./agents/extractionAgent";
import { AnalysisAgent } from "./agents/analysisAgent";
import { QAAgent } from "./agents/qaAgent";
import { ProductDetails, SearchContextResult, AnalysisResult, RouterMode } from "../types";

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
 * Executes the ADK Smart Workflow:
 * 1. Step 1: Context Gathering (Router -> Context Agent)
 * 2. Step 2: Guard Check. If "Informational" or "Nonsensical", return early.
 * 3. Step 3: Extraction Agent (only if Product Query + URL provided)
 * 4. Step 4: Analysis Agent -> QA Agent
 */
export const orchestrateSmartWorkflow = async (
  query: string,
  url: string | null,
  currentProduct: ProductDetails,
  routerMode: RouterMode,
  signal?: AbortSignal
): Promise<WorkflowResult> => {
  
  // --- Step 1: Context Gathering ---
  // Executed first to determine intent and validity.
  const contextResult = await getSearchQueryContext(query, routerMode, signal);

  if (signal?.aborted) throw new Error('Aborted');

  // --- Step 2: FAST PATH CHECK ---
  // If this is not a product query, we short-circuit immediately.
  // This saves the cost of Extraction and Deep Analysis.
  if (contextResult.queryCategory === 'INFORMATIONAL' || contextResult.queryCategory === 'NONSENSICAL') {
    const isInfo = contextResult.queryCategory === 'INFORMATIONAL';
    const reason = isInfo 
        ? "Query is Informational. Rated 5-Informational (N.A.)." 
        : "Query is Nonsensical. Rated 6-Nonsensical (N.A.).";
    
    console.log(`[Orchestrator] Short-circuiting: ${reason}`);

    return {
        contextResult,
        productResult: currentProduct, // No extraction performed
        analysisResult: {
            relevanceScore: "N.A.",
            ratingLabel: isInfo ? "Informational" : "Nonsensical",
            reasoning: `Context Agent classification: ${contextResult.queryCategory}. ${reason}`,
            keyMatches: [],
            missingFeatures: [],
            customerUtilityAssessment: isInfo 
                ? "The user is seeking information or policies rather than a specific product to purchase." 
                : "The search query appears to be gibberish or has no semantic meaning.",
            humanReviewNeeded: false,
            _meta: {
                cost: (contextResult._meta?.cost || 0) // Only context cost incurred
            }
        }
    };
  }

  // --- Step 3: Product Extraction (Conditional) ---
  // Only runs if it is a Product query AND a URL is provided.
  let extractedProduct: ProductDetails | null = null;
  
  if (url) {
    // We pass the query to help the extractor focus on relevant attributes
    extractedProduct = await extractProductDetailsFromUrl(url, query, signal);
  }

  if (signal?.aborted) throw new Error('Aborted');

  const finalProduct = extractedProduct || currentProduct;

  // --- Step 4: Deep Analysis + QA ---
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
    routerMode: RouterMode = 'force-knowledge',
    signal?: AbortSignal
): Promise<SearchContextResult> => {
  
  // 1. Initialize Agents
  const router = new RouterAgent();
  const contextAgent = new ContextAgent();

  let needsSearch = false; // Default for 'force-knowledge'
  let routerCost = 0;

  if (signal?.aborted) throw new Error('Aborted');

  // 2. Logic Flow based on Mode
  if (routerMode === 'force-search') {
      console.log(`[Orchestrator] Skipping Router: Forcing search.`);
      needsSearch = true;
  } else if (routerMode === 'force-knowledge') {
      console.log(`[Orchestrator] Skipping Router: Forcing internal knowledge.`);
      needsSearch = false;
  } else {
      // 'smart' mode
      const decision = await router.determineNecessity(query, signal);
      needsSearch = decision.needsSearch;
      routerCost = decision.cost;
      console.log(`[Orchestrator] Router Decision for "${query}": Search Needed = ${needsSearch}`);
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
  const qaAgent = new QAAgent();

  // 1. Core Analysis (Thinking Model)
  const coreAnalysis = await analyzer.analyze(query, product, searchContext, signal);

  if (signal?.aborted) throw new Error('Aborted');

  // 2. QA Check (Flash Model)
  // We pass the reasoning and score from the core analysis
  const qaResult = await qaAgent.assessQuality(
    query,
    product,
    coreAnalysis,
    searchContext,
    signal
  );

  // 3. Merge Results & Costs
  const totalCost = (coreAnalysis._meta?.cost || 0) + qaResult.cost;

  return {
    ...coreAnalysis as AnalysisResult,
    humanReviewNeeded: qaResult.humanReviewNeeded,
    reviewReason: qaResult.reviewReason,
    _meta: {
      ...coreAnalysis._meta,
      cost: totalCost
    }
  };
};