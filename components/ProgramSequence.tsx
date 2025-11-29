import React, { useEffect, useRef } from 'react';
import { CommandType } from '../types';
import { COMMAND_ICONS } from '../constants';

interface ProgramSequenceProps {
  commands: CommandType[];
  executingIndex: number | null;
  onRemoveCommand: (index: number) => void;
  disabled: boolean;
}

const ProgramSequence: React.FC<ProgramSequenceProps> = ({ 
  commands, 
  executingIndex, 
  onRemoveCommand,
  disabled 
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to new commands
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [commands.length]);

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-700 p-4 h-full flex flex-col">
      <h3 className="text-accent-green font-bold mb-2 flex items-center gap-2">
        <span className="text-xl">💻</span> Program Utama
      </h3>
      
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto custom-scrollbar bg-slate-800/50 rounded-lg p-2 space-y-2 min-h-[150px]"
      >
        {commands.length === 0 && (
          <div className="h-full flex items-center justify-center text-slate-500 text-sm italic text-center">
            Klik tombol panah untuk menambahkan perintah...
          </div>
        )}

        {commands.map((cmd, index) => {
          const isExecuting = executingIndex === index;
          const isPending = executingIndex !== null && index > executingIndex;
          const isDone = executingIndex !== null && index < executingIndex;

          return (
            <div 
              key={index}
              className={`
                flex items-center justify-between p-2 rounded-md border
                transition-all duration-300
                ${isExecuting 
                  ? 'bg-accent-yellow text-slate-900 border-yellow-500 scale-105 shadow-lg font-bold' 
                  : 'bg-slate-700 border-slate-600 text-white'}
                ${isDone ? 'opacity-50' : 'opacity-100'}
              `}
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-slate-400 w-4">{index + 1}.</span>
                <span className="text-lg">{COMMAND_ICONS[cmd]}</span>
                <span className="text-sm font-semibold tracking-wide">{cmd}</span>
              </div>
              
              {!disabled && (
                <button 
                  onClick={() => onRemoveCommand(index)}
                  className="text-slate-400 hover:text-red-400 transition-colors p-1"
                  aria-label="Remove command"
                >
                  ✕
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgramSequence;