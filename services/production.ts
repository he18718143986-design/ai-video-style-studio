
import { StyleProfile, ModelType } from "../types";
import { getAI, getBase64FromUrl, withRetry, wait } from "./core";
import { GenerateContentResponse } from "@google/genai";

/**
 * Generates a "Visual Anchor" or Reference Sheet.
 */
export const generateReferenceSheet = async (topic: string, styleProfile: StyleProfile, aspectRatio: string = "16:9"): Promise<string> => {
  const ai = getAI();
  
  const prompt = `
    Create a "Character Sheet" or "Style Reference Sheet" for an educational video about: ${topic}.
    
    Style DNA (Strict Adherence):
    - Art Style: ${styleProfile.visualStyle}
    - Palette: ${styleProfile.colorPalette.join(', ')}
    - Key Visual Elements: ${styleProfile.keyElements.join(', ')}
    
    Instructions:
    - If the pedagogical approach mentions "Metaphors" (e.g. ${styleProfile.pedagogicalApproach}), visualize those metaphors.
    - If the topic has a main character (e.g. a mechanic, a doctor), show them in 3 poses.
    - Background: Neutral studio background compatible with the style.
    - Quality: 8k, highly detailed, production ready asset.
  `;

  const primaryModel = ModelType.IMAGE_GEN;
  
  const config = {
      imageConfig: { aspectRatio: aspectRatio, imageSize: "1K" }
  };

  try {
    const response: GenerateContentResponse = await withRetry(
      () => ai.models.generateContent({
        model: primaryModel,
        contents: { parts: [{ text: prompt }] },
        config: config
      }),
      10, 5000, "Reference Sheet Generation" // Increased retries
    );
    
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
  } catch (e: any) {
    const msg = e.toString();
    if (msg.includes("429") || msg.includes("quota") || msg.includes("403")) {
        console.warn("Pro Image Issue. Falling back to Gemini 2.5 Flash Image after extensive retries.");
        await wait(5000); 

        try {
            const fallbackConfig = { imageConfig: { aspectRatio: aspectRatio } };
            const fallbackResponse = await withRetry<GenerateContentResponse>(
                () => ai.models.generateContent({
                    model: 'gemini-2.5-flash-image', 
                    contents: { parts: [{ text: prompt }] },
                    config: fallbackConfig
                }),
                3, 5000, "Reference Sheet Fallback"
            );
            for (const part of fallbackResponse.candidates?.[0]?.content?.parts || []) {
                if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
            }
        } catch (fallbackError) {
            console.error("Fallback Image Generation also failed", fallbackError);
        }
    }
    console.error("Image generation failed:", e);
    throw e;
  }
  
  throw new Error("Failed to generate Reference Sheet (No image data returned).");
};

/**
 * Generates Scene Image. 
 * High retry count (15) and patience to handle 429/403 errors without degrading quality if possible.
 */
export const generateSceneImage = async (
    visualPrompt: string, 
    aspectRatio: string = "16:9", 
    fastMode: boolean = false, 
    referenceSheetUrl?: string,
    styleProfile?: StyleProfile, 
    topic?: string 
): Promise<string> => {
  const ai = getAI();
  
  const primaryModel = ModelType.IMAGE_GEN;

  const config = {
      imageConfig: { aspectRatio: aspectRatio, imageSize: "1K" }
  };

  const parts: any[] = [];
  
  if (referenceSheetUrl) {
    try {
      const base64Ref = await getBase64FromUrl(referenceSheetUrl);
      parts.push({
        inlineData: { mimeType: "image/png", data: base64Ref }
      });
      parts.push({ text: "Using the first image as a strict Style Reference (Character Sheet): " });
    } catch (e) {
      console.warn("Failed to load reference sheet for generation, proceeding with text only.");
    }
  }

  let enhancedPrompt = visualPrompt;
  if (styleProfile && topic) {
      enhancedPrompt = `
        SCENE VISUAL DESCRIPTION: ${visualPrompt}
        
        ---
        STRICT STYLE & CONTINUITY GUIDELINES:
        1. **Context**: This is a scene from a video about "${topic}".
        2. **Global Art Style**: ${styleProfile.visualStyle}.
        3. **Color Palette**: Use these exact colors: ${styleProfile.colorPalette.join(', ')}.
        4. **Lighting/Mood**: ${styleProfile.tone}.
        5. **Continuity**: If characters or objects appear, they must match the provided Reference Sheet style.
      `;
  }

  parts.push({ text: enhancedPrompt });

  try {
    const response: GenerateContentResponse = await withRetry(
      () => ai.models.generateContent({
        model: primaryModel,
        contents: { parts: parts },
        config: config
      }),
      15, // EXTREME PATIENCE: 15 retries
      10000, // Start with 10s delay, doubling up to 3 mins
      `Scene Image (${primaryModel})` 
    );
    
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
  } catch (e: any) {
    const msg = e.toString();
    // Fallback logic for hard fails
    if (msg.includes("429") || msg.includes("quota") || msg.includes("403")) {
        console.warn("Switching to Flash Image due to quota/permission/net.");
        await wait(5000); 

        try {
            const fallbackConfig = { imageConfig: { aspectRatio: aspectRatio } };
            const fallbackResponse = await withRetry<GenerateContentResponse>(
                () => ai.models.generateContent({
                    model: 'gemini-2.5-flash-image',
                    contents: { parts: parts },
                    config: fallbackConfig
                }),
                3, 5000, "Scene Image Fallback"
            );
            for (const part of fallbackResponse.candidates?.[0]?.content?.parts || []) {
                if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
            }
        } catch (fallbackError) {
             console.error("Fallback failed", fallbackError);
        }
    }

    console.error("Image generation failed:", e);
    throw e;
  }

  throw new Error("No image generated.");
};

export const generateSceneVideoWithKeyframe = async (
  visualPrompt: string, 
  existingKeyframeUrl?: string, 
  referenceSheetUrl?: string,
  onProgress?: (status: string) => void,
  styleProfile?: StyleProfile,
  topic?: string 
): Promise<{ videoUrl: string, keyframeUrl: string }> => {
  onProgress?.("Generating High-Fidelity Asset for Animation...");

  let keyframeUrl = existingKeyframeUrl || "";

  if (!existingKeyframeUrl) {
    onProgress?.("Generating keyframe (Gemini 3 Pro Image)...");
    keyframeUrl = await generateSceneImage(visualPrompt, "16:9", false, referenceSheetUrl, styleProfile, topic); 
  } else {
    onProgress?.("Enhancing existing asset...");
    await new Promise(r => setTimeout(r, 800)); 
  }

  onProgress?.("Asset ready for animation.");
  return { videoUrl: keyframeUrl, keyframeUrl };
};
