
import { Scene } from "../types";

/**
 * Compiles a video from scenes, images, and audio.
 * Renders to HTML5 Canvas and captures via MediaRecorder.
 */
export const compileEpisode = async (
  scenes: Scene[],
  aspectRatio: string = "16:9",
  mood: string = "Neutral", 
  onProgress: (msg: string) => void
): Promise<string> => {
  
  const isPortrait = aspectRatio === "9:16";
  const width = isPortrait ? 720 : 1280;
  const height = isPortrait ? 1280 : 720;
  
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) throw new Error("Could not initialize canvas context");

  // Setup Audio Context for mixing
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  const audioCtx = new AudioContext();
  
  if (audioCtx.state === 'suspended') {
    await audioCtx.resume();
  }

  const dest = audioCtx.createMediaStreamDestination();
  
  // Calculate total duration
  const totalDuration = scenes.reduce((acc, s) => acc + (s.audioDuration || s.estimatedDuration || 3) + 1, 0);

  // --- GENERATE & ADD PROCEDURAL MUSIC LOOP ---
  onProgress("Synthesizing High-Fidelity Soundtrack...");
  const musicGain = audioCtx.createGain();
  musicGain.gain.value = 0.12; // Adjusted volume
  musicGain.connect(dest);

  // Create and Play the loop
  const musicBuffer = await generateMusicLoop(audioCtx, mood);
  const musicSource = audioCtx.createBufferSource();
  musicSource.buffer = musicBuffer;
  musicSource.loop = true;
  musicSource.connect(musicGain);
  musicSource.start(0);

  // Setup Media Recorder
  const canvasStream = canvas.captureStream(30); // 30 FPS
  
  const mixedStream = new MediaStream([
    ...canvasStream.getVideoTracks(),
    ...dest.stream.getAudioTracks()
  ]);

  let mimeType = 'video/webm;codecs=vp9';
  if (MediaRecorder.isTypeSupported('video/mp4')) {
    mimeType = 'video/mp4';
  } else if (MediaRecorder.isTypeSupported('video/webm')) {
    mimeType = 'video/webm';
  }

  const recorder = new MediaRecorder(mixedStream, { mimeType, videoBitsPerSecond: 5000000 });
  const chunks: Blob[] = [];

  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  recorder.start();

  // --- RENDERING LOOP ---

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    onProgress(`Rendering Scene ${i + 1}/${scenes.length}`);

    // 1. Load Image
    const img = new Image();
    img.crossOrigin = "anonymous";
    const imgPromise = new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
      const src = scene.keyframeUrl || scene.assetUrl;
      if (src) {
          img.src = src;
      } else {
          resolve(); 
      }
    });
    
    // 2. Load Audio
    let audioBuffer: AudioBuffer | null = null;
    let audioDuration = scene.estimatedDuration || 3;
    
    if (scene.audioUrl) {
       try {
         const response = await fetch(scene.audioUrl);
         const arrayBuffer = await response.arrayBuffer();
         audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
         audioDuration = audioBuffer.duration;
       } catch (e) {
         console.warn(`Failed to decode audio for scene ${i+1}`, e);
       }
    }

    try {
        if (img.src) await imgPromise;
    } catch (e) {
        console.warn(`Failed to load image for scene ${i+1}`);
    }

    // 3. Play Audio
    if (audioBuffer) {
        const source = audioCtx.createBufferSource();
        source.buffer = audioBuffer;
        const voiceGain = audioCtx.createGain();
        voiceGain.gain.value = 1.0; 
        source.connect(voiceGain);
        voiceGain.connect(dest);
        source.start();
    }

    // --- SUBTITLE PAGINATION ---
    const subtitlePages = calculateSubtitlePages(ctx, scene.narrative, width, height, isPortrait);
    
    // 4. Animate Frame
    const fps = 30;
    const totalFrames = Math.ceil((audioDuration + 0.2) * fps); 
    const framesPerPage = totalFrames / (subtitlePages.length || 1);

    for (let f = 0; f < totalFrames; f++) {
       // Ken Burns Effect
       const scale = 1 + (f / totalFrames) * 0.1; 
       
       ctx.save();
       ctx.fillStyle = "#000";
       ctx.fillRect(0, 0, width, height);
       
       ctx.translate(width / 2, height / 2);
       ctx.scale(scale, scale);
       ctx.translate(-width / 2, -height / 2);
       
       if (img.src && img.complete && img.naturalWidth > 0) {
           const hRatio = width / img.width;
           const vRatio = height / img.height;
           const ratio = Math.max(hRatio, vRatio);
           const centerShift_x = (width - img.width * ratio) / 2;
           const centerShift_y = (height - img.height * ratio) / 2;
           ctx.drawImage(img, 0, 0, img.width, img.height, centerShift_x, centerShift_y, img.width * ratio, img.height * ratio);
       }
       ctx.restore();

       if (subtitlePages.length > 0) {
          const pageIndex = Math.floor(f / framesPerPage);
          const safeIndex = Math.min(pageIndex, subtitlePages.length - 1);
          drawSubtitlePage(ctx, subtitlePages[safeIndex], width, height, isPortrait);
       }

       await new Promise(r => setTimeout(r, 1000 / fps));
    }
  }

  // Finalize
  musicSource.stop();
  recorder.stop();
  
  await new Promise(resolve => setTimeout(resolve, 500));
  audioCtx.close(); 

  return new Promise((resolve) => {
    recorder.onstop = () => {
       const blob = new Blob(chunks, { type: mimeType });
       const url = URL.createObjectURL(blob);
       resolve(url);
    };
    if (recorder.state === 'inactive' && chunks.length > 0) {
       const blob = new Blob(chunks, { type: mimeType });
       const url = URL.createObjectURL(blob);
       resolve(url);
    }
  });
};

/**
 * --- SOPHISTICATED PROCEDURAL MUSIC GENERATOR ---
 * Creates a high-quality 16-second seamless loop with Reverb and Effects.
 */
async function generateMusicLoop(mainCtx: AudioContext, moodString: string): Promise<AudioBuffer> {
    const offlineCtx = new OfflineAudioContext(2, 44100 * 16, 44100);
    const mood = moodString.toLowerCase();
    
    // --- STYLE DEFINITIONS ---
    let rootFreq = 261.63; // C4
    let scale = [0, 2, 4, 7, 9]; 
    let tempo = 1.0; 
    let style = 'pad'; // pad, cinematic, tech, lofi, corporate

    if (mood.includes('tech') || mood.includes('future') || mood.includes('cyber')) {
        style = 'tech';
        rootFreq = 196.00; // G3
        scale = [0, 3, 5, 7, 10]; // Minor Pentatonic
        tempo = 0.25; // 16th notes
    } else if (mood.includes('cinematic') || mood.includes('drama') || mood.includes('dark')) {
        style = 'cinematic';
        rootFreq = 146.83; // D3
        scale = [0, 2, 3, 5, 7, 8, 10]; // Minor Natural
        tempo = 4.0;
    } else if (mood.includes('lofi') || mood.includes('chill') || mood.includes('casual')) {
        style = 'lofi';
        rootFreq = 349.23; // F4
        scale = [0, 4, 7, 11]; // Major 7 chords
        tempo = 2.0;
    } else if (mood.includes('corporate') || mood.includes('happy') || mood.includes('upbeat')) {
        style = 'corporate';
        rootFreq = 293.66; // D4
        scale = [0, 4, 7, 12]; // Major Triad + Octave
        tempo = 0.5;
    }

    const masterGain = offlineCtx.createGain();
    
    // --- 1. PROCEDURAL REVERB (The "Secret Sauce") ---
    const convolver = offlineCtx.createConvolver();
    convolver.buffer = createReverbImpulse(offlineCtx, 2.5, 2.0); // 2.5s tail
    const reverbGain = offlineCtx.createGain();
    reverbGain.gain.value = 0.4; // Wet mix
    
    masterGain.connect(offlineCtx.destination);
    masterGain.connect(convolver);
    convolver.connect(offlineCtx.destination);

    // --- 2. LAYER GENERATION ---

    // A. BASE LAYER (Pads/Drones)
    if (style === 'cinematic' || style === 'pad' || style === 'lofi') {
        const chordNotes = [0, 2, 4];
        chordNotes.forEach((n, i) => {
            const freq = getFreq(rootFreq, scale, n);
            // Spread stereo
            const pan = (i % 2 === 0) ? -0.3 : 0.3;
            createPadLayer(offlineCtx, masterGain, freq, 16, style === 'cinematic', pan, style === 'lofi');
        });
        // Sub Bass
        createPadLayer(offlineCtx, masterGain, rootFreq / 2, 16, true, 0, false, 0.4);
    } else if (style === 'tech' || style === 'corporate') {
        // Pulse Bass
        for(let i=0; i<32; i++) {
             if(i%4 === 0) createPluck(offlineCtx, masterGain, rootFreq/2, i * 0.5, 0.4, 'square');
        }
    }

    // B. MELODIC LAYER (Arps/Plucks)
    if (style === 'tech' || style === 'corporate') {
        const steps = 16 / tempo;
        const delayLine = offlineCtx.createDelay();
        delayLine.delayTime.value = tempo * 0.75; // Dotted note delay
        const delayGain = offlineCtx.createGain();
        delayGain.gain.value = 0.4;
        
        delayLine.connect(delayGain);
        delayGain.connect(masterGain);
        delayGain.connect(delayLine); // Feedback

        for (let i = 0; i < steps; i++) {
             if (Math.random() > 0.4) {
                 const noteIndex = Math.floor(Math.random() * scale.length);
                 let freq = getFreq(rootFreq, scale, noteIndex);
                 if (style === 'tech' && Math.random() > 0.8) freq *= 2; // Glitch up octave
                 
                 const time = i * tempo;
                 const oscNode = createPluck(offlineCtx, masterGain, freq, time, 0.2, style === 'tech' ? 'sawtooth' : 'sine');
                 oscNode.connect(delayLine); // Send to delay
             }
        }
    } else if (style === 'lofi') {
        // Slow keys
        const steps = 8;
        for (let i = 0; i < steps; i++) {
            if (Math.random() > 0.6) {
                 const noteIndex = Math.floor(Math.random() * scale.length);
                 const freq = getFreq(rootFreq, scale, noteIndex);
                 createPluck(offlineCtx, masterGain, freq, i * 2.0, 0.15, 'triangle', true);
            }
        }
        // Vinyl Noise
        createNoiseFloor(offlineCtx, masterGain, 0.03);
    }
    
    // --- 3. MASTERING COMPRESSION (Simple limiter via dynamics) ---
    // Web Audio OfflineContext renders float32, so clipping isn't an issue until playback, 
    // but we keep levels reasonable with gains above.

    return await offlineCtx.startRendering();
}

