
import React from 'react';
import Header from './components/Header';
import InputPanel from './components/InputPanel';
import SafetyModal from './components/SafetyModal';
import DebugConsole from './components/DebugConsole';
import Workspace from './components/Workspace';
import { AlertTriangle } from 'lucide-react';
import { useStudioEngine } from './hooks/useStudioEngine';

const App: React.FC = () => {
  const { 
    state, 
    currentPipelineStage, 
    generatingAssets, 
    showSafetyModal, 
    actions 
  } = useStudioEngine();

  return (
    <div className="h-screen bg-studio-base text-studio-text-primary font-sans flex flex-col md:flex-row overflow-hidden animate-in fade-in zoom-in-95 duration-500">
      
      {/* LEFT DASHBOARD PANEL (Compact 320px) */}
      <aside className="bg-studio-panel border-r border-studio-border flex flex-col flex-shrink-0 z-30 shadow-2xl w-full md:w-[320px] relative h-full">
        
        {/* HEADER */}
        <Header 
          apiKeySet={state.apiKeySet} 
          onConnect={actions.handleConnect} 
          onLoadMock={actions.handleLoadMock} 
        />

        {/* ERROR BANNER */}
        {state.error && (
            <div className="bg-status-error/10 border-b border-status-error/20 text-status-error px-4 py-2 text-[10px] font-mono flex items-center gap-2 shrink-0">
              <AlertTriangle className="w-3 h-3 shrink-0" />
              <span className="truncate">{state.error}</span>
            </div>
        )}

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-6">
            {/* 1. Inputs (Compact) */}
            <InputPanel 
              onAnalyze={actions.handleAnalyze} 
              onDraftOnly={actions.handleDraftOnly} 
              onImportProfile={actions.handleImportProfile} 
              onLoadProfile={actions.handleLoadProfile} 
              onResetProfile={actions.handleResetProfile} 
              isProcessing={state.isProcessing} 
              activeProfile={state.styleProfile} 
              referenceTitle={state.referenceTitle} 
              referenceThumbnailUrl={state.referenceThumbnailUrl} 
              aspectRatio={state.targetAspectRatio}
            />

            {/* 2. Pipeline Status Console (Flexible Height) */}
            <div className="flex-1 min-h-[200px] flex flex-col">
              <DebugConsole logs={state.logs} />
            </div>
        </div>
      </aside>

      {/* RIGHT WORKSPACE PANEL */}
      <main className="flex-1 bg-studio-base overflow-hidden flex flex-col relative min-w-0 h-full">
        <Workspace 
            currentStage={currentPipelineStage}
            isProcessing={state.isProcessing}
            state={state}
            onLoadProfile={actions.handleLoadProfile}
            onStrategyProceed={actions.handleStrategyApproved}
            onScriptConfirm={actions.handleScriptApproved}
            onScriptRegenerate={actions.handleScriptRegenerate}
            onScriptRefine={actions.handleRefineScript}
            onRestoreScriptVersion={actions.handleRestoreScriptVersion}
            onGenerateAsset={actions.handleGenerateAsset}
            onGenerateAllAssets={actions.handleGenerateAllAssets}
            onRefineVisuals={actions.handleRefineVisuals}
            onUpdateScenePrompt={actions.handleUpdateScenePrompt}
            onRegenerateReference={actions.handleRegenerateReference}
            generatingAssets={generatingAssets}
            onJumpToStage={actions.handleJumpToStage}
            onResetProfile={actions.handleResetProfile}
            onConfirmStyle={actions.handleConfirmStyle}
        />
      </main>
      
      <SafetyModal 
        isOpen={showSafetyModal} 
        onProceed={actions.handleSafetyProceed} 
        onCancel={actions.handleSafetyCancel} 
      />
    </div>
  );
};

export default App;
