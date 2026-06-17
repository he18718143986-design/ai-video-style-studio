
import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, PipelineStage, Scene, LogEntry, StyleProfile } from '../types';
import { checkApiKey, promptApiKeySelection, generateVideoThumbnail } from '../services/core';
import { analyzeStyle, performSafetyCheck } from '../services/analysis';
import { performResearch } from '../services/research';
import { generateDraftScript, generateStoryboard, generateNarrativeMap } from '../services/scripting';
import { generateSceneImage, generateSceneVideoWithKeyframe, generateReferenceSheet } from '../services/production';
import { refineScriptWithAI, refineVisualsWithAI } from '../services/refinement';
import { saveProjectCheckpoint, loadProjectCheckpoint, clearProjectCheckpoint } from '../services/storage';
import { SCREENSHOT_MOCK_STATE } from '../data/screenshotMock';

export const useStudioEngine = () => {
  const [state, setState] = useState<AppState>({
    referenceVideoUrl: null,
    referenceTitle: undefined,
    referenceThumbnailUrl: undefined,
    targetTopic: '',
    targetAspectRatio: "16:9",
    styleProfile: null,
    researchData: null,
    narrativeMap: null,
    draftScript: null,
    scriptVersions: [],
    referenceSheetUrl: null,
    scenes: [],
    logs: [],
    isProcessing: false,
    verificationReport: null,
    error: null,
    apiKeySet: false
  });

  const [currentPipelineStage, setCurrentPipelineStage] = useState<PipelineStage>('STRATEGY');
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [generatingAssets, setGeneratingAssets] = useState<Set<string>>(new Set());
  
  // Ref to hold latest state for auto-saving without dependency cycles in async loops
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  // --- AUTO LOAD CHECKPOINT ---
  useEffect(() => {
    checkApiKey().then(hasKey => {
      setState(s => ({ ...s, apiKeySet: hasKey }));
    });

    const initLoad = async () => {
       const savedState = await loadProjectCheckpoint();
       if (savedState) {
          console.log("Found autosave, restoring...", savedState);
          setState(s => ({
              ...savedState,
              // Ensure we don't start in a stuck "processing" state
              isProcessing: false, 
              logs: [...savedState.logs, { 
                  id: 'resume-log', 
                  timestamp: new Date().toLocaleTimeString(), 
                  message: 'Session restored from auto-save.', 
                  type: 'success' 
              }]
          }));
          
          // Restore Stage Logic based on data presence
          if (savedState.scenes.length > 0) setCurrentPipelineStage('PRODUCTION');
          else if (savedState.draftScript) setCurrentPipelineStage('STORYBOARD');
          else if (savedState.researchData) setCurrentPipelineStage('SCRIPTING');
          else if (savedState.styleProfile) setCurrentPipelineStage('RESEARCH');
       }
    };
    initLoad();
  }, []);

  // --- HELPER FUNCTIONS ---

  const addLog = useCallback((message: string, type: LogEntry['type'] = 'info') => {
    const entry: LogEntry = { id: Math.random().toString(36).substring(7), timestamp: new Date().toLocaleTimeString([], { hour12: false }), message, type };
    setState(s => ({ ...s, logs: [...s.logs, entry] }));
  }, []);

  // Helper to update state AND save to IndexedDB
  const updateStateAndSave = (updateFn: (s: AppState) => AppState) => {
      setState(prev => {
          const newState = updateFn(prev);
          saveProjectCheckpoint(newState); // Fire and forget save
          return newState;
      });
  };

  const ensureApiKey = useCallback(async () => {
    if (state.apiKeySet) return true;
    let hasKey = await checkApiKey();
    if (!hasKey) {
      addLog('API Key required. Opening selection...', 'warning');
      try { 
        await promptApiKeySelection(); 
        setState(s => ({ ...s, apiKeySet: true, error: null })); 
        return true; 
      } catch (e) { 
        addLog('Cancelled.', 'error'); 
        return false; 
      }
    }
    return true;
  }, [state.apiKeySet, addLog]);
  
  const handleError = useCallback(async (error: any) => {
    console.error(error);
    const errorMessage = error.message || "Unknown error";

    if (
      errorMessage.includes("API_KEY_MISSING") || 
      errorMessage.includes("401") || 
      errorMessage.includes("403") || 
      errorMessage.includes("PERMISSION_DENIED")
    ) {
         addLog("Access Denied. Model requires a Paid Project or Hackathon Credits.", 'warning');
         setState(s => ({ ...s, isProcessing: false, error: "Permission Denied. Please switch to a paid/credited API Key.", apiKeySet: false }));
         
         try {
           await promptApiKeySelection();
           setTimeout(async () => {
             const hasKey = await checkApiKey();
             setState(s => ({ ...s, apiKeySet: hasKey, error: null }));
           }, 1000);
         } catch (e) {
           addLog("Key selection cancelled.", 'error');
         }
         return;
    }

    addLog(`Error: ${errorMessage}`, 'error');
    setState(s => ({ ...s, isProcessing: false, error: errorMessage }));
  }, [addLog]);

  // --- CORE ACTIONS ---

  const handleConnect = async () => { 
    try { 
      await promptApiKeySelection(); 
      setTimeout(async () => { 
        const hasKey = await checkApiKey(); 
        setState(s => ({ ...s, apiKeySet: hasKey, error: null })); 
      }, 1000); 
    } catch (e) { 
      console.error(e); 
    } 
  };

  const handleLoadMock = () => {
    updateStateAndSave(s => ({
      ...s,
      ...SCREENSHOT_MOCK_STATE,
      apiKeySet: true
    }));
    setCurrentPipelineStage('PRODUCTION'); 
    addLog('MOCK_STATE_LOADED: Ready for Screenshot', 'success');
  };

  const handleAnalyze = async (file: File, topic: string) => {
    if (!(await ensureApiKey())) return;
    setCurrentPipelineStage('STRATEGY');
    
    let detectedRatio: "16:9" | "9:16" = "16:9";
    let detectedDuration = 0;

    // Reset except logs
    setState(s => ({ 
      ...s, isProcessing: true, referenceVideoUrl: URL.createObjectURL(file), referenceTitle: file.name, targetTopic: topic,
      error: null, styleProfile: null, researchData: null, narrativeMap: null, draftScript: null, scriptVersions: [], referenceSheetUrl: null, scenes: [], logs: []
    }));
    // We don't save yet, wait for success.
    
    addLog(`Step 1: Ingesting local video file...`, 'info');
    
    try {
      const meta = await generateVideoThumbnail(file);
      detectedRatio = meta.width >= meta.height ? "16:9" : "9:16";
      detectedDuration = meta.duration;
      
      addLog(`Detected Input: ${meta.width}x${meta.height} (${detectedRatio}) // ${Math.round(detectedDuration)}s`, 'info');
      setState(s => ({ ...s, referenceThumbnailUrl: meta.thumbnail, targetAspectRatio: detectedRatio }));
    } catch (e) {
      addLog('Could not extract video metadata, defaulting to 16:9', 'warning');
    }

    try {
      addLog(`Step 2: High-Quality Style Analysis (Gemini 3 Pro)...`, 'info');
      const [styleProfile, safetyResult] = await Promise.all([
         analyzeStyle(file, (msg) => addLog(msg, 'info')), 
         performSafetyCheck(topic)
      ]);
      
      styleProfile.targetAspectRatio = detectedRatio;
      styleProfile.sourceDuration = detectedDuration;

      addLog('...Success: Identified Style DNA & Timing.', 'success');
      
      updateStateAndSave(s => ({ ...s, styleProfile, verificationReport: { safetyCheck: true, medicalFlag: safetyResult.isMedical, styleConsistencyScore: 0, factCheckPassed: false } }));

      if (safetyResult.isMedical) {
        setState(s => ({ ...s, isProcessing: false }));
        setShowSafetyModal(true);
      } else {
        setState(s => ({ ...s, isProcessing: false }));
      }
    } catch (error: any) { handleError(error); }
  };

  const startStrategyPhase = async (topic: string, styleProfile: StyleProfile) => {
    if (!(await ensureApiKey())) return;
    setCurrentPipelineStage('RESEARCH');
    setState(s => ({ ...s, isProcessing: true }));
    try {
      addLog('Researching facts with Gemini 3 Flash...', 'info');
      const researchData = await performResearch(topic);
      updateStateAndSave(s => ({ ...s, researchData }));
      
      addLog('Building Narrative Map with Gemini 3 Pro...', 'info');
      const narrativeMap = await generateNarrativeMap(topic, styleProfile, researchData);
      
      updateStateAndSave(s => ({ ...s, narrativeMap, isProcessing: false }));
      addLog('Strategy Ready. Please Review.', 'success');
    } catch (error: any) { handleError(error); }
  };

  const handleStrategyApproved = async () => {
    if (!(await ensureApiKey())) return;
    setState(s => ({ ...s, isProcessing: true }));
    addLog('Strategy Approved. Drafting Script (Gemini 3 Pro)...', 'info');
    setCurrentPipelineStage('SCRIPTING');
    try {
      const draftScript = await generateDraftScript(state.targetTopic, state.styleProfile!, state.researchData!, state.narrativeMap!);
      
      // Save V1
      const versionId = Date.now().toString();
      const newVersion = {
          id: versionId,
          label: `v${state.scriptVersions.length + 1} (Initial Draft)`,
          content: draftScript,
          timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })
      };

      updateStateAndSave(s => ({ 
          ...s, 
          draftScript, 
          scriptVersions: [...s.scriptVersions, newVersion],
          isProcessing: false 
      }));
      addLog('Draft Script Ready for Director Review.', 'success');
    } catch (error: any) { handleError(error); }
  };

  const handleScriptApproved = async (finalScript: string) => {
    if (!(await ensureApiKey())) return;
    setState(s => ({ ...s, draftScript: finalScript, isProcessing: true }));
    addLog('Script Approved. Generating Visuals...', 'info');
    setCurrentPipelineStage('STORYBOARD');
    try {
      if (!state.referenceSheetUrl) {
         addLog(`Generating Visual Anchor (${state.targetAspectRatio})...`, 'info');
         const referenceSheetUrl = await generateReferenceSheet(state.targetTopic, state.styleProfile!, state.targetAspectRatio);
         updateStateAndSave(s => ({ ...s, referenceSheetUrl }));
      }
      
      addLog('Synthesizing Storyboard with Gemini 3 Pro...', 'info');
      const scenes = await generateStoryboard(state.targetTopic, state.styleProfile!, finalScript);
      
      updateStateAndSave(s => ({ ...s, scenes, isProcessing: false }));
      addLog('Storyboard Ready. Review Visual Prompts.', 'success');
    } catch (error: any) { handleError(error); }
  };

  const handleBatchGenerateAssets = async (scenes: Scene[], referenceUrl: string | null) => {
    addLog(`Starting production for ${scenes.length} scenes (${state.targetAspectRatio})...`, 'info');
    
    // Initial State Update: Mark only non-done scenes as queued
    // NOTE: This initial update might be visual only, real check happens in loop
    setState(s => ({ 
      ...s, 
      isProcessing: true, 
      scenes: s.scenes.map(sc => 
        (sc.status === 'done' && sc.assetUrl) 
          ? sc 
          : { ...sc, status: 'generating', progressMessage: 'Queued...' }
      ) 
    }));
    
    for (let i = 0; i < scenes.length; i++) {
        const sceneId = scenes[i].id;
        
        // RESUME LOGIC: Check LATEST state via Ref to see if already done (from previous run or manual)
        const currentSceneState = stateRef.current.scenes.find(s => s.id === sceneId);
        if (currentSceneState && currentSceneState.status === 'done' && currentSceneState.assetUrl) {
           addLog(`Skipping Scene ${scenes[i].number} (Found in Checkpoint).`, 'info');
           continue; 
        }

        setState(s => ({ ...s, scenes: s.scenes.map(sc => sc.id === sceneId ? { ...sc, status: 'generating', progressMessage: 'Generating Keyframe...' } : sc) }));
        setGeneratingAssets(prev => new Set(prev).add(sceneId));
        
        try {
            const assetUrl = await generateSceneImage(
                scenes[i].visualPrompt, 
                state.targetAspectRatio, 
                false, 
                referenceUrl || undefined,
                state.styleProfile || undefined,
                state.targetTopic
            );
            
            addLog(`Scene ${scenes[i].number} ready.`, 'success');
            
            // UPDATE STATE & AUTO-SAVE CHECKPOINT immediately
            updateStateAndSave(s => ({ 
              ...s, 
              scenes: s.scenes.map(sc => sc.id === sceneId ? { ...sc, assetUrl, keyframeUrl: assetUrl, assetType: 'image', status: 'done', progressMessage: undefined } : sc) 
            }));

        } catch (e: any) {
             console.error(e);
             setState(s => ({ ...s, scenes: s.scenes.map(sc => sc.id === sceneId ? { ...sc, status: 'error', progressMessage: 'Failed' } : sc) }));
             handleError(e); 
        } finally {
            setGeneratingAssets(prev => { const next = new Set(prev); next.delete(sceneId); return next; });
        }
        
        if (i < scenes.length - 1) {
            // INCREASED WAIT TIME: 45 seconds to be extremely safe against 429 errors
            const delay = 45000;
            addLog(`为保证生成质量 (Gemini 3 Pro)，冷却 ${delay/1000} 秒...`, 'info');
            await new Promise(r => setTimeout(r, delay));
        }
    }
    addLog('Production complete.', 'success');
    setState(s => ({ ...s, isProcessing: false }));
  };

  const handleGenerateAllAssets = async () => {
    setCurrentPipelineStage('PRODUCTION');
    // Pass latest scenes from ref to ensure we have latest status
    await handleBatchGenerateAssets(stateRef.current.scenes, state.referenceSheetUrl);
  };

  const handleRefineScript = async (instruction: string) => {
    setState(s => ({ ...s, isProcessing: true }));
    addLog(`AI Director: Refining script...`, 'info');
    try {
      const newScript = await refineScriptWithAI(state.draftScript!, instruction, state.styleProfile!);
      
      const versionId = Date.now().toString();
      const newVersion = {
          id: versionId,
          label: `v${state.scriptVersions.length + 1} (Refined)`,
          content: newScript,
          timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })
      };

      updateStateAndSave(s => ({ 
          ...s, 
          draftScript: newScript, 
          scriptVersions: [...s.scriptVersions, newVersion],
          isProcessing: false 
      }));
      addLog('Script refined.', 'success');
    } catch (e) { handleError(e); }
  };

  const handleRestoreScriptVersion = (id: string) => {
      const version = state.scriptVersions.find(v => v.id === id);
      if (version) {
          updateStateAndSave(s => ({ ...s, draftScript: version.content }));
          addLog(`Restored script to ${version.label}`, 'info');
      }
  };

  const handleRefineVisuals = async (instruction: string) => {
    setState(s => ({ ...s, isProcessing: true }));
    addLog(`AI Director: Refining visuals...`, 'info');
    try {
      const newScenes = await refineVisualsWithAI(state.scenes, instruction, state.styleProfile!);
      updateStateAndSave(s => ({ ...s, scenes: newScenes, isProcessing: false }));
      addLog('Visual prompts refined.', 'success');
    } catch (e) { handleError(e); }
  };

  const handleGenerateAsset = useCallback(async (sceneId: string, type: 'image' | 'video') => {
    if (!(await ensureApiKey())) return;
    const scene = state.scenes.find(s => s.id === sceneId);
    if (!scene) return;
    setGeneratingAssets(prev => new Set(prev).add(sceneId));
    addLog(`Regenerating ${type}...`, 'info');
    setState(s => ({ ...s, scenes: s.scenes.map(sc => sc.id === sceneId ? { ...sc, status: 'generating', progressMessage: 'Regenerating...' } : sc) }));
    try {
      let assetUrl = '', keyframeUrl = scene.keyframeUrl, usedType = type;
      if (type === 'image') {
          assetUrl = await generateSceneImage(
              scene.visualPrompt, 
              state.targetAspectRatio, 
              false, 
              state.referenceSheetUrl || undefined,
              state.styleProfile || undefined,
              state.targetTopic
          );
          keyframeUrl = assetUrl;
      } else {
          const result = await generateSceneVideoWithKeyframe(
              scene.visualPrompt, 
              scene.keyframeUrl, 
              state.referenceSheetUrl || undefined, 
              (status) => {
                 setState(s => ({ ...s, scenes: s.scenes.map(sc => sc.id === sceneId ? { ...sc, progressMessage: status } : sc) }));
              },
              state.styleProfile || undefined,
              state.targetTopic
          );
          assetUrl = result.videoUrl; keyframeUrl = result.keyframeUrl;
      }
      
      updateStateAndSave(s => ({ ...s, scenes: s.scenes.map(sc => sc.id === sceneId ? { ...sc, assetUrl, keyframeUrl, assetType: usedType, status: 'done', progressMessage: undefined } : sc) }));
    
    } catch (error: any) { handleError(error); } 
    finally { setGeneratingAssets(prev => { const next = new Set(prev); next.delete(sceneId); return next; }); }
  }, [state.scenes, state.referenceSheetUrl, state.targetAspectRatio, state.apiKeySet, ensureApiKey, addLog, handleError, state.styleProfile, state.targetTopic]); 

  const handleRegenerateReference = async () => {
    if (!(await ensureApiKey())) return;
    setState(s => ({ ...s, isProcessing: true }));
    addLog('Regenerating Visual Anchor...', 'info');
    try {
         const referenceSheetUrl = await generateReferenceSheet(state.targetTopic, state.styleProfile!, state.targetAspectRatio);
         updateStateAndSave(s => ({ ...s, referenceSheetUrl, isProcessing: false }));
         addLog('Visual Anchor regenerated.', 'success');
    } catch (e: any) { handleError(e); }
  };

  const handleDraftOnly = async (topic: string) => { 
    if (state.styleProfile) startStrategyPhase(topic, state.styleProfile); 
  };
  
  const handleLoadProfile = (profile: StyleProfile) => { 
    setCurrentPipelineStage('STRATEGY'); 
    const restoredRatio = profile.targetAspectRatio || "16:9";
    
    // Clear old checkpoint on new profile load
    clearProjectCheckpoint();

    setState(s => ({ 
      ...s, 
      styleProfile: profile, 
      referenceTitle: profile._meta?.sourceTitle, 
      referenceThumbnailUrl: profile._meta?.sourceThumbnail,
      targetAspectRatio: restoredRatio,
      // Reset other fields
      scenes: [], 
      researchData: null,
      narrativeMap: null, 
      draftScript: null
    })); 
    addLog(`Profile loaded. Format set to ${restoredRatio}`, 'info');
  };

  const handleImportProfile = (file: File) => { const reader = new FileReader(); reader.onload = (e) => handleLoadProfile(JSON.parse(e.target?.result as string)); reader.readAsText(file); };
  
  const handleResetProfile = () => { 
    clearProjectCheckpoint();
    setState(s => ({ ...s, styleProfile: null, referenceVideoUrl: null, referenceTitle: undefined, referenceThumbnailUrl: undefined, targetAspectRatio: "16:9", scriptVersions: [], scenes: [], researchData: null, draftScript: null, narrativeMap: null })); 
    setCurrentPipelineStage('STRATEGY');
  };

  const handleSafetyProceed = () => { setShowSafetyModal(false); if (state.styleProfile && state.targetTopic) startStrategyPhase(state.targetTopic, state.styleProfile); };
  
  const handleJumpToStage = (stage: PipelineStage) => {
    if (!state.isProcessing) setCurrentPipelineStage(stage);
  };

  const handleUpdateScenePrompt = (id: string, prompt: string) => {
      updateStateAndSave(s => ({ ...s, scenes: s.scenes.map(sc => sc.id === id ? { ...sc, visualPrompt: prompt } : sc) }));
  };

  const handleScriptRegenerate = () => {
      if(state.styleProfile && state.targetTopic) {
          startStrategyPhase(state.targetTopic, state.styleProfile);
      }
  };

  const handleConfirmStyle = () => {
      if(state.styleProfile && state.targetTopic) {
          startStrategyPhase(state.targetTopic, state.styleProfile);
      }
  };

  return {
    state,
    currentPipelineStage,
    generatingAssets,
    showSafetyModal,
    setShowSafetyModal,
    actions: {
        handleConnect,
        handleLoadMock,
        handleAnalyze,
        handleDraftOnly,
        handleImportProfile,
        handleLoadProfile,
        handleResetProfile,
        handleStrategyApproved,
        handleScriptApproved,
        handleScriptRegenerate,
        handleRefineScript,
        handleRestoreScriptVersion,
        handleGenerateAsset,
        handleGenerateAllAssets,
        handleRefineVisuals,
        handleUpdateScenePrompt,
        handleRegenerateReference,
        handleSafetyProceed,
        handleJumpToStage,
        handleConfirmStyle,
        handleSafetyCancel: () => { setShowSafetyModal(false); setState(s => ({ ...s, isProcessing: false })); }
    }
  };
};
