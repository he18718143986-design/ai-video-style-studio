
import React, { useRef, useState, useEffect } from 'react';
import { UploadCloud, CheckCircle2, FileVideo, Terminal, ChevronRight, X, Settings2, Ratio, Zap } from 'lucide-react';
import { StyleProfile, VideoTemplate, PipelineStage } from '../types';
import TemplateSelector from './TemplateSelector';
import { Button, Badge, StatusLed } from './ui/Atoms';

interface InputPanelProps {
  onAnalyze: (file: File, topic: string) => void;
  onDraftOnly: (topic: string) => void;
  onImportProfile: (file: File) => void;
  onLoadProfile: (profile: StyleProfile) => void; 
  isProcessing: boolean;
  activeProfile: StyleProfile | null;
  onResetProfile: () => void;
  referenceTitle?: string;
  referenceThumbnailUrl?: string;
  aspectRatio?: string;
}

const InputPanel: React.FC<InputPanelProps> = ({ 
  onAnalyze, 
  onDraftOnly, 
  onLoadProfile,
  isProcessing, 
  activeProfile,
  onResetProfile,
  referenceTitle,
  aspectRatio = "16:9"
}) => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [topic, setTopic] = useState('');
  const [inputMode, setInputMode] = useState<'upload' | 'template'>('upload');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!activeProfile) setVideoFile(null);
  }, [activeProfile]);

  const handleFile = (f: File) => {
    if (f.type.startsWith('video/')) {
      setVideoFile(f);
    } else {
      alert("请上传本地视频文件 (MP4/MOV)。");
    }
  };

  const handleTemplateSelect = (template: VideoTemplate) => {
    const profile: StyleProfile = {
       visualStyle: template.defaultStyleDNA.visualStyle,
       pacing: template.defaultStyleDNA.pacing,
       tone: template.defaultStyleDNA.tone,
       colorPalette: [],
       targetAudience: "General",
       keyElements: [],
       pedagogicalApproach: "Standard",
       narrativeStructure: template.narrativeStructure,
       scriptStyle: "Professional",
       fullTranscript: "",
       wordCount: 0,
       wordsPerMinute: 130,
       targetAspectRatio: "16:9",
       _meta: { sourceTitle: template.name, sourceThumbnail: '' }
    };
    onLoadProfile(profile);
  };

  const handleSubmit = () => {
    if (activeProfile) onDraftOnly(topic);
    else if (videoFile) onAnalyze(videoFile, topic);
  };

  return (
    <div className="flex flex-col gap-5">
      
      {/* SECTION: SOURCE */}
      <div className="space-y-2">
         <div className="flex justify-between items-center px-1">
            <h3 className="text-2xs font-bold text-studio-text-muted uppercase tracking-widest">参考素材</h3>
         </div>

         {activeProfile ? (
            // COMPACT ACTIVE STATE
            <div className="bg-studio-elevated/50 border border-studio-border rounded-sm p-2 flex gap-3 items-center group hover:border-studio-text-muted/50 transition-colors">
               <div className="w-8 h-8 bg-status-success/10 flex items-center justify-center rounded-sm shrink-0 border border-status-success/20">
                  <CheckCircle2 className="w-4 h-4 text-status-success" />
               </div>
               <div className="min-w-0 flex-1">
                  <h4 className="text-white font-bold text-xs truncate leading-tight">
                    {referenceTitle || activeProfile._meta?.sourceTitle}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5">
                     <span className="text-[9px] font-mono text-status-success uppercase tracking-wider">已激活</span>
                     <span className="text-[9px] text-studio-text-muted font-mono border-l border-white/10 pl-2">{aspectRatio}</span>
                  </div>
               </div>
            </div>
         ) : inputMode === 'upload' ? (
             // COMPACT UPLOAD STATE
             <div 
               onClick={() => inputRef.current?.click()}
               className={`
                 relative h-20 border border-dashed rounded-sm transition-all duration-200 cursor-pointer flex items-center justify-center gap-3 px-4
                 ${videoFile 
                    ? 'border-status-success/40 bg-status-success/5' 
                    : 'border-studio-border bg-studio-elevated/30 hover:bg-studio-elevated hover:border-studio-text-muted'
                 }
               `}
             >
                <input ref={inputRef} type="file" className="hidden" accept="video/*" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
                
                {videoFile ? (
                   <>
                     <FileVideo className="w-5 h-5 text-status-success shrink-0" />
                     <div className="min-w-0">
                        <p className="text-white font-bold text-xs truncate">{videoFile.name}</p>
                        <p className="text-[9px] text-status-success uppercase tracking-wider">准备分析</p>
                     </div>
                   </>
                ) : (
                   <div className="flex flex-col items-center gap-1">
                     <div className="flex items-center gap-2 text-studio-text-muted group-hover:text-white transition-colors">
                        <UploadCloud className="w-4 h-4" />
                        <span className="text-xs font-medium">点击上传参考视频</span>
                     </div>
                     <button 
                       onClick={(e) => { e.stopPropagation(); setInputMode('template'); }} 
                       className="text-[9px] text-accent hover:text-white flex items-center gap-1 uppercase tracking-wider font-bold mt-0.5"
                     >
                       <Zap className="w-3 h-3" />
                       或选择预设模板
                     </button>
                   </div>
                )}
             </div>
         ) : (
             // COMPACT TEMPLATE SELECTOR
             <div className="border border-studio-border rounded-sm bg-studio-base">
                <div className="flex justify-between items-center p-2 border-b border-studio-border">
                   <span className="text-[9px] font-bold text-studio-text-muted uppercase tracking-wider">预设库</span>
                   <button onClick={() => setInputMode('upload')} className="text-studio-text-muted hover:text-white"><X className="w-3 h-3" /></button>
                </div>
                <div className="max-h-[140px] overflow-y-auto custom-scrollbar p-1">
                   <TemplateSelector onSelect={handleTemplateSelect} />
                </div>
             </div>
         )}
      </div>

      {/* SECTION: TOPIC */}
      <div className="space-y-2">
         <h3 className="text-2xs font-bold text-studio-text-muted uppercase tracking-widest px-1">目标主题</h3>
         <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-studio-text-muted group-focus-within:text-accent transition-colors">
               <Terminal className="w-3.5 h-3.5" />
            </div>
            <input 
              type="text" 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="例如: 量子物理入门..."
              className="w-full bg-studio-elevated/30 border border-studio-border rounded-sm py-2 pl-9 pr-3 text-xs text-white placeholder-studio-text-muted/50 focus:outline-none focus:border-accent focus:bg-studio-elevated transition-all h-9"
            />
         </div>
      </div>

      {/* SECTION: ACTION */}
      <div className="pt-2">
        <Button
          variant="primary"
          disabled={!topic || (!activeProfile && !videoFile) || isProcessing}
          isLoading={isProcessing}
          onClick={handleSubmit}
          className="w-full h-9 text-xs font-black tracking-widest uppercase"
          icon={!isProcessing && <ChevronRight className="w-3.5 h-3.5" />}
        >
          {isProcessing ? '系统处理中...' : '开始生成视频'}
        </Button>
      </div>

    </div>
  );
};

export default InputPanel;
