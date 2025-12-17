import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { AnalysisResult, SearchContextResult, ProductDetails } from "../types";

// Simple in-memory cache
const searchContextCache = new Map<string, SearchContextResult>();
const productDetailsCache = new Map<string, ProductDetails>();
const analysisCache = new Map<string, AnalysisResult>();

// --- PRICING CONSTANTS (Est. USD) ---
// Search Grounding: ~$35 per 1,000 requests
const PRICE_SEARCH_REQUEST = 0.035;

// Gemini Flash: Input $0.075/1M, Output $0.30/1M
const PRICE_FLASH_INPUT_1M = 0.075;
const PRICE_FLASH_OUTPUT_1M = 0.30;

// Gemini Pro (Conservative Estimate for 3.0 Pro Preview / Thinking): Input $3.50/1M, Output $10.50/1M
const PRICE_PRO_INPUT_1M = 3.50;
const PRICE_PRO_OUTPUT_1M = 10.50;

/**
 * Helper to get the AI Client, preferring user provided key
 */
const getClient = (apiKey?: string) => {
  const key = apiKey || process.env.API_KEY;
  if (!key) throw new Error("API Key is missing. Please set it in Settings or environment variables.");
  return new GoogleGenAI({ apiKey: key });
};

/**
 * Helper to calculate cost based on usage and model type
 */
function calculateCost(
  usage: GenerateContentResponse['usageMetadata'], 
  modelType: 'flash' | 'pro', 
  hasSearch: boolean
): number {
  let cost = 0;
  
  if (hasSearch) {
    cost += PRICE_SEARCH_REQUEST;
  }

  if (usage) {
    const input = usage.promptTokenCount || 0;
    const output = usage.candidatesTokenCount || 0;

    if (modelType === 'flash') {
      cost += (input / 1_000_000) * PRICE_FLASH_INPUT_1M;
      cost += (output / 1_000_000) * PRICE_FLASH_OUTPUT_1M;
    } else {
      cost += (input / 1_000_000) * PRICE_PRO_INPUT_1M;
      cost += (output / 1_000_000) * PRICE_PRO_OUTPUT_1M;
    }
  }

  return cost;
}

/**
 * LLM Router to determine if search is needed.
 */
