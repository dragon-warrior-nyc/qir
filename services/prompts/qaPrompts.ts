import { ProductDetails, AnalysisResult } from "../../types";

export const getQAPrompt = (
  query: string,
  product: ProductDetails,
  analysis: Partial<AnalysisResult>,
  searchContext: string
) => `
Role: You are a Quality Assurance Specialist for search relevance data.
Your task is to review an AI-generated relevance evaluation to determine if a human expert needs to verify it.

User Query: "${query}"

User Intent Context (Reference Only):
"${searchContext}"

Product Details:
Name: ${product.name}
Brand: ${product.brand}
Category: ${product.category}
Price: ${product.price}
Gender/Audience: ${product.gender}
Colors: ${product.color}
Sizes: ${product.size}
Description: ${product.description}

AI Analysis to Review:
Score: ${analysis.relevanceScore}/100
Rating Label: ${analysis.ratingLabel || 'N/A'}
Reasoning: ${analysis.reasoning}
Key Matches: ${analysis.keyMatches?.join(', ') || 'None'}
Missing Features: ${analysis.missingFeatures?.join(', ') || 'None'}
Customer Utility: ${analysis.customerUtilityAssessment || 'N/A'}

Goal: Determine if "humanReviewNeeded" is true based on the criteria below.

Criteria for Human Review (Set to TRUE if):
1. Borderline cases where the reasoning suggests uncertainty between two ratings (e.g., debating between Good vs Okay).
2. The product data is extremely vague or missing critical specs (like size/color) needed for the specific query.
3. The query contains ambiguous terms that the analysis might have misinterpreted.
4. The reasoning mentions specific conflicting attributes that don't fully justify the final score.
5. Inconsistencies appear between the Score/Label and the Missing Features (e.g., Score is Excellent but critical features are listed as missing).

If the analysis seems confident, consistent, and the data is clear, set to FALSE.

Output strictly JSON:
{
  "humanReviewNeeded": boolean,
  "reviewReason": "string (Short explanation of why review is needed, or empty string if not)"
}
`;