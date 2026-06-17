
import { StyleProfile } from "../types";

export interface SampleTemplate {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string; // Main cover
  previewFrames: string[]; // For slideshow hover effect
  profile: StyleProfile;
}

export const SAMPLE_TEMPLATES: SampleTemplate[] = [
  {
    id: 'sample-kurz',
    title: 'The Minimalist Vector',
    description: 'Flat design, cute birds, and existential dread. Perfect for complex scientific topics.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1516961642265-531546e84af2?auto=format&fit=crop&q=80&w=640',
    previewFrames: [
      'https://images.unsplash.com/photo-1516961642265-531546e84af2?auto=format&fit=crop&q=80&w=640',
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=640',
      'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=640'
    ],
    profile: {
      visualStyle: "Flat vector illustrations with thick outlines. High contrast, vibrant minimalist aesthetic.",
      pacing: "Fast and rhythmic",
      tone: "Curious, slightly humorous, and optimistic",
      colorPalette: ["#FFD700", "#FF6B6B", "#4ECDC4", "#1A1A1A"],
      targetAudience: "General public, Science enthusiasts",
      keyElements: ["Cute anthropomorphic animals", "Zoom-out transitions", "Black screen voids"],
      pedagogicalApproach: "Simplifies complex systems using visual metaphors and scale comparisons.",
      narrativeStructure: [
        "Hook: An existential question", 
        "Context: Why this is complicated", 
        "Mechanism: The visual metaphor", 
        "Conclusion: A hopeful outlook"
      ],
      scriptStyle: "Simple language, rhetorical questions, frequent use of 'we' and 'us'.",
      fullTranscript: "Why are you alive? It's a complicated question. Inside your cells, tiny machines are working...",
      wordCount: 180,
      wordsPerMinute: 145
    }
  },
  {
    id: 'sample-vox',
    title: 'The Explainer Documentary',
    description: 'Kinetic typography, collages, and maps. Great for history, geography, and social science.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=640',
    previewFrames: [
      'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=640',
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=640',
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=640'
    ],
    profile: {
      visualStyle: "Mixed media collage. Combines archival footage, paper textures, and sliding maps.",
      pacing: "Journalistic and deliberate",
      tone: "Investigative and objective",
      colorPalette: ["#FFFF00", "#111111", "#E5E5E5", "#333333"],
      targetAudience: "News junkies, Lifelong learners",
      keyElements: ["Sliding highlighting maps", "Sound effects for text appearance", "Grainy film overlays"],
      pedagogicalApproach: "Connects a small specific event to a larger global trend.",
      narrativeStructure: [
        "Hook: A visual anomaly", 
        "History: How we got here", 
        "Data: The chart that explains it", 
        "Takeaway: The broader implication"
      ],
      scriptStyle: "Journalistic voiceover, precise data citation, clear causal links.",
      fullTranscript: "Look at this map. It seems normal, but zoom in here. This line shouldn't exist...",
      wordCount: 210,
      wordsPerMinute: 130
    }
  },
  {
    id: 'sample-khan',
    title: 'The Digital Blackboard',
    description: 'Hand-drawn diagrams on a dark background. The gold standard for math and hard sciences.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=640',
    previewFrames: [
      'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=640',
      'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?auto=format&fit=crop&q=80&w=640',
      'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&q=80&w=640'
    ],
    profile: {
      visualStyle: "Neon hand-drawn scribbles on a deep black background. Simulation of a blackboard.",
      pacing: "Conversational and slow",
      tone: "Patient tutor",
      colorPalette: ["#000000", "#00FF00", "#FF00FF", "#00FFFF"],
      targetAudience: "Students, Self-learners",
      keyElements: ["Handwriting appearing in real-time", "Different colors for different variables", "Simple arrows"],
      pedagogicalApproach: "Step-by-step derivation. Encourages the viewer to anticipate the next step.",
      narrativeStructure: [
        "Problem: Write down the equation", 
        "Step 1: Isolate the variable", 
        "Step 2: Substitution", 
        "Check: Does the answer make sense?"
      ],
      scriptStyle: "Improvised feel, uses filler words like 'um' and 'so', speaks directly to the user.",
      fullTranscript: "So, let's look at this triangle. If we want to find the hypotenuse, we just need Pythagoras...",
      wordCount: 120,
      wordsPerMinute: 110
    }
  }
];
