export const getExtractionPrompt = (url: string, query?: string) => {
  const contextInstruction = query 
    ? `You are an e-commerce search relevancy evaluator. You are tasked to evaluate the search relevancy between the search query "${query}" and this product. Please extract product information that is helpful for the downstream evaluation task.`
    : `I need to extract product details for an e-commerce item.`;

  return `${contextInstruction}

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
}