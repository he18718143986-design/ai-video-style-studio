
import React, { useState, useEffect } from 'react';
import { Scene, StyleProfile } from '../types';
import { Loader2, PlayCircle, Download, Film, Zap, Eye, Clapperboard, MonitorPlay, RefreshCw, X, Music, Layers, Terminal } from 'lucide-react';
import DraftPlayer from './DraftPlayer';
import { useVideoCompiler } from '../hooks/useVideoCompiler';

interface StoryboardEditorProps {
  scenes: Scene[];
  styleProfile?: StyleProfile; 
  onGenerateAsset: (sceneId: string, type: 'image' | 'video') => void;
  onGenerateAll: () => void;
  onRefineVisuals: (instruction: string) => Promise<void>;
  onUpdateScenePrompt: (sceneId: string, newPrompt: string) => void;
  onRegenerateReference: () => void;
  generatingIds: Set<string>;
  topic: string;
  referenceSheetUrl: string | null;
  isProcessing: boolean;
  aspectRatio?: string;
}

const StoryboardEditor: React.FC<StoryboardEditorProps> = ({ 
  scenes, 
  styleProfile,
  onGenerateAsset, 
  onGenerateAll,
  onRefineVisuals,
  onUpdateScenePrompt,
  onRegenerateReference,
  generatingIds, 
  topic, 
  referenceSheetUrl,
  isProcessing,
  aspectRatio = "16:9"
}) => {
  // Use the extracted hook for logic
  const { isCompiling, compileProgress, finalVideoUrl, compileVideo, clearVideo } = useVideoCompiler();

  const [visualInstruction, setVisualInstruction] = useState('');
  const [editingSceneId, setEditingSceneId] = useState<string | null>(null);
  const [tempPrompt, setTempPrompt] = useState('');
  const [showDraftPlayer, setShowDraftPlayer] = useState(false);
  
  // Audio Mood State
  const [selectedMood, setSelectedMood] = useState<string>('Neutral');

  useEffect(() => {
    if (styleProfile?.tone) {
        setSelectedMood(styleProfile.tone);
    }
  }, [styleProfile]);

  const hasAssets = scenes.some(s => s.assetUrl);
  const allAssetsReady = scenes.every(s => s.status === 'done' || s.assetUrl);

  const handleRefineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visualInstruction.trim() || isProcessing) return;
    await onRefineVisuals(visualInstruction);
    setVisualInstruction('');
  };

  const startEditing = (scene: Scene) => {
    setEditingSceneId(scene.id);
    setTempPrompt(scene.visualPrompt);
  };

  const saveEditing = (sceneId: string) => {
    onUpdateScenePrompt(sceneId, tempPrompt);
    setEditingSceneId(null);
  };

  const musicOptions = [
    { label: '自动', value: styleProfile?.tone || 'Neutral' },
    { label: '电影', value: 'Cinematic' },
    { label: '科技', value: 'Tech' },
    { label: '低保真', value: 'LoFi' },
    { label: '商业', value: 'Corporate' },
    { label: '悬疑', value: 'Dark' },
  ];

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-2 duration-500 bg-[#050505]">
      
      {/* HEADER: MASTER SEQUENCE */}
      <div className="flex-shrink-0 h-14 border-b border-white/5 bg-[#0a0a0a] flex items-center justify-between px-5 z-20 shadow-xl relative overflow-hidden select-none">
         
         <div className="flex items-center gap-3 w-full md:w-auto relative z-10">
            <div className="w-8 h-8 bg-zinc-900 border border-white/10 rounded-sm flex items-center justify-center shadow-inner">
              <Clapperboard className="w-4 h-4 text-zinc-400" />
            </div>
            <div>
               <h2 className="text-xs font-black text-zinc-100 tracking-[0.2em] uppercase leading-none mb-0.5 flex items-center gap-2">
                 分镜制作
                 <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_5px_#10b981]"></div>
               </h2>
               <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">
                  {scenes.length} 轨道 // {aspectRatio}
               </span>
            </div>
         </div>

         {/* Center: Music Selector */}
         <div className="hidden md:flex items-center gap-3 bg-zinc-900/50 border border-white/5 px-3 py-1 rounded-sm">
             <Music className="w-3 h-3 text-zinc-500" />
             <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">配乐风格:</span>
             <select 
               value={musicOptions.some(o => o.value === selectedMood) ? selectedMood : styleProfile?.tone}
               onChange={(e) => setSelectedMood(e.target.value)}
               className="bg-transparent text-[9px] font-mono text-zinc-300 font-bold uppercase focus:outline-none cursor-pointer hover:text-white"
             >
               {musicOptions.map(opt => (
                 <option key={opt.value} value={opt.value} className="bg-zinc-900 text-zinc-300">
                    {opt.label}
                 </option>
               ))}
             </select>
         </div>

         {/* AI Refine Input */}
         {!allAssetsReady && (
            <div className="flex-1 w-full max-w-lg mx-6 relative z-10 hidden lg:block">
               <form onSubmit={handleRefineSubmit} className="relative flex items-center group">
                  <div className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-accent transition-colors">
                    <Terminal className="w-3 h-3" />
                  </div>
                  <input 
                    type="text" 
                    value={visualInstruction}
                    onChange={(e) => setVisualInstruction(e.target.value)}
                    placeholder="导演指令: > '让场景2更具戏剧性...'"
                    className="w-full bg-[#050505] border border-zinc-800 h-8 pl-8 pr-16 text-[10px] text-white placeholder-zinc-700 font-mono focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all rounded-sm"
                    disabled={isProcessing}
                  />
                  <button 
                    type="submit"
                    disabled={!visualInstruction.trim() || isProcessing}
                    className="absolute right-1 top-1 bottom-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white px-2 text-[9px] font-bold uppercase tracking-wider transition-colors border border-zinc-700 rounded-sm"
                  >
                    执行
                  </button>
               </form>
            </div>
         )}

         {/* Main Buttons */}
         <div className="flex items-center gap-2 flex-shrink-0 relative z-10">
            <button 
              onClick={() => setShowDraftPlayer(true)}
              className="h-8 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-[9px] font-bold uppercase tracking-widest border border-white/5 rounded-sm flex items-center gap-2 transition-all"
            >
              <Eye className="w-3.5 h-3.5" />
              监视器
            </button>

            {!hasAssets ? (
              <button 
                onClick={onGenerateAll}
                disabled={isProcessing}
                className="h-8 px-4 bg-white hover:bg-zinc-200 text-black text-[10px] font-black uppercase tracking-widest rounded-sm flex items-center gap-2 transition-all shadow-lg"
              >
                {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PlayCircle className="w-3.5 h-3.5" />}
                渲染全部
              </button>
            ) : (
              <button 
                onClick={() => compileVideo(scenes, aspectRatio, selectedMood)}
                disabled={isCompiling}
                className="h-8 px-4 bg-white hover:bg-zinc-200 text-black text-[10px] font-black uppercase tracking-widest rounded-sm flex items-center gap-2 transition-all shadow-lg"
              >
                {isCompiling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Film className="w-3.5 h-3.5" />}
                导出成品
              </button>
            )}
         </div>
      </div>

      {/* VISUAL ANCHOR DECK */}
      <div className="bg-[#09090b] border-b border-white/5 p-4 shrink-0">
        <div className="flex items-start gap-6 max-w-5xl mx-auto">
           {/* Thumbnail Container */}
           <div className={`relative group shrink-0 border border-white/10 rounded-sm overflow-hidden bg-black shadow-lg ${aspectRatio === "9:16" ? "w-24 aspect-[9/16]" : "w-48 aspect-video"}`}>
              {referenceSheetUrl ? (
                 <>
                   <img src={referenceSheetUrl} className="w-full h-full object-cover" />
                   <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                      <button onClick={onRegenerateReference} disabled={isProcessing} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md border border-white/20">
                         <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
                      </button>
                   </div>
                 </>
              ) : (
                 <div className="w-full h-full flex items-center justify-center bg-dot-grid">
                    <Loader2 className="w-5 h-5 animate-spin text-zinc-700" />
                 </div>
              )}
           </div>

           {/* Info */}
           <div className="flex-1 pt-1">
              <div className="flex items-center justify-between mb-2">
                 <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <Layers className="w-4 h-4 text-accent" />
                    视觉风格
                 </h3>
                 <button 
                   onClick={onRegenerateReference}
                   disabled={isProcessing}
                   className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 hover:text-white flex items-center gap-1 transition-colors"
                 >
                   <RefreshCw className={`w-3 h-3 ${isProcessing ? 'animate-spin' : ''}`} />
                   重新生成
                 </button>
              </div>
              <p className="text-xs text-zinc-400 font-mono leading-relaxed max-w-2xl">
                 此参考图锁定后续所有场景的角色设计、光照和风格。如果风格不符合您的预期，请重新生成。
              </p>
              
              <div className="flex gap-2 mt-3">
                 <span className="text-[9px] bg-zinc-900 border border-zinc-700 text-zinc-300 px-2 py-1 rounded-sm uppercase tracking-wide font-bold">
                    风格锁定
                 </span>
                 <span className="text-[9px] bg-zinc-900 border border-zinc-700 text-zinc-300 px-2 py-1 rounded-sm uppercase tracking-wide font-bold">
                    {aspectRatio}
                 </span>
              </div>
           </div>
        </div>
      </div>

      <div className="flex flex-1 gap-px min-h-0 bg-black">
        {/* TIMELINE TRACKS */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#050505] relative bg-scanlines bg-scanline-size">
          
          {/* Compilation Status Overlay */}
          {isCompiling && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center">
                <div className="bg-[#09090b] border border-accent/30 p-8 flex flex-col items-center justify-center shadow-2xl max-w-md w-full relative overflow-hidden">
                   <div className="absolute inset-0 bg-dot-grid opacity-20"></div>
                   <h3 className="text-lg font-black text-white uppercase tracking-widest mb-2 relative z-10">正在渲染终剪版本</h3>
                   <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden relative z-10 mt-4">
                     <div className="h-full bg-accent animate-progress-indeterminate shadow-[0_0_10px_#8b5cf6]"></div>
                   </div>
                   <p className="mt-4 text-xs font-mono text-zinc-400 text-center animate-pulse">
                     {compileProgress}
                   </p>
                </div>
            </div>
          )}

          {/* Final Video Result Modal */}
          {finalVideoUrl && !isCompiling && (
            <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-8 animate-in fade-in duration-300">
               <div className={`bg-[#0a0a0a] border border-white/10 shadow-2xl flex flex-col ${aspectRatio === "9:16" ? "h-[90vh] aspect-[9/16]" : "max-w-4xl w-full"}`}>
                  <div className="flex items-center justify-between p-3 border-b border-white/10 bg-zinc-900 shrink-0">
                     <div className="flex items-center gap-2">
                        <MonitorPlay className="w-4 h-4 text-emerald-500" />
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider">渲染完成</h3>
                     </div>
                     <button onClick={clearVideo} className="text-zinc-500 hover:text-white"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="flex-1 bg-black relative overflow-hidden flex items-center justify-center">
                     <video src={finalVideoUrl} controls className="max-w-full max-h-full object-contain" autoPlay />
                  </div>
                  <div className="p-3 flex justify-end bg-[#09090b] border-t border-white/10 shrink-0">
                    <a 
                      href={finalVideoUrl} 
                      download={`${topic.replace(/\s+/g, '_')}_Master.mp4`}
                      className="flex items-center gap-2 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-widest transition-colors shadow-lg"
                    >
                      <Download className="w-3 h-3" />
                      下载 MP4
                    </a>
                  </div>
               </div>
            </div>
          )}

          <div className="p-4 pb-32 space-y-1">
            {scenes.map((scene, index) => (
              <div key={scene.id} className="group relative flex bg-[#09090b] border border-zinc-800 hover:border-zinc-600 transition-colors h-24 overflow-hidden">
                {/* Track Header */}
                <div className="w-8 bg-[#09090b] border-r border-zinc-800 flex flex-col items-center justify-center relative select-none">
                   <span className="text-[10px] font-black text-zinc-700 group-hover:text-accent transition-colors mb-1">
                     {String(index + 1).padStart(2, '0')}
                   </span>
                   {/* Status LED */}
                   <div className={`w-1.5 h-1.5 rounded-full ${
                      scene.status === 'done' ? 'bg-emerald-500 shadow-[0_0_6px_#10b981]' :
                      scene.status === 'generating' ? 'bg-amber-500 animate-pulse-fast' :
                      scene.status === 'error' ? 'bg-red-500 shadow-[0_0_6px_#ef4444]' : 'bg-zinc-800'
                   }`}></div>
                </div>

                {/* Content Block */}
                <div className="flex-1 flex gap-4 p-2 min-w-0">
                  {/* Script/Info */}
                  <div className="flex-1 flex flex-col gap-1 min-w-0 justify-between py-1">
                     <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono text-zinc-500 bg-zinc-900 px-1 py-0.5 border border-zinc-800 rounded-sm">
                           {scene.estimatedDuration}s
                        </span>
                        {/* Audio Status Indicator */}
                        {scene.audioUrl && (
                           <span className="text-[8px] font-mono text-emerald-500 border border-emerald-900 bg-emerald-950 px-1 rounded-sm">
                              AUDIO_OK
                           </span>
                        )}
                        <div className="h-px flex-1 bg-zinc-800/50"></div>
                     </div>
                     <p 
                        className="text-[10px] text-zinc-300 font-medium leading-relaxed font-sans line-clamp-4 opacity-80 group-hover:opacity-100 cursor-help transition-all"
                        title={scene.narrative}
                     >
                        "{scene.narrative}"
                     </p>
                     
                     {/* Prompt Editor */}
                     <div className="group/prompt relative">
                        {editingSceneId === scene.id ? (
                           <div className="relative">
                              <input 
                                value={tempPrompt}
                                onChange={(e) => setTempPrompt(e.target.value)}
                                className="w-full bg-black border border-accent text-[9px] font-mono text-zinc-300 px-1 py-0.5 focus:outline-none"
                                autoFocus
                                onBlur={() => saveEditing(scene.id)}
                                onKeyDown={(e) => e.key === 'Enter' && saveEditing(scene.id)}
                              />
                           </div>
                        ) : (
                           <p 
                             className="text-[9px] font-mono text-zinc-600 leading-tight line-clamp-1 hover:text-accent cursor-text truncate transition-colors" 
                             onClick={() => !scene.assetUrl && startEditing(scene)}
                             title={scene.visualPrompt}
                           >
                             提示词: {scene.visualPrompt}
                           </p>
                        )}
                     </div>
                  </div>

                  {/* Asset Monitor (Film Strip) */}
                  <div className={`
                    bg-black border-y-2 border-black border-dashed relative flex-shrink-0 group/monitor overflow-hidden bg-film-strip bg-[size:100%_8px] p-1 flex items-center justify-center
                    ${aspectRatio === "9:16" ? "w-20" : "w-36"}
                  `}>
                     <div className={`relative w-full h-full bg-[#111] overflow-hidden border border-zinc-800 ${aspectRatio === "9:16" ? "aspect-[9/16]" : "aspect-[16/9]"}`}>
                         {scene.assetUrl ? (
                            <>
                               {scene.assetType === 'video' ? (
                                  <video src={scene.assetUrl} className="w-full h-full object-cover" autoPlay muted loop />
                               ) : (
                                  <img src={scene.assetUrl} className="w-full h-full object-cover" />
                               )}
                               
                               {/* Controls Overlay */}
                               <div className="absolute inset-0 bg-black/70 flex items-center justify-center gap-1 opacity-0 group-hover/monitor:opacity-100 transition-opacity z-30 backdrop-blur-sm">
                                  <button 
                                    onClick={() => onGenerateAsset(scene.id, 'image')} 
                                    className="p-1 hover:text-white text-zinc-400"
                                    title="重绘图像"
                                  >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                  </button>
                                  {scene.assetType !== 'video' && (
                                    <button 
                                      onClick={() => onGenerateAsset(scene.id, 'video')} 
                                      className="p-1 hover:text-accent text-zinc-400"
                                      title="生成动画"
                                    >
                                      <Zap className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                               </div>
                            </>
                         ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center relative">
                               {scene.status === 'generating' || generatingIds.has(scene.id) ? (
                                  <>
                                    <div className="absolute inset-0 bg-accent/10 animate-pulse"></div>
                                    <Loader2 className="w-4 h-4 text-accent animate-spin relative z-10" />
                                  </>
                               ) : (
                                  <span className="text-[8px] font-mono text-zinc-700">NO_DATA</span>
                               )}
                            </div>
                         )}
                     </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <DraftPlayer 
        scenes={scenes}
        isOpen={showDraftPlayer}
        onClose={() => setShowDraftPlayer(false)}
      />
    </div>
  );
};

export default StoryboardEditor;
