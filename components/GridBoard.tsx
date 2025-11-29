import React from 'react';
import { GameState, GridPosition } from '../types';

interface GridBoardProps {
  layout: string[];
  gameState: GameState;
}

const GridBoard: React.FC<GridBoardProps> = ({ layout, gameState }) => {
  const getCellContent = (char: string, x: number, y: number) => {
    // Check if Robot is here
    if (gameState.robotPosition.x === x && gameState.robotPosition.y === y) {
      const rotation = {
        'UP': 'rotate-0',
        'RIGHT': 'rotate-90',
        'DOWN': 'rotate-180',
        'LEFT': '-rotate-90'
      }[gameState.robotDirection];
      
      return (
        <div className={`text-4xl transition-transform duration-300 ${rotation} drop-shadow-lg`}>
          🤖
        </div>
      );
    }

    // Static items
    switch (char) {
      case 'G': return <div className="text-3xl animate-bounce-slow">🚀</div>; // Goal
      case 'X': return <div className="text-3xl opacity-80">🪨</div>; // Obstacle
      case 'C': 
        // Only show if not collected (logic handled in parent, but simple visual check here is ok provided layout doesn't change)
        // However, standard is layout is static. We need to check if this specific coin is collected.
        // For simplicity in this demo, we assume layout updates or we overlay. 
        // Actually, let's just render from layout, assuming parent updates layout string or we check a 'collected' map.
        // For this version: We will modify the layout string in the parent state to remove 'C' when collected.
        return <div className="text-3xl animate-pulse-fast">⭐</div>; 
      case 'S': return <div className="text-sm text-gray-400 font-bold">START</div>;
      default: return null;
    }
  };

  return (
    <div className="relative p-2 bg-slate-800 rounded-xl border-4 border-slate-700 shadow-2xl">
      <div className="grid grid-cols-5 gap-2">
        {layout.map((row, y) => (
          <React.Fragment key={y}>
            {row.split('').map((char, x) => (
              <div 
                key={`${x}-${y}`}
                className={`
                  w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 
                  bg-slate-700/50 rounded-lg flex items-center justify-center
                  border-2 ${char === 'X' ? 'border-red-500/30' : 'border-slate-600/30'}
                  transition-colors duration-300
                  ${gameState.robotPosition.x === x && gameState.robotPosition.y === y ? 'bg-slate-600/80 border-accent-blue' : ''}
                `}
              >
                {getCellContent(char, x, y)}
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
      
      {/* Grid Coordinates (Optional educational value) */}
      <div className="absolute -bottom-6 left-0 w-full flex justify-between px-4 text-xs text-slate-500">
        <span>0</span><span>1</span><span>2</span><span>3</span><span>4</span>
      </div>
      <div className="absolute -left-6 top-0 h-full flex flex-col justify-between py-4 text-xs text-slate-500">
        <span>0</span><span>1</span><span>2</span><span>3</span><span>4</span>
      </div>
    </div>
  );
};

export default GridBoard;