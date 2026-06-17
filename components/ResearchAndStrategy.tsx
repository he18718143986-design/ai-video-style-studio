
import React, { useState } from 'react';
import { ResearchData, NarrativeMap } from '../types';
import { AlertOctagon, GraduationCap, Globe, ArrowRight, ShieldCheck, Database, Layers, Clock, Share2, AlertTriangle, Hash, FileText, Search } from 'lucide-react';

interface ResearchAndStrategyProps {
  researchData: ResearchData;
  narrativeMap: NarrativeMap | null;
  topic: string;
  onProceed: () => void;
}

const ResearchAndStrategy: React.FC<ResearchAndStrategyProps> = ({ researchData, narrativeMap, topic, onProceed }) => {
  const totalDuration = narrativeMap ? narrativeMap.reduce((acc, beat) => acc + beat.estimatedDuration, 0) : 0;
  
  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-2 duration-500 bg-[#050505] text-zinc-100">
      
      {/* UNIFIED HEADER: WRITERS ROOM */}
      <div className="flex-shrink-0 h-14 border-b border-white/5 bg-[#0a0a0a] flex items-center justify-between px-5 z-20 select-none">
        <div className="flex items-center gap-3">
           <div className="w-8 h-8 bg-zinc-900 border border-white/10 rounded-sm flex items-center justify-center shadow-inner">
              <FileText className="w-4 h-4 text-zinc-400" />
           </div>
           <div>
             <h2 className="text-xs font-black text-zinc-100 tracking-[0.2em] uppercase leading-none mb-0.5 flex items-center gap-2">
               内容策划
               <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_5px_#10b981]"></div>
             </h2>
             <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">
               情报在线 // {topic.toUpperCase()}
             </span>
           </div>
        </div>

        <div className="flex items-center gap-6">
           {narrativeMap ? (
             <button 
               onClick={onProceed}
               className="h-8 px-4 bg-white hover:bg-zinc-200 text-black text-[10px] font-black uppercase tracking-widest rounded-sm flex items-center gap-2 transition-all shadow-lg"
             >
               起草剧本
               <ArrowRight className="w-3.5 h-3.5" />
             </button>
           ) : (
             <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-sm">
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">正在合成策略...</span>
             </div>
           )}
        </div>
      </div>

      {/* MAIN VIEWPORT */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row bg-[#050505]">
        
        {/* --- LEFT: INTELLIGENCE DATABASE (Verified Intel) --- */}
        <div className="flex-1 lg:w-2/3 flex flex-col min-h-0 bg-[#09090b] relative border-r border-white/5">
            <div className="flex-shrink-0 px-6 py-3 flex items-center justify-between sticky top-0 z-10 bg-[#09090b]/95 backdrop-blur-sm border-b border-white/5">
               <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
                 <Database className="w-3.5 h-3.5" />
                 情报素材
               </h3>
               <span className="text-[9px] font-mono text-accent bg-accent/10 px-2 py-0.5 rounded-full border border-accent/20">
                  {researchData.facts.length} 条记录
               </span>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
              
              {/* Fact Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {researchData.facts.map((fact, i) => (
                  <div key={i} className="bg-[#121214] border border-white/5 p-5 rounded-sm hover:border-white/20 transition-colors group relative overflow-hidden">
                    {/* Background Tech Deco */}
                    <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                        <span className="text-[40px] font-black font-mono text-white leading-none tracking-tighter">0{i + 1}</span>
                    </div>
                    
                    <div className="relative z-10">
                       <p className="text-xs text-zinc-300 font-mono leading-relaxed mb-4 pl-1 group-hover:text-white transition-colors">
                          "{fact.content}"
                       </p>
                       <div className="flex items-center justify-between pt-3 border-t border-white/5">
                          <div className="flex items-center gap-2">
                             <Search className="w-3 h-3 text-zinc-600" />
                             <span className="text-[9px] text-zinc-500 font-mono truncate max-w-[150px] uppercase">
                                来源: {fact.source.replace('https://', '').split('/')[0]}
                             </span>
                          </div>
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              fact.confidence.toLowerCase().includes('high') 
                              ? 'bg-emerald-950/30 text-emerald-500 border border-emerald-500/20' 
                              : 'bg-amber-950/30 text-amber-500 border border-amber-500/20'
                          }`}>
                             {fact.confidence}
                          </span>
                       </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Myths & Glossary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                 {/* Myths */}
                 <div className="bg-red-950/5 border border-red-900/10 p-5 rounded-sm">
                    <h4 className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                       <AlertTriangle className="w-4 h-4" /> 常见误区
                    </h4>
                    <div className="space-y-3">
                       {researchData.myths.map((myth, i) => (
                          <div key={i} className="flex gap-3 items-start">
                             <span className="text-red-500/50 font-bold font-mono text-xs">×</span>
                             <p className="text-xs text-red-200/60 font-mono leading-tight">{myth}</p>
                          </div>
                       ))}
                    </div>
                 </div>

                 {/* Glossary */}
                 <div className="bg-amber-950/5 border border-amber-900/10 p-5 rounded-sm">
                    <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                       <GraduationCap className="w-4 h-4" /> 术语库
                    </h4>
                    <div className="space-y-3">
                       {researchData.glossary.map((item, i) => (
                          <div key={i}>
                             <span className="text-[10px] text-amber-400/80 font-black uppercase block mb-1 font-mono">{item.term}</span>
                             <p className="text-xs text-zinc-500 font-mono leading-tight pl-2 border-l border-amber-500/10">{item.definition}</p>
                          </div>
                       ))}
                    </div>
                 </div>
              </div>

            </div>
        </div>

        {/* --- RIGHT: NARRATIVE FLOW (Digital Whiteboard) --- */}
        <div className="flex-1 lg:w-1/3 flex flex-col min-h-0 bg-[#050505] relative shadow-2xl">
            {/* Dot Grid (Dark) */}
            <div className="absolute inset-0 bg-dot-grid bg-[size:20px_20px] opacity-10 pointer-events-none"></div>

            <div className="flex-shrink-0 px-6 py-3 flex items-center justify-between sticky top-0 z-10 bg-[#050505]/95 backdrop-blur-sm border-b border-white/5">
               <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
                 <Layers className="w-3.5 h-3.5" />
                 叙事图谱
               </h3>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 relative z-10">
              {!narrativeMap ? (
                 <div className="h-full flex flex-col items-center justify-center text-center opacity-30 space-y-4">
                    <p className="font-mono text-xs text-zinc-500 animate-pulse">等待策略模块...</p>
                 </div>
              ) : (
                <div className="relative pl-2 space-y-6">
                  {/* Vertical Guide Line */}
                  <div className="absolute left-[21px] top-4 bottom-4 w-px bg-zinc-800 z-0"></div>

                  {narrativeMap.map((beat, i) => (
                    <div key={i} className="relative group pl-8">
                      {/* Connection Node */}
                      <div className="absolute left-[14px] top-6 w-3.5 h-3.5 bg-[#09090b] border border-zinc-700 rounded-full z-10 flex items-center justify-center group-hover:border-accent transition-colors">
                        <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full group-hover:bg-accent transition-all"></div>
                      </div>
                      
                      {/* Digital Node Card */}
                      <div className="bg-[#121214] border border-white/5 p-4 rounded-sm hover:border-white/20 transition-all duration-300">
                         <div className="flex justify-between items-start mb-2">
                            <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest group-hover:text-accent/70 transition-colors">
                              序列_0{i + 1}
                            </span>
                            <div className="flex items-center gap-1 text-[9px] font-mono text-zinc-500 bg-black/20 px-2 py-0.5 rounded-full">
                               <Clock className="w-3 h-3" />
                               {beat.estimatedDuration}s
                            </div>
                         </div>
                         
                         <h3 className="text-sm font-bold text-zinc-200 mb-2 font-sans tracking-tight">{beat.sectionTitle}</h3>
                         <p className="text-xs text-zinc-500 font-mono leading-relaxed mb-3">
                           {beat.description}
                         </p>

                         {/* Data Linkages */}
                         {beat.factReferences.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-3 border-t border-white/5">
                               {beat.factReferences.map((ref, idx) => (
                                 <span key={idx} className="text-[8px] font-mono text-emerald-500/60 bg-emerald-950/10 px-1.5 py-0.5 rounded-sm">
                                   关联:{ref}
                                 </span>
                               ))}
                            </div>
                         )}
                      </div>
                    </div>
                  ))}
                  
                  {/* End Terminator */}
                  <div className="relative pl-8 pt-2">
                     <span className="text-[9px] font-mono text-zinc-700 uppercase tracking-widest bg-zinc-900/50 px-2 py-1 rounded-sm">END_SEQUENCE</span>
                  </div>
                </div>
              )}
            </div>
        </div>

      </div>
    </div>
  );
};

export default ResearchAndStrategy;
