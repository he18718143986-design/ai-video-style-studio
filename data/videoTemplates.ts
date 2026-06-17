
import { VideoTemplate } from '../types';

export const VIDEO_TEMPLATES: VideoTemplate[] = [
  {
    id: 'tech-review',
    name: 'Tech Review (科技评论)',
    description: 'Professional tech product review style. Clear logic, modern visuals, and data-driven comparisons.',
    category: 'educational',
    defaultStyleDNA: {
      tone: 'Professional and Objective',
      visualStyle: 'Minimalist High-Tech, Clean lines, White background',
      pacing: 'medium'
    },
    narrativeStructure: [
      'Hook: The Problem/Pain Point', 
      'Intro: Product Overview', 
      'Specs: Core Parameters', 
      'Experience: Real-world Usage', 
      'Verdict: Pros & Cons', 
      'Buying Advice'
    ]
  },
  {
    id: 'lifestyle-vlog',
    name: 'Lifestyle Vlog (生活记录)',
    description: 'Relaxed, emotional lifestyle sharing. Fast-paced cuts with cinematic B-roll.',
    category: 'vlog',
    defaultStyleDNA: {
      tone: 'Casual, Warm, and Authentic',
      visualStyle: 'Cinematic Natural Light, Handheld feel',
      pacing: 'fast'
    },
    narrativeStructure: [
      'Atmosphere Opener', 
      'Daily Montage', 
      'The Core Event', 
      'Emotional Reflection', 
      'Outro & Interaction'
    ]
  },
  {
    id: 'business-promo',
    name: 'Corporate Promo (企业宣传)',
    description: 'Stable, authoritative commercial promotion emphasizing brand value and trust.',
    category: 'marketing',
    defaultStyleDNA: {
      tone: 'Authoritative and Inspiring',
      visualStyle: 'Clean Corporate, Blue/Grey tones, Stock footage',
      pacing: 'slow'
    },
    narrativeStructure: [
      'The Market Challenge', 
      'Our Solution', 
      'Core Advantages', 
      'Customer Testimonials', 
      'Call to Action'
    ]
  },
  {
    id: 'documentary-short',
    name: 'Mini Doc (微纪录片)',
    description: 'Investigative storytelling style suitable for history, true crime, or social issues.',
    category: 'educational',
    defaultStyleDNA: {
      tone: 'Investigative and Serious',
      visualStyle: 'Mixed Media, Archival Footage, Ken Burns Effect',
      pacing: 'medium'
    },
    narrativeStructure: [
      'The Mystery/Hook', 
      'Historical Context', 
      'The Turning Point', 
      'Expert Analysis', 
      'Conclusion/Impact'
    ]
  }
];
