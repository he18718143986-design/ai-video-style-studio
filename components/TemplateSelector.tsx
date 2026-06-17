
import React from 'react';
import { VIDEO_TEMPLATES } from '../data/videoTemplates';
import { VideoTemplate } from '../types';
import { Clock, Zap, Database } from 'lucide-react';

interface Props {
  onSelect: (template: VideoTemplate) => void;
  selectedId?: string;
}

const TemplateSelector: React.FC<Props> = ({ onSelect, selectedId }) => {
  return (
    <div className="space-y-2 p-1">
      {VIDEO_TEMPLATES.map((template) => {
        const isSelected = selectedId === template.id;
        return (
          <div
            key={template.id}
            onClick={() => onSelect(template)}
            className={`cursor-pointer p-2 rounded-sm border-l-2 transition-all duration-200 group relative
              ${isSelected
                ? 'border-l-accent bg-[#18181b] border-t border-r border-b border-t-white/5 border-r-white/5 border-b-white/5'
                : 'border-l-studio-700 bg-transparent hover:bg-white/5 border-t border-r border-b border-transparent hover:border-studio-700'
              }`}
          >
            <div className="flex justify-between items-start mb-1">
              <h4 className={`font-mono text-[10px] font-black uppercase truncate ${isSelected ? 'text-white' : 'text-studio-400 group-hover:text-studio-200'}`}>
                {template.name}
              </h4>
              {isSelected && <div className="w-1 h-1 bg-accent rounded-full shadow-[0_0_5px_#8b5cf6]"></div>}
            </div>
            
            <div className="flex gap-2 relative z-10 mt-2 opacity-60 group-hover:opacity-100 transition-opacity">
              <div className="flex items-center gap-1 text-[8px] text-studio-500 bg-black/20 px-1 rounded">
                 <Zap className="w-2 h-2" />
                 {template.defaultStyleDNA.tone.split(' ')[0]}
              </div>
              <div className="flex items-center gap-1 text-[8px] text-studio-500 bg-black/20 px-1 rounded">
                 <Clock className="w-2 h-2" />
                 {template.defaultStyleDNA.pacing}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TemplateSelector;