// --- SYNTHESIS HELPERS ---

function createReverbImpulse(ctx: BaseAudioContext, duration: number, decay: number): AudioBuffer {
  const rate = ctx.sampleRate;
  const length = rate * duration;
  const impulse = ctx.createBuffer(2, length, rate);
  const left = impulse.getChannelData(0);
  const right = impulse.getChannelData(1);

  for (let i = 0; i < length; i++) {
    const n = i / length;
    const vol = Math.pow(1 - n, decay);
    left[i] = (Math.random() * 2 - 1) * vol;
    right[i] = (Math.random() * 2 - 1) * vol;
  }
  return impulse;
}

function getFreq(root: number, scale: number[], index: number): number {
    const octave = Math.floor(index / scale.length);
    const step = index % scale.length;
    const semitones = scale[step] + (octave * 12);
    return root * Math.pow(2, semitones / 12);
}

function createPadLayer(
    ctx: OfflineAudioContext, 
    dest: AudioNode, 
    freq: number, 
    duration: number, 
    isDrone: boolean, 
    pan: number = 0,
    detuneLofi: boolean = false,
    vol: number = 0.1
) {
    const osc = ctx.createOscillator();
    osc.type = isDrone ? 'sawtooth' : 'triangle';
    osc.frequency.value = freq;
    
    // Detune logic
    if (detuneLofi) {
         // Wobble
         const lfo = ctx.createOscillator();
         lfo.frequency.value = Math.random() * 0.5;
         const lfoGain = ctx.createGain();
         lfoGain.gain.value = 15; // Heavy pitch warp
         lfo.connect(lfoGain);
         lfoGain.connect(osc.detune);
         lfo.start();
    } else {
         osc.detune.value = (Math.random() * 10) - 5;
    }

    const panner = ctx.createStereoPanner();
    panner.pan.value = pan;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = isDrone ? 400 : 1200;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, 0);
    gain.gain.linearRampToValueAtTime(vol, 4); // Slow attack
    gain.gain.setValueAtTime(vol, duration - 4);
    gain.gain.linearRampToValueAtTime(0, duration);

    osc.connect(filter);
    filter.connect(panner);
    panner.connect(gain);
    gain.connect(dest);
    
    osc.start();
    osc.stop(duration);
}