const determineSearchNecessity = async (query: string, apiKey?: string): Promise<{ needsSearch: boolean; cost: number }> => {
  const ai = getClient(apiKey);
  try {
    const prompt = `
      You are a smart query router optimizing for cost and efficiency.
      Analyze this search query: "${query}".

      Determine if real-time Google Search is absolutely necessary to understand the *user intent* behind this query.
      
      CRITERIA FOR "NO SEARCH" (Return false):
      - Broad categories (e.g., "running shoes", "red dress").
      - Common knowledge products (e.g., "aa batteries", "iphone charger").
      - Specific attributes that don't change (e.g., "cotton t-shirt", "denim jeans").
      
      CRITERIA FOR "SEARCH NEEDED" (Return true):
      - Specific model numbers that might be very new.
      - "Best of" queries with a year (e.g., "best laptops 2024").
      - Trending items, viral products, or news-related queries.
      - Ambiguous terms that could be a brand or a slang term.
      - Specific retailer queries (e.g. "walmart deals").
      
      Respond in JSON: { "needsSearch": boolean, "reason": string }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            needsSearch: { type: Type.BOOLEAN },
            reason: { type: Type.STRING }
          }
        }
      }
    });

    const decision = JSON.parse(response.text!) as { needsSearch: boolean; reason: string };
    const cost = calculateCost(response.usageMetadata, 'flash', false);
    
    return { needsSearch: decision.needsSearch, cost };
  } catch (e) {
    console.warn("Router failed, defaulting to search.", e);
    return { needsSearch: true, cost: 0 };
  }
};

export const analyzeProductRelevance = async (
  query: string,
  product: ProductDetails,
  searchContext: string,
  apiKey?: string
): Promise<AnalysisResult> => {
  const ai = getClient(apiKey);
  const cacheKey = JSON.stringify({ 
    q: query.trim().toLowerCase(), 
    p: product, 
    c: searchContext 
  });

  if (analysisCache.has(cacheKey)) {
    console.debug(`[Cache Hit] Returning cached analysis for query: "${query}"`);
    return analysisCache.get(cacheKey)!;
  }

  try {
    const prompt = `
      You are an expert E-commerce Merchandiser and Search Analyst.
      
      Analyze the relevance of the following product for the specific customer search query: "${query}".

      IMPORTANT INSTRUCTION:
      Focus primarily on exactly what the customer typed as their primary intent. Do not "over-think" or assume the customer misspelled words unless it is a glaringly obvious error. Treat the specific keywords in the query as high-priority constraints.

      STRICT RELEVANCE GUIDELINE (Must follow exactly):
      Score the product based on the following criteria.

      | Rating | Score Range | Core Criteria |
      | :--- | :--- | :--- |
      | **4-Excellent** | **80-100** | **Perfect Match.** Exact match (narrow queries) or satisfies the dominant/primary intent (broad queries); all attributes met; product highly relevant. |
      | **3-Good** | **60-79** | **Highly Relevant, Minor Flaw.** Highly relevant but fails on *one* attribute (e.g., brand, style, size mismatch within a narrow range, or a form mismatch); or is a standard bundle. |
      | **2-Okay** | **40-59** | **Somewhat Relevant.** Relevant but not the primary intent; has multiple attributes wrong; or is an *accessory* to the main product intended in the query. |
      | **1-Bad** | **20-39** | **Slightly Relevant/Unusable.** Mostly irrelevant; item is completely unusable (e.g., wrong size/gender clothing/bedding); or crosses closely related product categories (e.g., dog shampoo for dog treats). |
      | **0-Embarrassing** | **0-19** | **Completely Irrelevant.** No connection between the product and the query; should not appear in results, even if there is slight text matching. |

      EVALUATION GUIDELINE FOR SIZE:
      For a product to receive an Excellent rating, all parts of the query, including size, must match. Size significantly impacts usability and user satisfaction. If an item is completely unusable due to size (e.g., a twin sheet set for a King bed, or size 8 shoes when size 6 was queried), it is generally rated 1-Bad. However, many product categories have flexible size requirements (e.g., TVs, rugs, dog food, trash cans, kitchen appliances). In these cases, a result with a different size might still provide value to customers if it is reasonably close to the size specified in the query. Judges should use their best judgment to determine what "reasonably close" means for each category. Results falling within a reasonable range of the queried size should be rated Good (e.g., a 7.2 x 9.5 rug for an "8x10 rugs" query or a 75-inch TV for a "70-inch TV" query), provided other attributes match.

      EVALUATION GUIDELINE FOR BRAND:
      Brand relevance is determined by whether the returned product matches the brand specified in the query. A brand mismatch typically reduces the relevance rating to Good or lower, depending on the severity and product category. If the query consists solely of a brand name, rate the matching product as Excellent, even if that brand name is a homonym (a word that has multiple meanings or refers to different things in other contexts).

      User Intent Context (derived from Google Search):
      "${searchContext}"
      
      Product Details:
      Name: ${product.name}
      Brand: ${product.brand}
      Category: ${product.category}
      Price: ${product.price}
      Gender/Audience: ${product.gender}
      Badge/Label: ${product.badge}
      Colors: ${product.color}
      Sizes: ${product.size}
      Description: ${product.description}
      
      Special Consideration for Badges:
      If the product has a badge (e.g., "Clearance", "Best Seller", "Rollback"), evaluate if this enhances the relevance for this specific query.
      - "Clearance"/"Rollback"/"Deal" increases relevance for queries like "cheap", "sale", "discount", "budget".
      - "Best Seller"/"Popular" increases relevance for queries like "best", "popular", "top rated".
      
      Evaluate "Customer Utility": How well does this product solve the user's specific problem or intent implied by the query?

      HUMAN REVIEW RECOMMENDATION:
      Evaluate if a human expert should verify this result. Set 'humanReviewNeeded' to true if:
      1. The query intent is still highly ambiguous even with context (e.g., very obscure slang).
      2. The product details are insufficient to make a definitive judgment.
      3. The score is extremely borderline (e.g., 59 vs 60, or 79 vs 80) where subjective interpretation changes the rating category.
      4. The product is in a high-risk category (e.g., medical, safety) and relevance is not 100% clear.
      
      ALWAYS provide a concise 'reviewReason' explaining your recommendation, even if human review is NOT needed (e.g. "Match is definitive and query is unambiguous").
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
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
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response text from Gemini.");
    
    const result = JSON.parse(text) as AnalysisResult;
    
    // Calculate Cost
    const cost = calculateCost(response.usageMetadata, 'pro', false);
    
    result._meta = {
      cost,
      usage: {
        promptTokens: response.usageMetadata?.promptTokenCount || 0,
        candidatesTokens: response.usageMetadata?.candidatesTokenCount || 0,
      }
    };
    
    analysisCache.set(cacheKey, result);

    return result;

  } catch (error) {
    console.error("Deep analysis failed:", error);
    throw error;
  }
};

