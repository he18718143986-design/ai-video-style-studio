
import React, { useState, useEffect } from 'react';
import { AppState, PipelineStage } from '../types';
import StyleDNA from './StyleDNA';
import ResearchAndStrategy from './ResearchAndStrategy';
import ScriptReview from './ScriptReview';
import StoryboardEditor from './StoryboardEditor';
import SavedStyleLibrary from './SavedStyleLibrary';
import PreviewStage from './stages/PreviewStage';
import { ProcessingState, EmptyState } from './ui/States';
import { FileVideo, Palette, Globe, Edit3, Clapperboard } from 'lucide-react';
import { SAMPLE_TEMPLATES } from '../data/sampleTemplates';

interface WorkspaceProps {
  currentStage: PipelineStage;
  isProcessing: boolean;
  state: AppState;
  onLoadProfile: (profile: any) => void;
  onStrategyProceed: () => void;
  onScriptConfirm: (script: string) => void;
  onScriptRegenerate: () => void;
  onScriptRefine: (instruction: string) => Promise<void>;
  onGenerateAsset: (id: string, type: 'image' | 'video') => void;
  onGenerateAllAssets: () => void;
  onRefineVisuals: (instruction: string) => Promise<void>;
  onUpdateScenePrompt: (id: string, prompt: string) => void;
  onRegenerateReference: () => void;
  generatingAssets: Set<string>;
  onJumpToStage: (stage: PipelineStage) => void;
  onResetProfile: () => void;
  onConfirmStyle: () => void;
  // NEW: Version restore action
  onRestoreScriptVersion?: (id: string) => void;
}

type TabId = 'preview' | 'style' | 'research' | 'script' | 'visuals';

