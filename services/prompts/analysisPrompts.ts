import { ProductDetails } from "../../types";

export const getAnalysisPrompt = (
  query: string, 
  product: ProductDetails, 
  searchContext: string
) => `
You are an expert E-commerce Merchandiser and Search Analyst.

Analyze the relevance of the following product for the specific customer search query: "${query}".

IMPORTANT INSTRUCTION:
1. **Exact Match Priority**: Your primary source of truth is the explicit keywords in the user's query. You MUST honor the exact match between the query terms and the product attributes (e.g., Brand, Size, Color, Gender, Flavor).
2. **Context as Reference Only**: The "User Intent Context" provided below is secondary. It is strictly for background understanding of broad categories. It must NEVER override a direct mismatch between the query text and product details.
3. **No Spell Check Assumption**: Interpret the query exactly as written. Do not assume typos or attempt to correct the user's spelling.

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

EVALUATION GUIDELINE FOR BUNDLES:
To evaluate bundle relevance, first ensure the primary item matches the user's intent; if it does, the rating is determined by the nature of the secondary items. Assign a 4-Excellent if the additional items are essential for functionality (e.g., batteries), integrated features (e.g., built-in screen protectors), explicit "freebies," or naturally paired sets that rarely sell separately (e.g., a wand and tiara set). If the bundle includes the desired product but the secondary items are merely extra value-adds rather than essential or traditional pairings, assign a 3-Good.
Analogy: Think of a bundle like a Value Meal at a restaurant. If you only wanted the burger, receiving the fries and a drink is still a "Good" result because you got what you wanted, even if you have to deal with the extra items. However, if the burger requires a wrapper to be edible, that wrapper isn't an "extra" item—it's a dependency, making the result "Excellent."

User Intent Context (Reference Only):
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