function createPluck(
    ctx: OfflineAudioContext, 
    dest: AudioNode, 
    freq: number, 
    startTime: number, 
    vol: number = 0.1,
    type: 'sine' | 'square' | 'sawtooth' | 'triangle' = 'square',
    soft: boolean = false
): OscillatorNode {
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    
    const envDuration = soft ? 1.0 : 0.4;
    
    filter.frequency.setValueAtTime(soft ? 800 : 3000, startTime);
    filter.frequency.exponentialRampToValueAtTime(200, startTime + envDuration);
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + envDuration);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    
    osc.start(startTime);
    osc.stop(startTime + envDuration);
    
    return osc;
}

function createNoiseFloor(ctx: OfflineAudioContext, dest: AudioNode, vol: number) {
    const bufferSize = ctx.sampleRate * 16;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * vol;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1000; // Muffle it for vinyl effect
    
    noise.connect(filter);
    filter.connect(dest);
    noise.start();
}


// --- SUBTITLE HELPERS (Unchanged) ---
function calculateSubtitlePages(ctx: CanvasRenderingContext2D, text: string, w: number, h: number, isPortrait: boolean): string[][] {
    if (!text) return [];
    const fontSize = isPortrait ? 48 : 42; 
    ctx.font = `900 ${fontSize}px sans-serif`;
    const maxTextWidth = w * (isPortrait ? 0.85 : 0.8);
    const words = text.split(' ');
    const allLines: string[] = [];
    let currentLine = words[0];
    for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = ctx.measureText(currentLine + " " + word).width;
        if (width < maxTextWidth) { currentLine += " " + word; } else { allLines.push(currentLine); currentLine = word; }
    }
    allLines.push(currentLine);
    const pages: string[][] = [];
    for (let i = 0; i < allLines.length; i += 2) { pages.push(allLines.slice(i, i + 2)); }
    return pages;
}

function drawSubtitlePage(ctx: CanvasRenderingContext2D, lines: string[], w: number, h: number, isPortrait: boolean) {
    const fontSize = isPortrait ? 48 : 42;
    ctx.font = `900 ${fontSize}px sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const lineHeight = fontSize * 1.3;
    const boxPaddingX = 40; const boxPaddingY = 30;
    let maxLineWidth = 0;
    lines.forEach(l => { const m = ctx.measureText(l).width; if (m > maxLineWidth) maxLineWidth = m; });
    const boxWidth = maxLineWidth + boxPaddingX * 2;
    const boxHeight = (lines.length * lineHeight) + boxPaddingY;
    const bottomMargin = isPortrait ? 300 : 100; 
    const boxX = (w - boxWidth) / 2;
    const boxY = h - bottomMargin - boxHeight;
    ctx.shadowColor = "rgba(0,0,0,0.8)"; ctx.shadowBlur = 20;
    ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
    roundRect(ctx, boxX, boxY, boxWidth, boxHeight, 16); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#FFD700"; 
    const textStartY = boxY + boxPaddingY/2 + (lineHeight / 2);
    lines.forEach((line, i) => {
        const yPos = textStartY + (i * lineHeight);
        ctx.fillText(line, w / 2, yPos);
        ctx.strokeStyle = "rgba(0,0,0,0.8)"; ctx.lineWidth = 2; ctx.strokeText(line, w / 2, yPos);
    });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}
