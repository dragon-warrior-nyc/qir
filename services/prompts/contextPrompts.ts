export const getSearchIntentPrompt = (query: string) => `
Perform a Google Search to understand the current context and user intent for the query: "${query}".

IMPORTANT: 
1. Assume there is no spell check issue. Interpret the query exactly as it is written.
2. Ensure you investigate how this query is handled on major retailer sites like Walmart.com alongside general web search results.

What are customers usually looking for when they search this? Are there specific brands, features, or price points associated with this query currently?
Summarize the intent in 2-3 sentences.
`;

export const getKnowledgeIntentPrompt = (query: string) => `
You are an e-commerce expert. The user has searched for: "${query}".

IMPORTANT: Assume there is no spell check issue. Interpret the query exactly as it is written.

Based on general knowledge, explain what customers are usually looking for when they search this.
What are the typical key features, brands, or attributes associated with this product category?
Summarize the intent in 2-3 sentences.
`;