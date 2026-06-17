
import { getAI, withRetry } from "./core";
import { ModelType } from "../types";
import { Modality, GenerateContentResponse } from "@google/genai";

/**
 * Generates audio for a specific text using Gemini 2.5 TTS.
 * This returns a Blob URL that can be used in the Video Renderer.
 */
export const generateSpeech = async (text: string): Promise<{ audioUrl: string, duration: number }> => {
  const ai = getAI();

  try {
    // Call Gemini 2.5 Flash TTS
    const response = await withRetry<GenerateContentResponse>(
      () => ai.models.generateContent({
        model: ModelType.TTS,
        contents: { parts: [{ text: text }] },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' }, // 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
            },
          },
        },
      }),
      3, 1000, "TTS Generation"
    );

    // Extract Audio Data
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      console.warn("Gemini TTS returned no audio data. Fallback to silent estimation.");
      return generateSilentEstimation(text);
    }

    // Convert Base64 to Blob URL
    // NOTE: Gemini TTS returns raw PCM/WAV usually. Decoding via AudioContext works best.
    const binaryString = window.atob(base64Audio);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // We create a generic blob. The renderer will decode it.
    const blob = new Blob([bytes], { type: 'audio/wav' }); 
    const url = URL.createObjectURL(blob);
    
    // To get exact duration immediately for the UI, we decode a copy
    // We do this in a try/catch so if decoding fails (bad header), we don't crash, just estimate duration.
    let duration = 0;
    try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const audioBuffer = await audioCtx.decodeAudioData(bytes.buffer.slice(0)); 
        duration = audioBuffer.duration;
        audioCtx.close();
    } catch (e) {
        console.warn("Could not decode audio duration immediately (might be raw PCM). Renderer will retry.", e);
        const words = text.split(' ').length;
        duration = Math.max(3, words / 2.5);
    }

    return {
      audioUrl: url,
      duration: duration
    };

  } catch (error: any) {
    const msg = error.toString();
    if (msg.includes("404") || msg.includes("not found")) {
        console.error("TTS Model not found. Please ensure your API Key has access to 'gemini-2.5-flash-preview-tts'.");
    } else if (msg.includes("403")) {
        console.error("TTS Permission Denied. Check API Key quotas/billing.");
    } else {
        console.error("TTS Generation Failed:", error);
    }
    return generateSilentEstimation(text);
  }
};

/**
 * Fallback if TTS fails or is unavailable.
 * Returns an empty URL but a calculated duration so the video timing still works (silently).
 */
const generateSilentEstimation = async (text: string): Promise<{ audioUrl: string, duration: number }> => {
   // Estimate duration based on word count (avg 150 wpm = 2.5 words/sec)
   const words = text.split(' ').length;
   const duration = Math.max(3, words / 2.5); // Min 3 seconds
   return { audioUrl: '', duration };
};
