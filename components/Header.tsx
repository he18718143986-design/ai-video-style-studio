
import React from 'react';
import { Key, Cpu } from 'lucide-react';

interface HeaderProps {
  apiKeySet: boolean;
  onConnect: () => void;
  onLoadMock?: () => void;
}

const Header: React.FC<HeaderProps> = ({ apiKeySet, onConnect, onLoadMock }) => {
  return (
    <header className="bg-studio-panel/80 backdrop-blur-xl h-20 flex items-center justify-between px-5 sticky top-0 z-50 flex-shrink-0 select-none border-b border-white/5 shadow-2xl w-full">
      
      {/* LEFT: Identity */}
      <div 
        className="flex items-center gap-3 min-w-0 flex-1 group cursor-pointer" 
        onClick={onLoadMock}
        title="Video Studio (开发模式: 点击加载 Mock 数据)"
      >
        <div className="w-10 h-10 bg-white text-black flex items-center justify-center rounded-lg shadow-[0_0_20px_rgba(255,255,255,0.2)] flex-shrink-0 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500 relative overflow-hidden">
           <div className="absolute inset-0 bg-gradient-to-tr from-transparent to-black/10"></div>
           <Cpu className="w-6 h-6 relative z-10" />
        </div>
        
        <h1 className="text-2xl font-black tracking-[0.2em] text-white uppercase bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-zinc-500 group-hover:to-accent group-hover:from-white transition-all duration-500 whitespace-nowrap pt-1">
            AI 视频工坊
        </h1>
      </div>

      {/* RIGHT: Auth Status */}
      <div className="flex-shrink-0 ml-3 pl-3 border-l border-white/5">
        {apiKeySet ? (
          <div 
            onClick={onConnect}
            className="w-9 h-9 flex items-center justify-center bg-emerald-500/10 border border-emerald-500/20 rounded-md transition-all hover:bg-emerald-500/20 cursor-pointer group shadow-[0_0_10px_rgba(16,185,129,0.1)] hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] relative overflow-hidden" 
            title="API Key 已连接"
          >
             <div className="absolute inset-0 bg-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
             <Key className="w-4 h-4 text-emerald-500 group-hover:text-emerald-400 transition-colors relative z-10" />
          </div>
        ) : (
          <button 
            onClick={onConnect}
            className="w-9 h-9 flex items-center justify-center bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 border border-orange-500/30 animate-pulse rounded-md transition-all shadow-[0_0_10px_rgba(249,115,22,0.1)] hover:shadow-[0_0_15px_rgba(249,115,22,0.3)]"
            title="连接 API Key"
          >
            <Key className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
