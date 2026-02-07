export const getExtractionPrompt = (url: string, query?: string) => {
  const contextInstruction = query 
    ? `You are an e-commerce search relevancy evaluator. You are tasked to evaluate the search relevancy between the search query "${query}" and this product. Please extract product information that is helpful for the downstream evaluation task.`
    : `I need to extract product details for an e-commerce item.`;

  return `${contextInstruction}

Here is the link provided: "${url}"

Task:
1. Analyze the URL string itself to identify the product name, brand, category, and other attributes (e.g. look for the slug or ID).
2. Use your internal knowledge base to fill in details if the product is recognizable from the URL (e.g. a known movie, book, or electronic device).
3. Return the data strictly as a JSON object.
4. Do NOT use markdown code blocks. Just the raw JSON string.

Required JSON Structure:
{
  "name": "string",
  "description": "string (summary)",
  "price": "string",
  "category": "string",
  "brand": "string",
  "size": "string (comma separated)",
  "color": "string (comma separated)",
  "gender": "string (Men, Women, etc)"
}

If you cannot find the specific product details from the URL pattern, try to infer the category and brand at minimum. Return empty strings for unknown fields.
`;
}