const Workspace: React.FC<WorkspaceProps> = (props) => {
  const [activeTab, setActiveTab] = useState<TabId>('preview');

  // Auto-switch tabs based on pipeline progress
  useEffect(() => {
    switch (props.currentStage) {
      case 'STRATEGY':
        if (props.state.styleProfile) setActiveTab('style');
        break;
      case 'RESEARCH':
        setActiveTab('research');
        break;
      case 'SCRIPTING':
        setActiveTab('script');
        break;
      case 'STORYBOARD':
      case 'PRODUCTION':
        setActiveTab('visuals');
        break;
      default:
        break;
    }
  }, [props.currentStage, props.state.styleProfile]);

  const tabs = [
    { id: 'preview' as TabId, label: '素材预览', icon: FileVideo },
    { id: 'style' as TabId, label: '风格分析', icon: Palette },
    { id: 'research' as TabId, label: '内容策划', icon: Globe },
    { id: 'script' as TabId, label: '剧本创作', icon: Edit3 },
    { id: 'visuals' as TabId, label: '分镜制作', icon: Clapperboard },
  ];

  const handleTabClick = (tabId: TabId) => {
    setActiveTab(tabId);
    if (tabId === 'style' && props.state.styleProfile) props.onJumpToStage('STRATEGY');
    else if (tabId === 'research' && props.currentStage !== 'RESEARCH') props.onJumpToStage('RESEARCH');
    else if (tabId === 'script' && props.currentStage !== 'SCRIPTING' && props.state.researchData) props.onJumpToStage('SCRIPTING');
    else if (tabId === 'visuals' && props.state.draftScript && props.currentStage !== 'PRODUCTION') props.onJumpToStage('STORYBOARD');
  };

  const handleTemplateLoad = (template: any) => {
      const fullTmpl = SAMPLE_TEMPLATES.find(t => t.id === template.id) || template;
      props.onLoadProfile(fullTmpl.profile);
      setActiveTab('style');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'preview':
        return (
          <PreviewStage 
            state={props.state} 
            onResetProfile={props.onResetProfile}
            onLoadProfile={handleTemplateLoad}
          />
        );
      
      case 'style':
        if (!props.state.styleProfile) {
           if (props.isProcessing) return <ProcessingState stage="正在解码视频" />;
           return (
              <div className="flex flex-col h-full bg-[#050505]">
                 <div className="flex-shrink-0 h-14 flex items-center justify-between px-5 select-none" />
                 <div className="flex-1 bg-dot-grid bg-[size:20px_20px] p-8 overflow-y-auto custom-scrollbar">
                    <SavedStyleLibrary onSelect={(p) => { props.onLoadProfile(p); setActiveTab('style'); }} />
                 </div>
              </div>
           );
        }
        return <StyleDNA 
          profile={props.state.styleProfile!} 
          referenceTitle={props.state.referenceTitle} 
          referenceThumbnailUrl={props.state.referenceThumbnailUrl} 
          onProceed={props.onConfirmStyle} 
        />;

      case 'research':
        if (props.isProcessing && !props.state.researchData) return <ProcessingState stage="正在收集情报" />;
        if (props.state.researchData) {
          return <ResearchAndStrategy researchData={props.state.researchData} narrativeMap={props.state.narrativeMap} topic={props.state.targetTopic} onProceed={props.onStrategyProceed} />;
        }
        return <EmptyState />;

      case 'script':
        if (props.isProcessing && !props.state.draftScript) return <ProcessingState stage="正在撰写剧本" />;
        if (props.state.draftScript) {
          return <ScriptReview 
            initialScript={props.state.draftScript!} 
            topic={props.state.targetTopic} 
            onConfirm={props.onScriptConfirm} 
            onRegenerate={props.onScriptRegenerate} 
            onRefine={props.onScriptRefine} 
            isProcessing={props.isProcessing} 
            scriptVersions={props.state.scriptVersions}
            onRestoreVersion={props.onRestoreScriptVersion!}
          />;
        }
        return <EmptyState />;

      case 'visuals':
        if (props.isProcessing && props.state.scenes.length === 0) return <ProcessingState stage="正在生成分镜" />;
        if (props.state.scenes.length > 0) {
          return <StoryboardEditor 
            scenes={props.state.scenes} 
            styleProfile={props.state.styleProfile || undefined} 
            onGenerateAsset={props.onGenerateAsset} 
            onGenerateAll={props.onGenerateAllAssets} 
            onRefineVisuals={props.onRefineVisuals} 
            onUpdateScenePrompt={props.onUpdateScenePrompt} 
            onRegenerateReference={props.onRegenerateReference}
            generatingIds={props.generatingAssets} 
            topic={props.state.targetTopic} 
            referenceSheetUrl={props.state.referenceSheetUrl} 
            isProcessing={props.isProcessing || (props.currentStage === 'PRODUCTION' && props.generatingAssets.size > 0)}
            aspectRatio={props.state.targetAspectRatio} 
          />;
        }
        return <EmptyState />;
        
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#050505] font-sans relative">
      {/* SEGMENTED CONTROL TAB BAR */}
      <div className="flex items-center h-14 bg-[#050505] flex-shrink-0 z-30 select-none px-5 border-b border-white/5 shadow-sm">
         <div className="flex-1 flex items-center bg-[#0a0a0a] rounded-sm p-1 border border-white/5">
           {tabs.map((tab) => {
             const isActive = activeTab === tab.id;
             const Icon = tab.icon;
             
             let hasData = false;
             if (tab.id === 'style' && !!props.state.styleProfile) hasData = true;
             if (tab.id === 'research' && !!props.state.researchData) hasData = true;
             if (tab.id === 'script' && !!props.state.draftScript) hasData = true;
             if (tab.id === 'visuals' && props.state.scenes.length > 0) hasData = true;

             return (
               <button 
                 key={tab.id}
                 onClick={() => handleTabClick(tab.id)}
                 className={`
                   relative flex-1 h-8 rounded-sm group outline-none px-2
                   flex items-center justify-center gap-2
                   transition-all duration-200
                   ${isActive 
                      ? 'bg-zinc-800 text-white shadow-md' 
                      : 'bg-transparent text-zinc-500 hover:text-zinc-300'
                   }
                 `}
               >
                 <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-accent' : hasData ? 'text-emerald-500' : 'currentColor'} transition-colors`} />
                 <span className={`text-[10px] font-bold uppercase tracking-wider hidden lg:inline-block ${isActive ? 'text-white' : 'text-zinc-600'}`}>
                    {tab.label}
                 </span>
                 
                 {hasData && !isActive && (
                    <div className="absolute top-2 right-2 w-1 h-1 bg-emerald-500 rounded-full"></div>
                 )}
               </button>
             );
           })}
         </div>
      </div>
      
      <div className="flex-1 overflow-hidden relative bg-[#050505]">
         {renderContent()}
      </div>
    </div>
  );
};

export default Workspace;
