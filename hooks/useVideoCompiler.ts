
import { useState } from 'react';
import { Scene } from '../types';
import { generateSpeech } from '../services/tts';
import { compileEpisode } from '../services/videoRenderer';

export const useVideoCompiler = () => {
  const [isCompiling, setIsCompiling] = useState(false);
  const [compileProgress, setCompileProgress] = useState('');
  const [finalVideoUrl, setFinalVideoUrl] = useState<string | null>(null);

  const compileVideo = async (scenes: Scene[], aspectRatio: string, mood: string) => {
    setIsCompiling(true);
    setCompileProgress('正在初始化渲染引擎...');
    
    // Create a copy to avoid mutating state directly during the render loop (local mutation only)
    const renderScenes = [...scenes];

    try {
      // 1. Generate Audio for all scenes first (Orchestration Step)
      for (let i = 0; i < renderScenes.length; i++) {
        const scene = renderScenes[i];
        if (!scene.audioUrl) {
          setCompileProgress(`合成语音: 场景 ${i + 1}/${renderScenes.length}`);
          try {
            const { audioUrl, duration } = await generateSpeech(scene.narrative);
            scene.audioUrl = audioUrl;
            if (duration && duration > 0) {
                scene.estimatedDuration = duration;
            }
          } catch (e) { 
              console.error(`Failed to generate audio for scene ${i+1}`, e);
          }
        }
      }

      setCompileProgress('生成程序化配乐并合成...');
      
      // 2. Call the Renderer Service
      const videoUrl = await compileEpisode(
        renderScenes, 
        aspectRatio, 
        mood, 
        (msg) => setCompileProgress(msg)
      );
      
      setFinalVideoUrl(videoUrl);
      setIsCompiling(false);
      return videoUrl;

    } catch (e) {
      console.error(e);
      setCompileProgress('错误: 渲染失败。请查看控制台。');
      setTimeout(() => setIsCompiling(false), 3000);
      throw e;
    }
  };

  const clearVideo = () => setFinalVideoUrl(null);

  return {
    isCompiling,
    compileProgress,
    finalVideoUrl,
    compileVideo,
    clearVideo
  };
};
