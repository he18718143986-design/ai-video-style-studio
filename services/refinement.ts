
import { ModelType, Scene, StyleProfile } from "../types";
import { generateWithFallback } from "./core";
import { Type } from "@google/genai";

/**
 * Refines a script based on user instructions using Gemini.
 * NOW INCLUDES: Structural Mirroring & Length Constraints to ensure video sync.
 */
export const refineScriptWithAI = async (
  currentScript: string, 
  instruction: string, 
  styleProfile: StyleProfile
): Promise<string> => {
  
  // 1. Calculate current metrics to use as anchors
  const currentWordCount = currentScript.split(/\s+/).length;
  const wpm = styleProfile.wordsPerMinute || 130;
  const targetDuration = Math.ceil((currentWordCount / wpm) * 60);

  const prompt = `
    Act as a professional Video Script Editor.
    
    ### CONTEXT
    We are refining the script for an existing video timeline. 
    **CRITICAL**: The visual track is already cut to a specific length. You must rewrite the content without breaking the timing.
    
    ### CURRENT SCRIPT
    """
    ${currentScript}
    """
    
    ### USER INSTRUCTION (The Goal)
    "${instruction}"
    
    ### STYLE DNA (The Voice)
    - Tone: ${styleProfile.tone}
    - Audience: ${styleProfile.targetAudience}
    
    ### LENGTH & SYNC CONSTRAINTS (CRITICAL)
    1. **Word Count Anchor**: The current script is ~${currentWordCount} words. Your rewritten version MUST be within ±10% of this length.
    2. **Duration Anchor**: The target duration is ~${targetDuration} seconds. Do not write a novel if the original was a haiku.
    3. **Structural Integrity**: You MUST preserve all Markdown headers (e.g. "## Scene 1") exactly as they are. These are used to map visuals.
    
    ### LANGUAGE PROTOCOL
    - **Maintain the language of the original script.**
    - If the user instruction is in a different language, translate the INTENT, but write the script content in the ORIGINAL script's language.

    ### TASK
    Rewrite the script to satisfy the User Instruction while strictly adhering to the Length Constraints and preserving the scene headers.
    Return ONLY the new script in Markdown format.
  `;

  const response = await generateWithFallback(
    ModelType.SCRIPTING,
    { parts: [{ text: prompt }] },
    {
      // We rely on the Pro model's instruction following capabilities for this constraint satisfaction.
    }
  );

  return response.text || currentScript;
};

/**
 * Refines visual prompts for ALL scenes based on a global directive.
 */
export const refineVisualsWithAI = async (
  scenes: Scene[],
  instruction: string,
  styleProfile: StyleProfile
): Promise<Scene[]> => {
  const scenesJson = JSON.stringify(scenes.map(s => ({
    id: s.id,
    number: s.number,
    narrative: s.narrative,
    visualPrompt: s.visualPrompt
  })), null, 2);

  const prompt = `
    Act as a Visual Director / Art Director.
    
    ### CONTEXT
    We have a list of scenes for a video. We need to update the "visualPrompt" for EVERY scene based on a new creative direction.
    
    ### CURRENT SCENES (JSON)
    ${scenesJson}
    
    ### NEW CREATIVE DIRECTIVE
    "${instruction}"
    
    ### STYLE DNA (Keep these if not overridden)
    - Original Style: ${styleProfile.visualStyle}
    - Palette: ${styleProfile.colorPalette.join(', ')}
    
    ### LANGUAGE PROTOCOL
    - **Narrative**: Do not touch/translate the 'narrative' field. Keep it exactly as is.
    - **Visual Prompt**: Write/Update this in **ENGLISH** for best AI Image Generation results. Even if the user instruction is in Chinese, translate the intent to English for the prompt.

    ### TASK
    1. Update the 'visualPrompt' for every scene to match the New Creative Directive.
    2. Keep the 'id', 'number', and 'narrative' exactly the same.
    3. Ensure the prompts are descriptive for an AI Image Generator.
    
    ### OUTPUT
    Return the full valid JSON Array of scene objects.
  `;

  const response = await generateWithFallback(
    ModelType.SCRIPTING,
    { parts: [{ text: prompt }] },
    {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            number: { type: Type.INTEGER },
            narrative: { type: Type.STRING },
            visualPrompt: { type: Type.STRING }
          },
          required: ["id", "number", "narrative", "visualPrompt"]
        }
      }
    }
  );

  if (!response.text) throw new Error("Failed to refine visuals.");

  const updates = JSON.parse(response.text) as any[];
  
  // Merge updates back into original scenes to preserve other fields like status/logs
  return scenes.map(scene => {
    const update = updates.find(u => u.id === scene.id);
    if (update) {
      return { ...scene, visualPrompt: update.visualPrompt };
    }
    return scene;
  });
};
