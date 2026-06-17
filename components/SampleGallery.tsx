import React, { useState, useEffect } from 'react';
import { Play, Clock, Palette, ArrowRight, LayoutTemplate, Database } from 'lucide-react';
import { SampleTemplate, SAMPLE_TEMPLATES } from '../data/sampleTemplates';

interface SampleGalleryProps {
  onSelect: (sample: SampleTemplate) => void;
}

const SampleGallery: React.FC<SampleGalleryProps> = ({ onSelect }) => {
  return (
    <div className="animate-in fade-in duration-500 w-full overflow-x-auto custom-scrollbar pb-8">
      <div className="flex gap-6 min-w-max px-1">
        {SAMPLE_TEMPLATES.map((sample) => (
          <SampleCard key={sample.id} sample={sample} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
};

const SampleCard: React.FC<{ sample: SampleTemplate; onSelect: (s: SampleTemplate) => void }> = ({ sample, onSelect }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);

  useEffect(() => {
    let interval: any;
    if (isHovered && sample.previewFrames.length > 1) {
      interval = setInterval(() => {
        setCurrentFrame((prev) => (prev + 1) % sample.previewFrames.length);
      }, 800);
    } else {
      setCurrentFrame(0);
    }
    return () => clearInterval(interval);
  }, [isHovered, sample.previewFrames.length]);

  return (
    <div 
      className="group relative w-[320px] bg-zinc-900 border border-zinc-800 overflow-hidden hover:border-accent hover:scale-[1.02] transition-all duration-300 cursor-pointer flex flex-col shadow-xl"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect(sample)}
    >
      {/* Thumbnail Area - Poster Aspect Ratioish */}
      <div className="aspect-[16/10] relative overflow-hidden bg-black">
        <img 
          src={isHovered ? sample.previewFrames[currentFrame] : sample.thumbnailUrl} 
          alt={sample.title}
          className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-all duration-500 grayscale group-hover:grayscale-0"
        />
        
        {/* Glow Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80"></div>

        {/* Play Icon - Centered */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
           <div className="w-12 h-12 rounded-full bg-accent/20 border border-accent/50 backdrop-blur-sm flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.4)]">
              <Play className="w-5 h-5 text-white fill-white" />
           </div>
        </div>

        {/* WPM Badge */}
        <div className="absolute top-3 left-3 z-20">
          <span className="px-2 py-1 bg-black/80 backdrop-blur-md text-[9px] font-mono font-bold text-white border border-white/20 uppercase tracking-wider">
            {sample.profile.wordsPerMinute} WPM
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col bg-zinc-900 group-hover:bg-zinc-800 transition-colors">
        <h3 className="text-lg font-black text-white uppercase tracking-tight leading-tight mb-2 group-hover:text-accent transition-colors">
          {sample.title}
        </h3>
        <p className="text-xs text-zinc-400 font-medium leading-relaxed line-clamp-2 mb-4">
          {sample.description}
        </p>

        <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
           {/* Palette Chips */}
           <div className="flex items-center gap-1">
             {sample.profile.colorPalette.slice(0, 4).map((color, i) => (
               <div key={i} className="w-3 h-3 rounded-full border border-white/10 shadow-sm" style={{ backgroundColor: color }} />
             ))}
           </div>

           <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1 group-hover:text-white transition-colors">
             Initialize <ArrowRight className="w-3 h-3" />
           </span>
        </div>
      </div>
    </div>
  );
};

export default SampleGallery;