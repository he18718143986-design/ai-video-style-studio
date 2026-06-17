
import React from 'react';
import { Loader2 } from 'lucide-react';

export const ProcessingState: React.FC<{ stage: string }> = ({ stage }) => (
  <div className="flex flex-col items-center justify-center h-full text-center space-y-6 animate-in fade-in duration-700 bg-[#050505]">
    <div className="relative w-32 h-32">
       <div className="absolute inset-0 border border-zinc-800 rounded-full opacity-50"></div>
       <div className="absolute inset-0 border-t border-accent rounded-full animate-spin"></div>
       <div className="absolute inset-4 border border-zinc-900 rounded-full border-b-accent/50 animate-[spin_2s_linear_infinite_reverse]"></div>
       <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-accent animate-pulse" />
       </div>
    </div>
    <div className="space-y-2">
      <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] animate-pulse">{stage}</h3>
      <p className="text-zinc-500 font-mono text-xs">GEMINI_3_PRO_PIPELINE // 执行中</p>
    </div>
  </div>
);

export const EmptyState: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-full text-zinc-500 animate-in fade-in p-12 text-center bg-dot-grid bg-[size:20px_20px]">
     {/* Intentionally empty */}
  </div>
);
