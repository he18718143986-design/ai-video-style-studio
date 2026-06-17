
import { Type } from "@google/genai";
import { StyleProfile, ModelType } from "../types";
import { generateWithFallback, uploadVideoToGemini, fileToGenerativePart } from "./core";

export const analyzeStyle = async (videoFile: File, onProgress?: (msg: string) => void): Promise<StyleProfile> => {
  
  // Detect if video is likely too large for inline (20MB safe limit for base64 encoded)
  // 20MB in bytes is ~20971520. Base64 adds ~33%.
  // However, the error 400 Invalid Argument often comes from inline limits regardless of exact size if backend rejects it.
  // Using uploadVideoToGemini is safer for all videos to ensure processing.
  
  let videoPart;
  try {
     videoPart = await uploadVideoToGemini(videoFile, onProgress);
  } catch (e) {
     console.warn("File API Upload failed.", e);
     
     // CRITICAL FIX: Do NOT fallback to inline if the file is large, as this causes an opaque 400 Invalid Argument error.
     // It is better to show the user the upload failed than to send a request that we know will fail.
     if (videoFile.size > 20 * 1024 * 1024) {
        throw new Error(`Video upload failed and file (${(videoFile.size / (1024 * 1024)).toFixed(1)}MB) is too large for inline analysis fallback. Please try a smaller file or check your API key permissions.`);
     }

     console.warn("Attempting fallback to inline base64 (only works for small files)...");
     videoPart = await fileToGenerativePart(videoFile);
  }

  const prompt = `
    Act as an expert Film Director and Educational Psychologist. 
    Deeply analyze this video to extract its "Style DNA".
    
    ### LANGUAGE PROTOCOL (CRITICAL)
    1. **Detect Language**: Listen to the speech in the video.
    2. **Output Language**: All textual analysis (visualStyle, tone, narrativeStructure, etc.) MUST be written in the **SAME LANGUAGE** as the video's speech.
       - If the video speaks **Chinese**, the JSON values MUST be in **Chinese**.
       - If the video speaks **English**, the JSON values MUST be in **English**.
       - The 'fullTranscript' must be verbatim in the original language.

    ### TASK
    I need to replicate this video's exact style for a new series. 
    You must separate your analysis into two distinct channels (Visual vs Audio) before combining them.
    Take your time to listen to every word and observe every frame.

    ### 1. VISUAL ANALYSIS (Look at the screen)
    - Art Style: Is it 3D, 2D vector, collage, stock footage, or live action?
    - Colors: Extract the specific hex palette.
    - Pacing: How fast are the cuts?
    - Key Elements: Unique visual signatures (e.g., floating text, split screens).

    ### 2. AUDIO/SCRIPT ANALYSIS (Listen to the speaker)
    - Tone: Is it authoritative, friendly, sarcastic, or urgent?
    - Pedagogical Approach: How do they teach? (Metaphors, direct instruction, Socratic method?)
    - Script Style: Analyze the linguistics. Is it simple words? Complex jargon? Short sentences? Slang?
    - Narrative Structure: Break down the video into a list of structural beats (e.g., "The Hook", "The Core Question", "The Analogy", "The Takeaway").
    
    ### 3. TRANSCRIPTION & METRICS (CRITICAL) ###
    - **FULL TRANSCRIPT**: Listen to the ENTIRE video and transcribe the speech verbatim. This is critical for measuring the exact length and content density.
    - **Word Count**: Count the total words/characters in the transcript.
    - **Speaking Rate**: Estimate the Words Per Minute (WPM) or Characters Per Minute (CPM).

    ### OUTPUT REQUIREMENT ###
    Return a JSON object with the following fields. 
  `;

  // UPGRADE: Use Thinking Config to force deep reasoning about the style
  const response = await generateWithFallback(
    ModelType.ANALYSIS,
    { parts: [videoPart, { text: prompt }] },
    {
      // Allocate tokens for "thinking" to ensure high-quality analysis
      thinkingConfig: { thinkingBudget: 2048 }, 
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          visualStyle: { type: Type.STRING },
          pacing: { type: Type.STRING },
          tone: { type: Type.STRING },
          colorPalette: { type: Type.ARRAY, items: { type: Type.STRING } },
          targetAudience: { type: Type.STRING },
          keyElements: { type: Type.ARRAY, items: { type: Type.STRING } },
          pedagogicalApproach: { type: Type.STRING },
          narrativeStructure: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "A list of 3-5 sequential steps that describe the video's storytelling formula."
          },
          scriptStyle: { type: Type.STRING },
          fullTranscript: { type: Type.STRING, description: "Verbatim transcript of the entire video." },
          wordCount: { type: Type.INTEGER },
          wordsPerMinute: { type: Type.INTEGER }
        },
        required: [
          "visualStyle", "pacing", "tone", "colorPalette", "targetAudience", 
          "keyElements", "pedagogicalApproach", "narrativeStructure", "scriptStyle", 
          "fullTranscript", "wordCount", "wordsPerMinute"
        ]
      }
    }
  );

  if (!response.text) throw new Error("Failed to analyze video style.");
  return JSON.parse(response.text) as StyleProfile;
};

export const performSafetyCheck = async (topic: string): Promise<{ isMedical: boolean; reason: string }> => {
  const prompt = `Is the topic "${topic}" related to medical advice, health safety, or emergency procedures? Return JSON.`;
  
  const response = await generateWithFallback(
    ModelType.SAFETY,
    prompt,
    {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          isMedical: { type: Type.BOOLEAN },
          reason: { type: Type.STRING }
        }
      }
    }
  );

  if (!response.text) throw new Error("Safety check failed.");
  return JSON.parse(response.text);
};
