
import { Type } from "@google/genai";
import { Scene, StyleProfile, ModelType, ResearchData, NarrativeMap } from "../types";
import { generateWithFallback } from "./core";

/**
 * NEW: Generates a Narrative Map (Beat Sheet).
 * This maps the raw Facts (Research) onto the Narrative Structure (Style).
 */
export const generateNarrativeMap = async (topic: string, styleProfile: StyleProfile, researchData: ResearchData): Promise<NarrativeMap> => {
  const structureList = styleProfile.narrativeStructure.join(', ');
  
  const prompt = `
    Act as a Content Strategist.
    
    GOAL: Create a "Narrative Map" for a video about "${topic}".

    ### LANGUAGE PROTOCOL
    - The output fields (sectionTitle, description) **MUST** be in the same language as the input "${topic}".
    
    INPUTS:
    1. **Narrative Structure (Style DNA)**: This is the formula the video MUST follow: ${structureList}.
    2. **Knowledge Base (Facts)**:
       ${researchData.facts.map((f, i) => `(ID: Fact-${i+1}) ${f.content}`).join('\n       ')}
       
    TASK:
    Map the Facts onto the Narrative Structure to create a coherent flow.
    - Create a list of beats (sections).
    - For each beat, define the specific sub-topic or goal.
    - **CRITICAL**: Explicitly assign which Fact IDs (e.g., Fact-1) belong to which beat. Do not leave facts unused if possible.
    - Estimate the duration (total should be approx ${styleProfile.wordCount / (styleProfile.wordsPerMinute / 60)} seconds).

    OUTPUT: JSON Array of objects (NarrativeBeat).
  `;

  const response = await generateWithFallback(
    ModelType.SCRIPTING,
    { parts: [{ text: prompt }] },
    {
      // Removed thinkingConfig to save tokens. Pro model reasoning is sufficient for structure mapping.
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            sectionTitle: { type: Type.STRING },
            description: { type: Type.STRING, description: "Strategic goal of this section." },
            estimatedDuration: { type: Type.NUMBER, description: "Seconds" },
            factReferences: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "The specific Fact IDs (e.g. 'Fact-1') assigned to this beat." 
            }
          },
          required: ["sectionTitle", "description", "estimatedDuration", "factReferences"]
        }
      }
    }
  );

  if (!response.text) throw new Error("Narrative Map generation failed.");
  return JSON.parse(response.text);
};

/**
 * Generates a human-friendly draft script.
 * Updated: Relaxed constraints to allow for better narrative flow while still respecting the structure.
 */
export const generateDraftScript = async (
  topic: string, 
  styleProfile: StyleProfile, 
  researchData: ResearchData,
  narrativeMap?: NarrativeMap
): Promise<string> => {
  
  let structuralDirectives = "";
  
  if (narrativeMap) {
    structuralDirectives = `
    ### NARRATIVE BLUEPRINT ###
    Use the provided "Narrative Map" as your structural guide. 
    
    For each section:
    1. **Core Focus**: Ensure the section covers the 'description' and integrates the assigned 'factReferences'.
    2. **Flow & Cohesion**: You ARE allowed to smooth transitions between sections. Do not make the script feel robotic or disjointed. If a concept in Beat 1 naturally leads into Beat 2, write a smooth segue.
    3. **Timing**: Aim for the 'estimatedDuration' based on a speaking rate of ${styleProfile.wordsPerMinute} WPM.

    Here is the Narrative Map:
    ${JSON.stringify(narrativeMap, null, 2)}
    `;
  } else {
    structuralDirectives = `Structure: ${styleProfile.narrativeStructure.join(' -> ')}`;
  }
  
  const prompt = `
    Act as the content creator of the reference video.
    Your goal is to write a script for a NEW video on the topic: "${topic}".
    
    ### LANGUAGE PROTOCOL (CRITICAL)
    - Write the script in the **SAME LANGUAGE** as the topic "${topic}".
    - If the topic is Chinese, the script must be Chinese.
    
    ### 1. VOICE & STYLE INPUTS (From Step 1)
    - Tone: ${styleProfile.tone}
    - Style: ${styleProfile.scriptStyle}
    - Audience: ${styleProfile.targetAudience}
    - Speaking Rate: ${styleProfile.wordsPerMinute} WPM
    - Total Target Word Count: ~${styleProfile.wordCount} words.

    ### 2. KNOWLEDGE BASE INPUTS (From Step 3)
    (Integrate these details naturally where the Narrative Map suggests)
    ${researchData.facts.map((f, i) => `[Fact-${i+1}]: ${f.content}`).join('\n')}
    
    Myths to Bust: ${researchData.myths.join(', ')}
    Key Terms: ${researchData.glossary.map(g => g.term).join(', ')}
    
    ### 3. STRUCTURE INPUTS (From Step 4)
    ${structuralDirectives}

    ### REFERENCE TRANSCRIPT (For Style Matching)
    """
    ${styleProfile.fullTranscript.substring(0, 500)}...
    """
    
    ### OUTPUT TASK ###
    Write the full voiceover script in Markdown.
    - Use headers for scenes (e.g. ## Scene 1: [Beat Title]).
    - Do not include visual directions here, only the spoken audio.
    - **PRIORITY**: Make it sound like a natural, engaging video script, not a list of facts.
    `;

  const response = await generateWithFallback(
    ModelType.SCRIPTING,
    { parts: [{ text: prompt }] },
    {
       // Removed thinkingConfig. Standard Pro model provides excellent creative writing capabilities without the overhead.
    } 
  );

  return response.text || "Failed to generate script.";
};

