
import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, SkipBack, SkipForward, Image as ImageIcon, Film, Volume2, VolumeX, Monitor } from 'lucide-react';
import { Scene } from '../types';

interface Props {
  scenes: Scene[];
  isOpen: boolean;
  onClose: () => void;
}

const DraftPlayer: React.FC<Props> = ({ scenes, isOpen, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  const stopAudio = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
      stopAudio();
    }
    return () => stopAudio();
  }, [isOpen]);

  const playCurrentScene = () => {
    stopAudio();
    if (!scenes[currentIndex]) return;

    const currentScene = scenes[currentIndex];
    const estimatedTime = (currentScene.estimatedDuration || 3) * 1000;

    // 1. If Muted, just use a simple timer based on estimation
    if (isMuted) {
      timerRef.current = setTimeout(() => {
         handleNextAuto();
      }, estimatedTime);
      return;
    }

    // 2. If Sound On, use Browser TTS and wait for it to finish
    if (typeof window !== 'undefined' && window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(currentScene.narrative);
        utterance.rate = 1.0; 
        
        // Try to select a better voice
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Natural')) || voices[0];
        if (preferredVoice) utterance.voice = preferredVoice;
        
        // CRITICAL FIX: Advance ONLY when audio ends
        utterance.onend = () => {
           // Small pause after speaking before cut
           timerRef.current = setTimeout(() => {
              handleNextAuto();
           }, 500); 
        };

        // Fallback: If TTS fails or hangs (browser quirk), force advance after (duration * 1.5)
        const safetyTimeout = Math.max(estimatedTime * 1.5, 5000); 
        const safetyTimer = setTimeout(() => {
           if (window.speechSynthesis.speaking) {
              console.warn("TTS Timed out, forcing advance");
              window.speechSynthesis.cancel();
              handleNextAuto();
           }
        }, safetyTimeout);
        
        // Clear safety timer on end
        const originalOnEnd = utterance.onend;
        utterance.onend = (ev) => {
            clearTimeout(safetyTimer);
            if (originalOnEnd) originalOnEnd.call(utterance, ev);
        };

        speechRef.current = utterance;
        window.speechSynthesis.speak(utterance);
    } else {
        // Fallback if no TTS support
        timerRef.current = setTimeout(() => {
           handleNextAuto();
        }, estimatedTime);
    }
  };

  useEffect(() => {
    if (isOpen && isPlaying) {
        playCurrentScene();
    } else {
        stopAudio();
    }
    return () => stopAudio();
  }, [currentIndex, isPlaying, isOpen, isMuted]);

  // Handle auto-advance logic
  const handleNextAuto = () => {
      if (currentIndex < scenes.length - 1) {
          setCurrentIndex(prev => prev + 1);
      } else {
          setIsPlaying(false);
          stopAudio();
      }
  };

  if (!isOpen) return null;

  const currentScene = scenes[currentIndex];

  const handleNext = () => { if (currentIndex < scenes.length - 1) setCurrentIndex(prev => prev + 1); };
  const handlePrev = () => { if (currentIndex > 0) setCurrentIndex(prev => prev - 1); };
  
  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
    // Re-trigger effect to switch logic
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === ' ') setIsPlaying(!isPlaying);
    if (e.key === 'ArrowRight') handleNext();
    if (e.key === 'ArrowLeft') handlePrev();
    if (e.key === 'm') setIsMuted(!isMuted);
  };

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 md:p-8 animate-in fade-in duration-300 font-mono"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      autoFocus
    >
      {/* Viewfinder Frame with Ambient Glow */}
      <div className="relative w-full max-w-6xl aspect-video bg-[#050505] border border-zinc-800 shadow-[0_0_100px_rgba(100,100,100,0.1)] flex flex-col overflow-hidden group select-none">
        
        {/* SAFE AREA & MARKERS OVERLAY */}
        <div className="absolute inset-0 pointer-events-none z-20 opacity-50">
           {/* Crosshair */}
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 border border-white/20"></div>
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-white/50 rounded-full"></div>
           
           {/* Safe Area */}
           <div className="absolute inset-12 border border-dashed border-white/10 rounded-sm"></div>
           
           {/* Corner Brackets */}
           <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-white/30"></div>
           <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-white/30"></div>
           <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-white/30"></div>
           <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-white/30"></div>
        </div>

        {/* INFO OVERLAYS (Top) */}
        <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-30">
           <div className="flex flex-col gap-1">
              <span className={`text-[9px] font-black px-1.5 py-0.5 uppercase tracking-widest inline-block w-fit ${isPlaying ? 'bg-red-600 text-white animate-pulse' : 'bg-zinc-700 text-zinc-400'}`}>
                {isPlaying ? 'REC' : 'PAUSED'}
              </span>
              <span className="text-[10px] text-zinc-400">TCR 00:00:{String(Math.floor(currentIndex * 5)).padStart(2,'0')}:12</span>
           </div>
           
           <div className="flex gap-4">
              <div className="flex flex-col items-end gap-1">
                 <span className="text-[9px] text-zinc-500 uppercase">ISO 800</span>
                 <span className="text-[9px] text-zinc-500 uppercase">1/50</span>
                 <span className="text-[9px] text-zinc-500 uppercase">f/2.8</span>
              </div>
           </div>
        </div>

        {/* VIDEO CONTENT */}
        <div className="flex-1 relative bg-black flex items-center justify-center">
          {currentScene.assetUrl ? (
             currentScene.assetType === 'video' ? (
                <video src={currentScene.assetUrl} className="w-full h-full object-contain" autoPlay muted loop />
             ) : (
                <img src={currentScene.assetUrl} className="w-full h-full object-contain" />
             )
          ) : (
            <div className="flex flex-col items-center justify-center">
               <div className="w-full h-px bg-zinc-800 absolute top-1/2"></div>
               <div className="h-full w-px bg-zinc-800 absolute left-1/2"></div>
               <span className="bg-black text-zinc-500 text-[10px] px-2 relative z-10 border border-zinc-800">NO_SIGNAL</span>
            </div>
          )}
          
          {/* Subtitles (Burn-in Simulation) */}
          <div className="absolute bottom-16 left-0 right-0 text-center px-12 z-30">
             <span className="inline-block bg-black/60 backdrop-blur-sm text-white text-lg md:text-xl font-medium px-4 py-2 font-sans shadow-lg">
               {currentScene.narrative}
             </span>
          </div>
        </div>

        {/* CONTROLS (Bottom) */}
        <div className="absolute bottom-0 left-0 right-0 h-14 bg-[#09090b] border-t border-white/10 z-40 flex items-center justify-between px-6">
           <div className="flex items-center gap-4">
              <span className="text-[9px] font-mono text-accent">SCENE {String(currentScene.number).padStart(2,'0')}</span>
              <div className="w-px h-4 bg-white/10"></div>
              <span className="text-[9px] font-mono text-zinc-500">{currentScene.estimatedDuration}s (EST)</span>
           </div>

           <div className="flex items-center gap-4">
              <button onClick={handlePrev} disabled={currentIndex === 0} className="text-zinc-500 hover:text-white disabled:opacity-30"><SkipBack className="w-4 h-4" /></button>
              <button onClick={() => setIsPlaying(!isPlaying)} className="text-white hover:text-accent transition-colors">
                 {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
              </button>
              <button onClick={handleNext} disabled={currentIndex === scenes.length - 1} className="text-zinc-500 hover:text-white disabled:opacity-30"><SkipForward className="w-4 h-4" /></button>
           </div>

           <div className="flex items-center gap-4">
              <button onClick={toggleMute} className="text-zinc-500 hover:text-white">
                 {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <div className="w-px h-4 bg-white/10"></div>
              <button onClick={onClose} className="text-zinc-500 hover:text-red-500">
                 <X className="w-4 h-4" />
              </button>
           </div>
        </div>

        {/* PROGRESS BAR */}
        <div className="absolute bottom-[55px] left-0 right-0 h-0.5 bg-zinc-800 z-50">
           <div 
             className="h-full bg-accent shadow-[0_0_8px_rgba(139,92,246,0.8)] transition-all duration-300 linear"
             style={{ width: `${((currentIndex + 1) / scenes.length) * 100}%` }}
           ></div>
        </div>

      </div>
      
      <p className="mt-4 text-[9px] text-zinc-600 uppercase tracking-[0.2em]">Press SPACE to Toggle Playback // ESC to Exit</p>
    </div>
  );
};

export default DraftPlayer;
