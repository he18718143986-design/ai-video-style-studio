
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ModelType } from "../types";

// Helper to get AI instance with current key
export const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY_MISSING");
  }
  return new GoogleGenAI({ apiKey });
};

export const checkApiKey = async (): Promise<boolean> => {
  if (typeof window !== 'undefined' && (window as any).aistudio) {
    return await (window as any).aistudio.hasSelectedApiKey();
  }
  return !!process.env.API_KEY;
};

export const promptApiKeySelection = async (): Promise<void> => {
  if (typeof window !== 'undefined' && (window as any).aistudio) {
    await (window as any).aistudio.openSelectKey();
  }
};

export const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve({
        inlineData: {
          data: base64String,
          mimeType: file.type || 'video/mp4',
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const uploadVideoToGemini = async (file: File, onProgress?: (msg: string) => void): Promise<{ fileData: { fileUri: string; mimeType: string } }> => {
  const ai = getAI();
  onProgress?.("Uploading video to Gemini (this may take a moment)...");
  
  // Robust mimeType detection
  let mimeType = file.type;
  if (!mimeType) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'mkv') mimeType = 'video/x-matroska';
      else if (ext === 'mov') mimeType = 'video/quicktime';
      else if (ext === 'avi') mimeType = 'video/x-msvideo';
      else mimeType = 'video/mp4'; // Default fallback
  }

  try {
    const uploadResponse = await ai.files.upload({
      file: file,
      config: { displayName: file.name, mimeType: mimeType }
    });
    
    if (!uploadResponse) {
      throw new Error(`Upload succeeded but returned no file metadata. Response: ${JSON.stringify(uploadResponse)}`);
    }

    let fileInfo = uploadResponse;
    onProgress?.("Video uploaded. Waiting for processing...");
    
    while (fileInfo.state === 'PROCESSING') {
      await new Promise(r => setTimeout(r, 2000));
      const status = await ai.files.get({ name: fileInfo.name });
      if (status) {
        fileInfo = status;
      }
    }
    
    if (fileInfo.state === 'FAILED') {
      throw new Error(`Video processing failed on Gemini servers: ${fileInfo.error?.message || 'Unknown error'}`);
    }
    
    onProgress?.("Video processed successfully.");

    return {
      fileData: {
        fileUri: fileInfo.uri,
        mimeType: fileInfo.mimeType
      }
    };
  } catch (error: any) {
    console.error("Upload failed:", error);
    throw error;
  }
};

export const getBase64FromUrl = async (url: string): Promise<string> => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
       const res = reader.result as string;
       resolve(res.split(',')[1]); 
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export interface VideoMetadata {
  thumbnail: string;
  width: number;
  height: number;
  duration: number;
}

export const generateVideoThumbnail = async (videoFile: File): Promise<VideoMetadata> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    
    const url = URL.createObjectURL(videoFile);
    video.src = url;

    video.onloadeddata = () => {
      video.currentTime = Math.min(1.0, video.duration * 0.1);
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 320; 
        
        let width = video.videoWidth;
        let height = video.videoHeight;
        const originalWidth = width;
        const originalHeight = height;

        if (width > MAX_WIDTH) {
           const scale = MAX_WIDTH / width;
           width = MAX_WIDTH;
           height = height * scale;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(video, 0, 0, width, height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6); 
        
        URL.revokeObjectURL(url);
        resolve({
          thumbnail: dataUrl,
          width: originalWidth,
          height: originalHeight,
          duration: video.duration
        });
      } catch (e) {
        URL.revokeObjectURL(url);
        reject(e);
      }
    };

    video.onerror = (e) => {
       URL.revokeObjectURL(url);
       reject(e);
    };
  });
};

export const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * AGGRESSIVE RETRY LOGIC for High Quality Models.
 * Designed to handle Gemini 3 Pro Preview rate limits by waiting patiently.
 */
export const withRetry = async <T>(
  fn: () => Promise<T>, 
  retries = 3, 
  delay = 2000,
  operationName = "API Call"
): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    const msg = error.toString();
    const status = error.status || 0;

    // FAIL FAST: 400 Invalid Argument (Usually means request is malformed, retrying won't help)
    if (status === 400) {
       throw error;
    }

    // RETRY: 429 Resource Exhausted / 503 Service Unavailable / 500 Internal Error / RPC Errors
    // Added 403 Permission Denied as transient because sometimes it can be a quota/billing glitch.
    const isTransient = status === 429 || status === 503 || status === 500 || status === 403 ||
                        msg.includes('429') || msg.includes('503') || msg.includes('500') || msg.includes('403') ||
                        msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED') ||
                        msg.includes('PERMISSION_DENIED') ||
                        msg.includes('overloaded') ||
                        msg.includes('Rpc failed') || msg.includes('xhr error') || 
                        msg.includes('fetch failed');
    
    if (retries > 0 && isTransient) {
      console.warn(`[${operationName}] Error (${status || 'Network'}). Waiting ${delay}ms... (Retries left: ${retries})`);
      await wait(delay);
      // Exponential backoff with higher cap (180s = 3 minutes) for high quality retention
      const nextDelay = Math.min(delay * 2, 180000); 
      return withRetry(fn, retries - 1, nextDelay, operationName);
    }
    throw error;
  }
};

/**
 * STRATEGIC FALLBACK LOGIC.
 */
export const generateWithFallback = async (primaryModel: string, contents: any, config: any): Promise<GenerateContentResponse> => {
  const ai = getAI();
  
  try {
    return await withRetry(
      () => ai.models.generateContent({
        model: primaryModel,
        contents,
        config
      }),
      3, 
      2000, 
      `Primary Generation (${primaryModel})`
    );
  } catch (e: any) {
    const msg = e.toString();
    // Broad error checking for fallback
    if (msg.includes("429") || msg.includes("quota") || msg.includes("403") || msg.includes("404") || msg.includes("500")) {
      console.warn(`[Fallback Triggered] Primary model ${primaryModel} failed. Switching to ${ModelType.TEXT_FALLBACK}.`);
      await wait(1500);
      const { thinkingConfig, ...fallbackConfig } = config; 
      
      return await withRetry(
        () => ai.models.generateContent({
          model: ModelType.TEXT_FALLBACK,
          contents,
          config: fallbackConfig
        }),
        3, 2000, "Fallback Generation (Flash)"
      );
    }
    throw e;
  }
};
