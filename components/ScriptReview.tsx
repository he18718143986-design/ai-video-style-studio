
import React, { useState, useEffect } from 'react';
import { Edit3, CheckCircle, RefreshCw, Copy, Check, Sparkles, Send, Terminal, Command, History, RotateCcw } from 'lucide-react';
import { ScriptVersion } from '../types';

interface ScriptReviewProps {
  initialScript: string;
  topic: string;
  onConfirm: (finalScript: string) => void;
  onRegenerate: () => void;
  onRefine: (instruction: string) => Promise<void>;
  isProcessing: boolean;
  scriptVersions: ScriptVersion[];
  onRestoreVersion: (id: string) => void;
}

const ScriptReview: React.FC<ScriptReviewProps> = ({ 
  initialScript, 
  topic, 
  onConfirm, 
  onRegenerate, 
  onRefine, 
  isProcessing,
  scriptVersions = [],
  onRestoreVersion
}) => {
  const [script, setScript] = useState(initialScript);
  const [copied, setCopied] = useState(false);
  const [instruction, setInstruction] = useState('');

  useEffect(() => {
    setScript(initialScript);
  }, [initialScript]);

  const handleCopy = () => {
    navigator.clipboard.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRefineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instruction.trim() || isProcessing) return;
    await onRefine(instruction);
    setInstruction('');
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-2 duration-500 bg-[#050505] text-zinc-200">
      
      {/* UNIFIED HEADER: FINAL DRAFT */}
      <div className="flex-shrink-0 h-14 border-b border-white/5 bg-[#0a0a0a] flex items-center justify-between px-5 z-10 select-none">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-zinc-900 border border-white/10 rounded-sm flex items-center justify-center shadow-inner">
             <Edit3 className="w-4 h-4 text-zinc-400" />
          </div>
          <div>
            <h2 className="text-xs font-black text-zinc-100 tracking-[0.2em] uppercase leading-none mb-0.5 flex items-center gap-2">
              剧本创作
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_5px_#10b981]"></span>
            </h2>
            <p className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider">
               页数: {Math.ceil(script.length / 1500)} // 字符: {script.length}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
           <button 
             onClick={handleCopy}
             className="h-8 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-[10px] font-bold uppercase tracking-widest border border-white/5 rounded-sm flex items-center gap-2 transition-all"
             title="复制到剪贴板"
           >
             {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
             复制
           </button>
           
           <div className="h-4 w-px bg-white/10"></div>

           <button 
             onClick={() => onConfirm(script)}
             disabled={isProcessing}
             className="h-8 px-4 bg-white hover:bg-zinc-200 text-black text-[10px] font-black uppercase tracking-widest rounded-sm flex items-center gap-2 transition-all shadow-lg"
           >
             <span className="hidden md:inline">确认剧本</span>
             <CheckCircle className="w-3.5 h-3.5" />
           </button>
        </div>
      </div>

      {/* MAIN EDITOR AREA */}
      <div className="flex-1 min-h-0 flex bg-[#050505]">
        
        {/* Editor (Left) - Code Editor Style */}
        <div className="flex-1 flex flex-col min-w-0 relative justify-center overflow-y-auto custom-scrollbar p-0">
           {/* Line Numbers Gutter simulation (Optional visual) */}
           <div className="absolute left-0 top-0 bottom-0 w-12 bg-[#09090b] border-r border-white/5 z-0 hidden md:block"></div>
           
           <div className="w-full max-w-4xl mx-auto min-h-full relative z-10 pl-4 md:pl-16 pr-8 py-8">
              <textarea
                value={script}
                onChange={(e) => setScript(e.target.value)}
                className="w-full h-full min-h-[800px] bg-transparent border-none text-zinc-300 text-sm md:text-base leading-relaxed focus:ring-0 resize-none focus:outline-none font-mono selection:bg-accent/30 selection:text-white caret-block"
                placeholder="// 开始输入剧本..."
                disabled={isProcessing}
                spellCheck={false}
              />
           </div>
        </div>

        {/* AI Command Sidebar (Right) */}
        <div className="w-80 border-l border-white/5 bg-[#09090b] flex flex-col z-20 shadow-2xl">
           <div className="p-4 border-b border-white/5 bg-[#09090b]">
              <div className="flex items-center gap-2 text-white mb-2">
                <Command className="w-4 h-4 text-accent" />
                <h3 className="text-[10px] font-black uppercase tracking-widest">修改指令</h3>
              </div>
              <p className="text-[10px] text-zinc-500 leading-relaxed font-mono">
                 使用自然语言命令 AI 重写部分段落，调整清晰度、语气或节奏。
              </p>
           </div>

           <div className="p-4 flex-1 flex flex-col overflow-hidden">
              <form onSubmit={handleRefineSubmit} className="flex flex-col gap-3 shrink-0">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-b from-accent/5 to-transparent pointer-events-none rounded-sm"></div>
                  <textarea 
                    value={instruction}
                    onChange={(e) => setInstruction(e.target.value)}
                    placeholder="> 例如：让开场白更具戏剧性..."
                    className="relative w-full bg-[#050505] border border-zinc-800 focus:border-accent rounded-sm p-3 text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none min-h-[120px] resize-none font-mono block transition-colors"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleRefineSubmit(e);
                      }
                    }}
                  />
                </div>
                
                <button 
                  type="submit"
                  disabled={!instruction.trim() || isProcessing}
                  className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-[10px] font-black uppercase tracking-widest rounded-sm flex items-center justify-center gap-2 transition-all border border-white/5 hover:border-white/10"
                >
                  {isProcessing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                  执行修改
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-white/5 flex flex-col flex-1 min-h-0">
                <div className="flex items-center justify-between mb-3 shrink-0">
                    <p className="text-[9px] text-zinc-500 uppercase tracking-wider font-bold flex items-center gap-2">
                        <History className="w-3 h-3" />
                        版本记录
                    </p>
                    <button 
                        onClick={onRegenerate} 
                        disabled={isProcessing}
                        className="text-[9px] text-red-400 hover:text-red-300 flex items-center gap-1 uppercase tracking-wider disabled:opacity-50"
                    >
                        <RefreshCw className="w-3 h-3" />
                        硬重置
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 pr-1">
                    {scriptVersions.length === 0 ? (
                        <div className="text-[10px] text-zinc-600 font-mono italic p-2 text-center">
                            尚无版本记录
                        </div>
                    ) : (
                        [...scriptVersions].reverse().map((version) => (
                            <button
                              key={version.id}
                              onClick={() => onRestoreVersion(version.id)}
                              disabled={isProcessing}
                              className="w-full flex items-center justify-between group/ver p-3 rounded-sm bg-black/20 hover:bg-white/5 border border-white/5 hover:border-white/10 transition-all text-left"
                            >
                              <div className="flex flex-col gap-0.5 min-w-0">
                                  <span className="text-[10px] font-bold text-zinc-400 group-hover/ver:text-white transition-colors truncate">
                                      {version.label}
                                  </span>
                                  <span className="text-[8px] text-zinc-600 font-mono">
                                      {version.timestamp}
                                  </span>
                              </div>
                              <RotateCcw className="w-3.5 h-3.5 text-zinc-600 group-hover/ver:text-accent opacity-0 group-hover/ver:opacity-100 transition-all shrink-0" />
                            </button>
                        ))
                    )}
                </div>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default ScriptReview;
