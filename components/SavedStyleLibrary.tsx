
import React, { useEffect, useState } from 'react';
import { Library, Trash2, FileVideo, Clock, PlayCircle, Activity } from 'lucide-react';
import { StyleProfile } from '../types';
import { getSavedProfiles, deleteSavedProfile, SavedProfile } from '../services/storage';

interface SavedStyleLibraryProps {
  onSelect: (profile: StyleProfile) => void;
}

const SavedStyleLibrary: React.FC<SavedStyleLibraryProps> = ({ onSelect }) => {
  const [profiles, setProfiles] = useState<SavedProfile[]>([]);

  useEffect(() => {
    setProfiles(getSavedProfiles());
  }, []);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to remove this style from your library?")) {
      const updated = deleteSavedProfile(id);
      setProfiles(updated);
    }
  };

  if (profiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-zinc-500 animate-in fade-in p-12 text-center">
         {/* CLEAN INITIAL STATE: No text, no icon */}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-10">
        {/* ICON REMOVED FOR CLEANER INITIAL STATE */}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {profiles.map((item) => (
          <div 
            key={item.id}
            onClick={() => onSelect(item.profile)}
            className="group bg-studio-800 border border-studio-700 rounded-xl overflow-hidden hover:border-accent/50 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 cursor-pointer flex flex-col relative"
          >
            {/* Thumbnail Area */}
            <div className="aspect-video bg-black relative overflow-hidden border-b border-studio-700">
              {item.profile._meta?.sourceThumbnail ? (
                <img 
                  src={item.profile._meta.sourceThumbnail} 
                  alt={item.profile._meta.sourceTitle} 
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-studio-900">
                  <FileVideo className="w-12 h-12 text-studio-600" />
                </div>
              )}
              
              {/* Overlay Play Icon */}
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors flex items-center justify-center">
                 <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300">
                    <PlayCircle className="w-6 h-6 text-white" />
                 </div>
              </div>

              {/* Stats Badge */}
              <div className="absolute top-3 left-3 flex gap-2">
                 <span className="px-2 py-1 bg-black/60 backdrop-blur-md text-[10px] font-bold text-white uppercase tracking-wider rounded border border-white/10 flex items-center gap-1">
                   <Clock className="w-3 h-3" />
                   {item.profile.wordsPerMinute} WPM
                 </span>
              </div>
            </div>

            {/* Content Area */}
            <div className="p-5 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-black text-white group-hover:text-accent transition-colors truncate pr-4" title={item.profile._meta?.sourceTitle}>
                  {item.profile._meta?.sourceTitle || 'Untitled Style'}
                </h3>
                <button 
                  onClick={(e) => handleDelete(e, item.id)}
                  className="text-studio-500 hover:text-danger hover:bg-danger/10 p-1.5 rounded transition-all opacity-0 group-hover:opacity-100"
                  title="Delete from Library"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-studio-300 line-clamp-2 mb-4 leading-relaxed h-8">
                {item.profile.visualStyle}
              </p>

              <div className="mt-auto pt-4 border-t border-studio-700/50 flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-studio-900 text-studio-400 text-[10px] rounded border border-studio-700">
                  {item.profile.tone}
                </span>
                <span className="px-2 py-1 bg-studio-900 text-studio-400 text-[10px] rounded border border-studio-700">
                  {item.profile.scriptStyle?.split(' ')[0] || 'Narrative'}
                </span>
                 <span className="px-2 py-1 bg-studio-900 text-studio-400 text-[10px] rounded border border-studio-700 ml-auto">
                  {new Date(item.savedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SavedStyleLibrary;