export const getSearchQueryContext = async (
    query: string, 
    apiKey?: string,
    forceSearch: boolean = false
): Promise<SearchContextResult> => {
  const ai = getClient(apiKey);
  // include forceSearch in cache key so toggling optimization refreshes the context
  const cacheKey = `${query.trim().toLowerCase()}_${forceSearch}`;

  if (searchContextCache.has(cacheKey)) {
    return searchContextCache.get(cacheKey)!;
  }

  // 1. Router Step: Determine if we need search
  let needsSearch = forceSearch;
  let routerCost = 0;

  if (!forceSearch) {
      const decision = await determineSearchNecessity(query, apiKey);
      needsSearch = decision.needsSearch;
      routerCost = decision.cost;
      console.log(`Router Decision for "${query}": Search Needed = ${needsSearch}`);
  } else {
      console.log(`Router Skipped: Forcing search for "${query}"`);
  }

  try {
    let response;
    let hasSearchTool = false;

    if (needsSearch) {
      const prompt = `
        Perform a Google Search to understand the current context and user intent for the query: "${query}".
        
        IMPORTANT: Ensure you investigate how this query is handled on major retailer sites like Walmart.com alongside general web search results.
        
        What are customers usually looking for when they search this? Are there specific brands, features, or price points associated with this query currently?
        Summarize the intent in 2-3 sentences.
      `;

      response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });
      hasSearchTool = true;
    } else {
      const prompt = `
        You are an e-commerce expert. The user has searched for: "${query}".
        
        Based on general knowledge, explain what customers are usually looking for when they search this.
        What are the typical key features, brands, or attributes associated with this product category?
        Summarize the intent in 2-3 sentences.
      `;

      response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        // No tools
      });
      hasSearchTool = false;
    }

    const overview = response.text || "Could not retrieve context.";
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    // Calculate Cost (add router cost)
    const operationCost = calculateCost(response.usageMetadata, 'flash', hasSearchTool);
    const totalCost = routerCost + operationCost;

    const result: SearchContextResult = {
      overview,
      groundingChunks: groundingChunks as any[],
      source: hasSearchTool ? 'SEARCH' : 'KNOWLEDGE',
      _meta: { cost: totalCost }
    };

    searchContextCache.set(cacheKey, result);

    return result;

  } catch (error) {
    console.error("Search context generation failed:", error);
    return {
      overview: "Context search unavailable.",
      groundingChunks: [],
      source: 'KNOWLEDGE'
    };
  }
};

export const extractProductDetailsFromUrl = async (url: string, apiKey?: string): Promise<ProductDetails> => {
  const ai = getClient(apiKey);
  const cacheKey = url.trim();

  if (productDetailsCache.has(cacheKey)) {
    return productDetailsCache.get(cacheKey)!;
  }

  try {
    const prompt = `
      I need to extract product details for an e-commerce item.
      
      Here is the link provided: "${url}"
      
      Please perform a Google Search for this URL or the product keywords contained within it to find the most accurate and up-to-date information.
      
      Task:
      1. Identify the product name, price, brand, and key attributes.
      2. Return the data strictly as a JSON object.
      3. Do NOT use markdown code blocks. Just the raw JSON string.
      
      Required JSON Structure:
      {
        "name": "string",
        "description": "string (summary)",
        "price": "string",
        "category": "string",
        "brand": "string",
        "size": "string (comma separated)",
        "color": "string (comma separated)",
        "gender": "string (Men, Women, etc)",
        "badge": "string (optional, e.g. Best Seller)"
      }
      
      If you cannot find the specific product, try to infer the category and brand from the URL itself, or return empty strings for unknown fields.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    let text = response.text;
    
    // Check if text is present. If not, try to construct it from parts or fallback.
    if (!text) {
        // Fallback: If no text generated, return empty structure with warning.
        // This often happens if the model got confused by the tool output.
        console.warn("No text generated for product extraction. Returning empty details.");
         return {
            name: '',
            description: '',
            price: '',
            category: '',
            brand: '',
            size: '',
            color: '',
            gender: '',
            badge: '',
            _meta: { cost: calculateCost(response.usageMetadata, 'flash', true) }
        };
    }
    
    text = text.trim();
    if (text.startsWith("```json")) {
        text = text.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (text.startsWith("```")) {
        text = text.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    let rawDetails;
    try {
        rawDetails = JSON.parse(text);
    } catch (e) {
        // If JSON parse fails, return empty to avoid crashing UI
        console.warn("JSON parse failed for extraction", e);
        throw new Error("Failed to parse extracted data from AI response.");
    }
    
    // Calculate Cost
    const cost = calculateCost(response.usageMetadata, 'flash', true);

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
    
    productDetailsCache.set(cacheKey, details);

    return details;
  } catch (error) {
    console.error("Product extraction failed:", error);
    throw new Error("Could not extract details. The URL might be invalid or not indexable by Google Search.");
  }
};