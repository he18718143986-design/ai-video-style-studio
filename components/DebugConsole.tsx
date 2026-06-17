
import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';
import { Activity } from 'lucide-react';

interface DebugConsoleProps {
  logs: LogEntry[];
}

const DebugConsole: React.FC<DebugConsoleProps> = ({ logs }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="h-full font-mono text-xs flex flex-col min-h-0">
       {/* Minimal Header */}
       <div className="px-1 py-2 flex items-center justify-between shrink-0 opacity-40">
          <div className="flex items-center gap-2">
             <Activity className="w-3 h-3" />
             <span className="uppercase tracking-wider text-[9px] font-bold">运行记录</span>
          </div>
       </div>

       {/* Log Content - Cleaner background */}
       <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1.5 bg-black/20 rounded-sm border border-white/5">
          {logs.length === 0 && (
             <div className="text-studio-text-muted italic opacity-30 text-[10px] p-2">
                System idle. Waiting for inputs...
             </div>
          )}
          
          {logs.map((log) => (
            <div key={log.id} className="flex gap-2 leading-tight opacity-80 text-[10px]">
              <span className={`shrink-0 font-bold ${
                    log.type === 'error' ? 'text-status-error' :
                    log.type === 'success' ? 'text-status-success' :
                    log.type === 'warning' ? 'text-status-warning' :
                    'text-studio-text-muted'
              }`}>
                 {log.type === 'info' ? '>' : log.type === 'error' ? '!' : log.type === 'success' ? '✓' : '?'}
              </span>
              <span className={`${
                   log.type === 'error' ? 'text-status-error' :
                   log.type === 'success' ? 'text-status-success' :
                   log.type === 'warning' ? 'text-status-warning' :
                   'text-studio-text-secondary'
              }`}>
                 {log.message}
              </span>
            </div>
          ))}
          <div ref={bottomRef} />
       </div>
    </div>
  );
};

export default DebugConsole;
