
import React from 'react';
import { AppState } from '../../types';
import SampleGallery from '../SampleGallery';
import { Monitor, Power, Play } from 'lucide-react';

interface PreviewStageProps {
  state: AppState;
  onResetProfile: () => void;
  onLoadProfile: (profile: any) => void;
}

const PreviewStage: React.FC<PreviewStageProps> = ({ state, onResetProfile, onLoadProfile }) => {
  const isTemplateActive = !!state.styleProfile;
  const isVideoLoaded = !!state.referenceVideoUrl;
  const isVideoPlayable = isVideoLoaded && !state.referenceVideoUrl?.startsWith("data:image");
  const hasContent = isVideoLoaded || isTemplateActive;

  return (
    <div className="flex flex-col h-full bg-[#050505]">
       {/* HEADER */}
       <div className={`flex-shrink-0 h-14 flex items-center justify-between px-5 select-none ${hasContent ? 'border-b border-white/5 bg-[#0a0a0a]' : ''}`}>
          <div className="flex items-center gap-3">
             {hasContent && (
               <div className="w-8 h-8 bg-zinc-900 border border-white/10 rounded-sm flex items-center justify-center shadow-inner">
                  <Monitor className="w-4 h-4 text-zinc-400" />
               </div>
             )}
             {hasContent && (
               <div>
                  <h2 className="text-xs font-black text-zinc-100 tracking-[0.2em] uppercase leading-none mb-0.5 flex items-center gap-2">
                     素材预览
                     <div className={`w-1.5 h-1.5 rounded-full ${isVideoLoaded || isTemplateActive ? 'bg-emerald-500 shadow-[0_0_5px_#10b981]' : 'bg-zinc-700'}`}></div>
                  </h2>
                  <p className="text-[9px] text-zinc-500 font-mono tracking-wider uppercase">
                    {state.referenceTitle ? `素材: ${state.referenceTitle}` : '无信号'}
                  </p>
               </div>
             )}
          </div>
          <div className="flex items-center gap-3">
             {hasContent && (
                <button 
                  onClick={onResetProfile} 
                  className="h-8 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-widest border border-red-500/20 hover:border-red-500/40 rounded-sm flex items-center gap-2 transition-all"
                  title="清除当前项目"
                >
                  <Power className="w-3.5 h-3.5" />
                  清除素材
                </button>
             )}
          </div>
       </div>

       {/* CONTENT BODY */}
       <div className="flex-1 overflow-y-auto custom-scrollbar relative bg-dot-grid bg-[size:30px_30px]">
         <div className="w-full max-w-5xl mx-auto p-8 space-y-8">
             
             {/* Player Container */}
             <div className="relative w-full">
                {hasContent ? (
                    <div className={`
                       relative bg-black rounded-sm border border-zinc-800 shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden group mx-auto transition-all
                       ${state.targetAspectRatio === "9:16" ? "max-w-sm aspect-[9/16]" : "aspect-video"}
                    `}>
                        {/* Overlay Status */}
                        {isTemplateActive && (
                            <div className="absolute top-4 left-4 z-30 flex items-center gap-2">
                               <div className="bg-red-600/90 text-white text-[9px] font-black px-2 py-0.5 uppercase tracking-widest flex items-center gap-2 backdrop-blur-sm rounded-sm shadow-lg">
                                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-blink"></span>
                                  信号直播中
                               </div>
                               <div className="bg-black/60 text-zinc-300 text-[9px] font-mono px-2 py-0.5 border border-white/10 rounded-sm backdrop-blur-md">
                                  {state.targetAspectRatio}
                               </div>
                            </div>
                        )}
                        
                        {isVideoPlayable ? (
                            <video src={state.referenceVideoUrl!} controls className="w-full h-full object-contain bg-black" autoPlay={isTemplateActive} />
                        ) : (
                            <div className="relative w-full h-full flex justify-center bg-black group cursor-default">
                                <img src={state.referenceThumbnailUrl || state.styleProfile?._meta?.sourceThumbnail} alt="Reference" className="h-full w-full object-contain opacity-50 group-hover:opacity-80 transition-all duration-700 scale-100 group-hover:scale-105" />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                                        <Play className="w-6 h-6 text-white" fill="currentColor" />
                                    </div>
                                </div>
                                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgNDBMMCAwTDQwIDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsIDI1NSwgMjU1LCAwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIiAvPjwvc3ZnPg==')] opacity-50 pointer-events-none"></div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="aspect-video flex items-center justify-center">
                    </div>
                )}
             </div>

             {/* Library Section */}
             <div className="pt-8">
                <div className="flex items-center justify-center mb-6 opacity-30">
                </div>
                <SampleGallery onSelect={(template) => onLoadProfile(template)} />
             </div>
         </div>
       </div>
    </div>
  );
};

export default PreviewStage;
