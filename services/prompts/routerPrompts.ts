export const getRouterPrompt = (query: string) => `
You are a smart query router optimizing for cost and efficiency.
Analyze this search query: "${query}".

Your Goal: Determine if real-time Google Search is absolutely necessary.
Default to FALSE (Internal Knowledge) unless the query requires real-time data or very specific recent knowledge.

CRITERIA FOR "NO SEARCH" (Return false):
- Generic product names (e.g., "tv", "milk", "eggs", "laptop", "shampoo", "coffee maker").
- Broad categories (e.g., "running shoes", "red dress", "office chair").
- Common knowledge products where attributes are stable (e.g., "aa batteries", "iphone charger").
- Queries where the user intent is obvious from general knowledge (e.g. "hdmi cable").

CRITERIA FOR "SEARCH NEEDED" (Return true):
- Specific, complex model numbers (e.g., "Sony XR-65A95L", "Samsung S24 Ultra").
- "Best of" queries specifically mentioning the current year or "new" (e.g., "best laptops 2025").
- Highly specific or ambiguous brand names that might be unknown.
- Queries looking for "deals", "stock", "near me", or "price" which fluctuates.
- Viral or trending items (e.g. "tiktok leggings").

Respond in JSON: { "needsSearch": boolean, "reason": string }
`;