export const generateStoryboard = async (topic: string, styleProfile: StyleProfile, confirmedScript: string): Promise<Scene[]> => {
  // --- PACING-DRIVEN SEGMENTATION ALGORITHM ---
  // Mimic a human editor: Determine scene count based on pacing, not arbitrary numbers.
  
  // FIX: Correctly count words for CJK (Chinese/Japanese/Korean) text where spaces are rare.
  const isCJK = /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/.test(confirmedScript);
  const wordCount = isCJK ? confirmedScript.replace(/\s+/g, '').length : confirmedScript.split(/\s+/).length;
  
  // PRECISION TIMING CALCULATION
  let totalDurationSec = 0;
  let calculationMethod = "Estimate";

  if (styleProfile.sourceDuration && styleProfile.wordCount > 0) {
     const sourceSecondsPerWord = styleProfile.sourceDuration / styleProfile.wordCount;
     totalDurationSec = wordCount * sourceSecondsPerWord;
     calculationMethod = "Precision (Source Ratio)";
  } else {
     let wpm = styleProfile.wordsPerMinute || 140; 
     if (isCJK && wpm < 160) {
         wpm = 200; 
     }
     totalDurationSec = (wordCount / wpm) * 60;
     totalDurationSec = Math.max(totalDurationSec, wordCount * 0.3); 
     calculationMethod = "Estimate (WPM)";
  }

  // Define Average Shot Length (ASL) based on pacing style
  let asl = 6; // Default Medium
  const pacingLower = styleProfile.pacing.toLowerCase();
  
  if (pacingLower.includes('fast') || pacingLower.includes('energetic') || pacingLower.includes('rapid')) {
    asl = 3.5; // Fast cuts
  } else if (pacingLower.includes('slow') || pacingLower.includes('deliberate') || pacingLower.includes('meditative')) {
    asl = 8; // Slow cuts
  }

  // Calculate Target Scene Count
  const calculatedScenes = Math.max(5, Math.min(40, Math.ceil(totalDurationSec / asl)));
  
  console.log(`[Director Logic] Words/Chars: ${wordCount}, Duration: ${totalDurationSec.toFixed(1)}s (${calculationMethod}), Pacing: ${styleProfile.pacing} -> Target Scenes: ${calculatedScenes}`);

  const prompt = `
    Act as a Master Educational Video Director.
    Task: Create a detailed production storyboard based on the provided script.
    
    ### INPUT 1: SOURCE SCRIPT (Markdown)
    """
    ${confirmedScript}
    """
    
    ### INPUT 2: VISUAL STYLE DNA
    - Visual Style: ${styleProfile.visualStyle}
    - Key Elements: ${styleProfile.keyElements.join(', ')}
    - Palette: ${styleProfile.colorPalette.join(', ')}

    ### CONSTRAINT: SCENE COUNT
    Target approx ${calculatedScenes} scenes based on the flow.
    
    ### STRICT DIRECTIVES (CRITICAL)
    1. **Script Fidelity**: The 'narrative' field MUST contain the **EXACT VERBATIM** text from the Source Script for that segment. 
    2. **Visual Continuity (IMPORTANT)**: 
       - The 'visualPrompt' for sequential scenes MUST act like a cohesive video. 
       - If Scene 1 introduces a character, Scene 2 must explicitly mention "The same character from previous scene..." in its prompt.
       - Use keywords like "Close up of the previous object", "Wide shot of the same room".
    3. **Timestamps**: Estimate duration based on the length of the text. 
    4. **PACING CONTROL**: 
       - **Do NOT create scenes longer than 12 seconds.**
       - Long static shots (over 15s) are prohibited.

    ### LANGUAGE PROTOCOL
    1. **Narrative**: Must match the script exactly.
    2. **Production Specs**: Same language as script.
    3. **Visual Prompt**: Write this in **ENGLISH**. AI Image Generators work best with English prompts.

    ### TASK
    1. Break the script into ${calculatedScenes} logical scenes.
    2. For each scene, write a "Visual Prompt" for an AI Image Generator.
    3. Extract the exact corresponding text segment for 'narrative'.
    4. Define Production Specs (Camera, Lighting, Sound).
    
    ### OUTPUT
    Return a JSON Array of Scene objects.
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
            visualPrompt: { type: Type.STRING },
            productionSpecs: {
              type: Type.OBJECT,
              properties: {
                 camera: { type: Type.STRING },
                 lighting: { type: Type.STRING },
                 sound: { type: Type.STRING }
              }
            },
            estimatedDuration: { type: Type.NUMBER }
          },
          required: ["id", "number", "narrative", "visualPrompt", "productionSpecs", "estimatedDuration"]
        }
      }
    }
  );

  if (!response.text) throw new Error("Storyboard generation failed.");
  const scenes = JSON.parse(response.text) as Scene[];
  
  // Post-process to ensure IDs and status
  return scenes.map((s, i) => ({
    ...s,
    id: `scene-${Date.now()}-${i}`,
    number: i + 1,
    status: 'pending',
    assetType: 'image',
    logs: []
  }));
};
