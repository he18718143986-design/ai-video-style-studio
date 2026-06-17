import { ResearchData, ModelType } from "../types";
import { generateWithFallback, getAI, withRetry } from "./core";
import { GenerateContentResponse } from "@google/genai";

/**
 * Performs deep research on a topic using Google Search Grounding.
 * Retrieves verified facts, sources, myths, and definitions.
 */
export const performResearch = async (topic: string): Promise<ResearchData> => {
  const prompt = `
    Conduct rigorous research on the topic: "${topic}".
    
    ### LANGUAGE PROTOCOL (CRITICAL)
    - **Detect Language**: Identify the language of the topic input "${topic}".
    - **Output Language**: The output JSON (facts, myths, glossary) **MUST** be in the **SAME LANGUAGE** as the topic.
    - If the topic is Chinese, return Chinese content.
    
    Your goal is to provide a "Fact Sheet" that will be used to write an educational video script.
    
    ### REQUIREMENTS ###
    1. **Key Facts**: Find 5-7 distinct, verifiable facts about the topic. 
       - Focus on the "What", "Why", "How", and "Safety/Risk".
       - You MUST use the Google Search tool to find these.
    
    2. **Myth Busting**: Identify 3 common misconceptions or myths about this topic.
    
    3. **Glossary**: Define 3-4 key technical terms or jargon that a layperson might not know.
    
    ### FORMAT ###
    You must return a **valid JSON object** representing the data.
    The JSON structure must be:
    {
      "facts": [
        { "content": "Fact string", "source": "Source URL or Name", "confidence": "High" }
      ],
      "myths": ["Myth 1", "Myth 2"],
      "glossary": [
        { "term": "Term", "definition": "Definition" }
      ]
    }
    
    IMPORTANT: Do not include markdown formatting (like \`\`\`json). Return only the raw JSON string.
  `;

  // We primarily use gemini-3-flash-preview because it supports Search grounding well.
  // However, if it fails (Rpc error, 500, etc.), we explicitly fall back to 'gemini-2.5-flash'
  // because 2.5 is very stable with tools.
  
  let responseText = "";
  const ai = getAI();

  try {
      // Primary Attempt
      const response = await withRetry<GenerateContentResponse>(
          () => ai.models.generateContent({
              model: ModelType.RESEARCH,
              contents: { parts: [{ text: prompt }] },
              config: { tools: [{ googleSearch: {} }] }
          }),
          2, 2000, "Research (Primary)"
      );
      responseText = response.text || "";
  } catch (error) {
      console.warn("Primary Research Model (3-Flash) failed. Falling back to Gemini 2.5 Flash.", error);
      
      // Fallback Attempt: Gemini 2.5 Flash
      const response = await withRetry<GenerateContentResponse>(
          () => ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: { parts: [{ text: prompt }] },
              config: { tools: [{ googleSearch: {} }] }
          }),
          3, 2000, "Research (Fallback)"
      );
      responseText = response.text || "";
  }

  if (!responseText) throw new Error("Research generation failed on both primary and fallback models.");
  
  // Clean up response text to ensure it's valid JSON
  let cleanText = responseText.trim();
  // Remove markdown code blocks if present
  if (cleanText.startsWith("```json")) {
    cleanText = cleanText.replace(/^```json/, "").replace(/```$/, "");
  } else if (cleanText.startsWith("```")) {
    cleanText = cleanText.replace(/^```/, "").replace(/```$/, "");
  }
  
  let data;
  try {
    data = JSON.parse(cleanText);
  } catch (e) {
    console.error("Failed to parse Research JSON:", cleanText);
    throw new Error("Research output was not valid JSON. Please try again.");
  }
  
  return {
    ...data,
    rawGroundingMetadata: null // Simplified for this implementation
  };
};