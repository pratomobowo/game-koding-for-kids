import React from 'react';
import { CommandType } from '../types';
import { COMMAND_ICONS, COMMAND_COLORS } from '../constants';

interface CommandPaletteProps {
  onAddCommand: (cmd: CommandType) => void;
  disabled: boolean;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ onAddCommand, disabled }) => {
  return (
    <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
      {Object.values(CommandType).map((cmd) => (
        <button
          key={cmd}
          onClick={() => onAddCommand(cmd)}
          disabled={disabled}
          className={`
            ${COMMAND_COLORS[cmd]}
            text-white font-bold py-4 px-6 rounded-xl shadow-lg
            transform transition-all duration-150
            active:scale-95 active:border-b-0 active:translate-y-1
            disabled:opacity-50 disabled:cursor-not-allowed
            flex flex-col items-center justify-center gap-1
          `}
        >
          <span className="text-2xl">{COMMAND_ICONS[cmd]}</span>
          <span className="text-xs uppercase tracking-wider">{cmd}</span>
        </button>
      ))}
    </div>
  );
};

export default CommandPalette;