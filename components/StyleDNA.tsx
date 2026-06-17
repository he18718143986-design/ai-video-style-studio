
import React, { useState } from 'react';
import { Palette, Clock, MessageCircle, Users, Zap, BookOpen, GitGraph, Type, Eye, Mic, Check, Bookmark, FileText, Timer, Quote, Binary, Hash, ArrowRight } from 'lucide-react';
import { StyleProfile } from '../types';
import { saveProfileToLibrary } from '../services/storage';

interface StyleDNAProps {
  profile: StyleProfile;
  referenceTitle?: string;
  referenceThumbnailUrl?: string;
  onProceed: () => void; // NEW: Callback to move to next stage
}

const StyleDNA: React.FC<StyleDNAProps> = ({ profile, referenceTitle, referenceThumbnailUrl, onProceed }) => {
  const [isSaved, setIsSaved] = useState(false);

  const handleSaveToLibrary = () => {
    const dataToSave = {
      ...profile,
      _meta: { sourceTitle: referenceTitle || 'Untitled Style', sourceThumbnail: referenceThumbnailUrl || '' }
    };
    if (saveProfileToLibrary(dataToSave)) {
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    }
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-2 duration-500 bg-[#050505] bg-dot-grid bg-[size:20px_20px]">
      
      {/* UNIFIED HEADER: STYLE DNA */}
      <div className="flex-shrink-0 h-14 border-b border-white/5 bg-[#0a0a0a] flex items-center justify-between px-5 select-none">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-zinc-900 border border-white/10 rounded-sm flex items-center justify-center shadow-inner">
             <Binary className="w-4 h-4 text-zinc-400" />
          </div>
          <div>
            <h2 className="text-xs font-black text-zinc-100 tracking-[0.2em] uppercase leading-none mb-0.5 flex items-center gap-2">
              风格分析
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_5px_#10b981]"></div>
            </h2>
            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">
              解码完成 // {referenceTitle || '未知来源'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
           <button 
             onClick={handleSaveToLibrary}
             className={`h-8 px-3 text-[10px] font-bold uppercase tracking-widest transition-all rounded-sm flex items-center gap-2 border 
               ${isSaved 
                 ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                 : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white border-white/5'
               }`}
           >
             {isSaved ? <Check className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
             {isSaved ? '已归档' : '保存预设'}
           </button>
           
           <div className="h-4 w-px bg-white/10"></div>

           <button 
             onClick={onProceed}
             className="h-8 px-4 bg-white hover:bg-zinc-200 text-black text-[10px] font-black uppercase tracking-widest rounded-sm flex items-center gap-2 transition-all shadow-lg"
           >
             开始调研
             <ArrowRight className="w-3.5 h-3.5" />
           </button>
        </div>
      </div>
      
      {/* CONTENT: Data Grid */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        
          {/* COLUMN 1: VISUAL METRICS */}
          <div className="space-y-8">
            <div className="bg-[#09090b] border border-white/5 p-6 shadow-2xl relative rounded-sm group">
                {/* Decorative Corner */}
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/20"></div>
                
                <SectionHeader icon={Eye} title="视觉风格" />
                
                <div className="space-y-6">
                    <DataBlock label="艺术指导">
                       <p className="text-sm text-zinc-200 font-mono leading-relaxed border-l-2 border-accent pl-4 py-1">
                         {profile.visualStyle}
                       </p>
                    </DataBlock>

                    <DataBlock label="色度数据">
                      <div className="grid grid-cols-5 gap-3">
                        {profile.colorPalette.map((color, i) => (
                          <div key={i} className="flex flex-col group/color cursor-default">
                             <div className="aspect-[3/4] w-full shadow-lg transition-transform group-hover/color:scale-105 border border-white/10" style={{ backgroundColor: color }}></div>
                             <div className="bg-white p-1 text-center border border-white/10 border-t-0">
                                <span className="text-[9px] font-mono text-black font-bold block">{color}</span>
                             </div>
                          </div>
                        ))}
                      </div>
                    </DataBlock>
                    
                    <div className="grid grid-cols-2 gap-6 pt-4 border-t border-white/5">
                        <DataBlock label="节奏模型">
                            <div className="flex items-center gap-2">
                               <Clock className="w-3.5 h-3.5 text-zinc-500" />
                               <span className="text-xs font-mono text-white">{profile.pacing}</span>
                            </div>
                        </DataBlock>
                        <DataBlock label="目标受众">
                             <div className="flex items-center gap-2">
                                <Users className="w-3.5 h-3.5 text-zinc-500" />
                                <span className="text-xs font-mono text-white">{profile.targetAudience}</span>
                             </div>
                        </DataBlock>
                    </div>

                    <DataBlock label="视觉锚点">
                      <div className="flex flex-wrap gap-2">
                        {profile.keyElements.map((el, i) => (
                          <span key={i} className="text-[10px] bg-zinc-900 text-zinc-300 px-3 py-1.5 border border-zinc-700 font-mono uppercase tracking-tight">
                            {el}
                          </span>
                        ))}
                      </div>
                    </DataBlock>
                </div>
            </div>
          </div>

          {/* COLUMN 2: LINGUISTIC METRICS */}
          <div className="space-y-8">
             <div className="bg-[#09090b] border border-white/5 p-6 shadow-2xl relative rounded-sm group">
                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/20"></div>

                <SectionHeader icon={Mic} title="语言模式" />
            
                 {/* Transcript Terminal */}
                 <div className="relative group/term mb-8">
                    <div className="bg-[#050505] border border-white/10 p-4 font-mono text-[10px] text-zinc-400 overflow-y-auto custom-scrollbar h-40 shadow-inner leading-relaxed rounded-sm transition-colors group-hover/term:border-white/20">
                       <span className="text-emerald-500 font-bold block mb-2 sticky top-0 bg-[#050505]/90 backdrop-blur-sm pb-1 border-b border-emerald-500/20">{"> source_transcript.log"}</span>
                       {profile.fullTranscript || 'No audio transcript detected.'}
                    </div>
                    {/* Stats Bar */}
                    <div className="flex items-center gap-6 mt-3 px-1">
                       <StatItem label="字数" value={profile.wordCount} />
                       <div className="h-4 w-px bg-white/10"></div>
                       <StatItem label="语速" value={`~${profile.wordsPerMinute}`} />
                    </div>
                 </div>

                 <div className="space-y-6">
                     <DataBlock label="脚本架构">
                       <p className="text-xs text-zinc-300 font-mono leading-relaxed">
                         {profile.scriptStyle}
                       </p>
                     </DataBlock>

                     <DataBlock label="叙事序列">
                       <div className="space-y-2 border-l border-white/10 pl-4">
                         {profile.narrativeStructure.map((step, i) => (
                           <div key={i} className="flex items-baseline gap-3 text-xs font-mono text-zinc-400 group/step">
                              <span className="text-[10px] text-zinc-600 font-bold min-w-[20px] group-hover/step:text-accent transition-colors">0{i + 1}</span>
                              <span className="text-zinc-300 group-hover/step:text-white transition-colors">{step}</span>
                           </div>
                         ))}
                       </div>
                     </DataBlock>

                     <DataBlock label="讲述逻辑">
                       <div className="flex items-start gap-2 bg-[#050505] p-3 border border-white/5 rounded-sm">
                          <BookOpen className="w-4 h-4 text-zinc-500 mt-0.5 shrink-0" />
                          <p className="text-xs text-zinc-400 font-mono leading-relaxed">{profile.pedagogicalApproach}</p>
                       </div>
                     </DataBlock>
                 </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

// Sub-components for strict layout control
const SectionHeader: React.FC<{ icon: any, title: string }> = ({ icon: Icon, title }) => (
  <div className="flex items-center gap-3 border-b border-white/10 pb-4 mb-6">
    <div className="p-1.5 bg-zinc-800/50 rounded-sm">
      <Icon className="w-4 h-4 text-white" />
    </div>
    <h3 className="text-xs font-black uppercase tracking-[0.25em] text-white">{title}</h3>
  </div>
);

const DataBlock: React.FC<{ label: string, children: React.ReactNode }> = ({ label, children }) => (
  <div className="space-y-2.5">
    <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
      <span className="w-1 h-1 bg-zinc-600 rounded-full"></span>
      {label}
    </h4>
    {children}
  </div>
);

const StatItem: React.FC<{ label: string, value: string | number }> = ({ label, value }) => (
  <div className="flex flex-col gap-0.5">
     <span className="text-[9px] text-zinc-600 uppercase tracking-wider font-bold">{label}</span>
     <span className="text-sm font-mono text-white">{value}</span>
  </div>
);

export default StyleDNA;
