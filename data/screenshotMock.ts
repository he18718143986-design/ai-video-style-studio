
import { AppState, Scene } from '../types';

export const SCREENSHOT_MOCK_STATE: Partial<AppState> = {
  targetTopic: "Neuromorphic Computing: Brain-Inspired Chips",
  referenceTitle: "Exemplar: The Retro-Futurist Documentary",
  referenceThumbnailUrl: "https://images.unsplash.com/photo-1614726365723-49cfae96a604?auto=format&fit=crop&q=80&w=640",
  
  // 1. Style Profile (Gemini 3 Pro Analysis)
  styleProfile: {
    visualStyle: "Retro-Futurism / Synthwave aesthetic. Neon grids, glowing wireframes, and CRT monitor scanline effects. High contrast cyberpunk colors.",
    pacing: "Hypnotic and rhythmic, matching a synth-bass beat.",
    tone: "Mysterious but scientifically rigorous.",
    colorPalette: ["#FF00FF", "#00FFFF", "#2D00B7", "#0F0C29", "#FF9E00"],
    targetAudience: "Tech enthusiasts and Sci-Fi fans.",
    keyElements: ["Glowing wireframe brains", "VHS glitch transitions", "Floating terminal code overlay"],
    pedagogicalApproach: "Compares biological neurons to silicon transistors using visual analogies.",
    narrativeStructure: ["The Hook: The Limit of Moore's Law", "The Biology: How Synapses Work", "The mimic: Spiking Neural Networks", "The Future: AI that sleeps"],
    scriptStyle: "Narrated like a 1980s science documentary but with modern accuracy. Uses metaphors like 'traffic' and 'lightning'.",
    fullTranscript: "Imagine a computer that doesn't compute, but dreams...",
    wordCount: 450,
    wordsPerMinute: 140
  },

  // 2. Research Data (Gemini 3 Flash Grounding)
  researchData: {
    facts: [
      { content: "Traditional CPU Architecture (von Neumann) separates memory and processing, creating a 'bottleneck'.", source: "wikipedia.org/wiki/Von_Neumann_architecture", confidence: "High" },
      { content: "The human brain consumes only ~20 watts of power, while supercomputers need megawatts.", source: "nature.com/articles/brain-energy", confidence: "High" },
      { content: "Neuromorphic chips use 'Spiking Neural Networks' (SNNs) where timing of signals matters.", source: "intel.com/neuromorphic", confidence: "Medium" },
      { content: "Intel's Loihi 2 and IBM's TrueNorth are leading examples of this hardware.", source: "techcrunch.com", confidence: "High" },
    ],
    myths: [
      "Myth: Neuromorphic chips are biological brains in jars.",
      "Myth: They will strictly replace CPUs for all tasks (they are specialized)."
    ],
    glossary: [
      { term: "Synaptic Plasticity", definition: "The ability of connections between neurons to strengthen or weaken over time." },
      { term: "Memristor", definition: "A electrical component that limits or regulates the flow of electrical current and remembers the amount of charge that has previously flowed through it." }
    ],
    rawGroundingMetadata: {}
  },

  // 3. Narrative Map
  narrativeMap: [
    { sectionTitle: "The Von Neumann Bottleneck", description: "Explain why current computers are hitting a speed limit using a traffic jam analogy.", estimatedDuration: 30, factReferences: ["Fact-1"] },
    { sectionTitle: "The 20-Watt Miracle", description: "Contrast the supercomputer with the human brain's efficiency.", estimatedDuration: 45, factReferences: ["Fact-2"] },
    { sectionTitle: "Enter the Memristor", description: "Introduce the hardware that behaves like a biological synapse.", estimatedDuration: 60, factReferences: ["Fact-3", "Glossary-2"] },
  ],

  // 4. Draft Script
  draftScript: `## Scene 1: The Bottleneck\n\n(Synth music fades in)\n\n**Narrator:** Speed. We crave it. But our silicon speed demons are hitting a wall. It's called the Von Neumann bottleneck. Imagine a Ferrari stuck in gridlock traffic. That is your CPU waiting for memory.\n\n## Scene 2: The 20-Watt Miracle\n\n**Narrator:** Now, look at this. (Sound of a heartbeat). The human brain. It runs on the same power as a dim lightbulb, yet it outperforms a nuclear-powered supercomputer at pattern recognition. How?\n\n## Scene 3: The Spark\n\n**Narrator:** It's not about 1s and 0s anymore. It's about the *spike*. The timing. Welcome to the age of Neuromorphic Engineering.`,

  // 5. Visual Anchor
  referenceSheetUrl: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1024",

  // 6. Scenes (Storyboard)
  scenes: [
    {
      id: "s1", number: 1, status: "done", assetType: "image",
      narrative: "Speed. We crave it. But our silicon speed demons are hitting a wall.",
      visualPrompt: "Retro-futurist style: A glowing neon Ferrari stuck in a gridlock of binary code. 80s sci-fi aesthetic, dark purple background.",
      productionSpecs: { camera: "Panning slow motion", lighting: "Neon purple highlights", sound: "Deep synth drone" },
      estimatedDuration: 12,
      assetUrl: "https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&q=80&w=640", // Placeholder that looks like the style
      keyframeUrl: "https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&q=80&w=640",
      logs: []
    },
    {
      id: "s2", number: 2, status: "done", assetType: "video",
      narrative: "It's called the Von Neumann bottleneck. Imagine a Ferrari stuck in gridlock traffic.",
      visualPrompt: "Retro-futurist style: A massive glowing wall of microchips forming a narrow funnel. Data packets represented as lasers getting stuck.",
      productionSpecs: { camera: "Zoom in tightly", lighting: "Red warning lights", sound: "Glitch sound effects" },
      estimatedDuration: 15,
      assetUrl: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&q=80&w=640",
      keyframeUrl: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&q=80&w=640",
      logs: []
    },
    {
      id: "s3", number: 3, status: "done", assetType: "image",
      narrative: "Now, look at this. The human brain. It runs on the same power as a dim lightbulb.",
      visualPrompt: "Retro-futurist style: A wireframe human brain glowing electric blue, floating inside a glass lightbulb. Dark background.",
      productionSpecs: { camera: "Orbit rotation", lighting: "Electric blue glow", sound: "Heartbeat monitor" },
      estimatedDuration: 18,
      assetUrl: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=640",
      keyframeUrl: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=640",
      logs: []
    }
  ],
  
  // 7. Logs
  logs: [
    { id: "l1", timestamp: "10:00:01", type: "success", message: "Style DNA Analysis complete (Gemini 3 Pro)." },
    { id: "l2", timestamp: "10:00:05", type: "success", message: "Safety check passed." },
    { id: "l3", timestamp: "10:00:12", type: "success", message: "Google Search Grounding: 4 facts retrieved." },
    { id: "l4", timestamp: "10:00:18", type: "success", message: "Narrative Map synthesized." },
    { id: "l5", timestamp: "10:00:25", type: "success", message: "Script draft generated." },
    { id: "l6", timestamp: "10:01:45", type: "success", message: "Visual Assets generated (Gemini 3 Pro Image)." },
  ],
  
  isProcessing: false,
  verificationReport: {
      safetyCheck: true,
      medicalFlag: false,
      styleConsistencyScore: 98,
      factCheckPassed: true
  }
};
