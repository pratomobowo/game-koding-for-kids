import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, LevelData, CommandType, GridPosition } from './types';
import { INITIAL_LEVELS } from './constants';
import { generateLevel, getAIHint } from './services/geminiService';
import GridBoard from './components/GridBoard';
import CommandPalette from './components/CommandPalette';
import ProgramSequence from './components/ProgramSequence';

const App: React.FC = () => {
  const [levelData, setLevelData] = useState<LevelData>(INITIAL_LEVELS[0]);
  const [gameState, setGameState] = useState<GameState>({
    currentLevel: 1,
    score: 0,
    isPlaying: false,
    isWon: false,
    isLost: false,
    robotPosition: { x: 0, y: 0 },
    robotDirection: 'RIGHT',
    commands: [],
    executingCommandIndex: null,
    coinsCollected: 0,
    totalCoins: 0,
  });

  const [currentLayout, setCurrentLayout] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [hint, setHint] = useState<string>("");
  const [loadingHint, setLoadingHint] = useState(false);
  // Changed from NodeJS.Timeout to number for browser compatibility
  const executionTimeoutRef = useRef<number | null>(null);

  // Initialize Level
  useEffect(() => {
    initializeLevel(levelData);
  }, [levelData]);

  const initializeLevel = (data: LevelData) => {
    // Find Start Position
    let startPos: GridPosition = { x: 0, y: 0 };
    let coinCount = 0;

    data.layout.forEach((row, y) => {
      row.split('').forEach((char, x) => {
        if (char === 'S') startPos = { x, y };
        if (char === 'C') coinCount++;
      });
    });

    setCurrentLayout([...data.layout]);
    setGameState(prev => ({
      ...prev,
      isPlaying: false,
      isWon: false,
      isLost: false,
      robotPosition: startPos,
      robotDirection: 'RIGHT',
      commands: [],
      executingCommandIndex: null,
      coinsCollected: 0,
      totalCoins: coinCount,
    }));
    setHint("");
  };

  const handleNextLevel = async () => {
    setLoading(true);
    const nextLevelId = gameState.currentLevel + 1;
    
    // Try to get from AI first
    const aiLevel = await generateLevel("Medium", nextLevelId);
    
    if (aiLevel) {
      setLevelData(aiLevel);
    } else {
      // Fallback or loop
      const fallbackIndex = (nextLevelId - 1) % INITIAL_LEVELS.length;
      setLevelData({ ...INITIAL_LEVELS[fallbackIndex], id: nextLevelId });
    }
    
    setGameState(prev => ({ ...prev, currentLevel: nextLevelId }));
    setLoading(false);
  };

  const handleAddCommand = (cmd: CommandType) => {
    setGameState(prev => ({
      ...prev,
      commands: [...prev.commands, cmd]
    }));
  };

  const handleRemoveCommand = (index: number) => {
    setGameState(prev => {
      const newCmds = [...prev.commands];
      newCmds.splice(index, 1);
      return { ...prev, commands: newCmds };
    });
  };

  const resetPosition = () => {
    initializeLevel(levelData);
  };

  const askForHint = async () => {
    setLoadingHint(true);
    const hintText = await getAIHint(currentLayout, gameState.commands.map(c => c.toString()));
    setHint(hintText);
    setLoadingHint(false);
  };

  // Execution Logic
  const runProgram = useCallback(() => {
    if (gameState.commands.length === 0) return;
    
    setGameState(prev => ({ ...prev, isPlaying: true, executingCommandIndex: -1 })); // -1 indicates starting
    
    let step = 0;
    
    const executeStep = () => {
      setGameState(currentState => {
        if (!currentState.isPlaying) return currentState; // Stop if reset

        const cmd = currentState.commands[step];
        if (!cmd) {
            // End of commands
            return { ...currentState, isPlaying: false, executingCommandIndex: null };
        }

        let newPos = { ...currentState.robotPosition };
        let newDir = currentState.robotDirection;
        
        // Calculate new position/direction
        switch (cmd) {
            case CommandType.UP: newPos.y -= 1; newDir = 'UP'; break;
            case CommandType.DOWN: newPos.y += 1; newDir = 'DOWN'; break;
            case CommandType.LEFT: newPos.x -= 1; newDir = 'LEFT'; break;
            case CommandType.RIGHT: newPos.x += 1; newDir = 'RIGHT'; break;
        }

        // Boundary & Obstacle Check
        const isOutOfBounds = newPos.x < 0 || newPos.x >= 5 || newPos.y < 0 || newPos.y >= 5;
        let isHitObstacle = false;
        
        if (!isOutOfBounds) {
            const charAtNewPos = currentLayout[newPos.y][newPos.x];
            if (charAtNewPos === 'X') isHitObstacle = true;
        }

        if (isOutOfBounds || isHitObstacle) {
            return {
                ...currentState,
                isPlaying: false,
                isLost: true,
                executingCommandIndex: step,
                // Don't update position if hit
            };
        }

        // Valid Move
        // Check Events
        const charAtPos = currentLayout[newPos.y][newPos.x];
        let newCoins = currentState.coinsCollected;
        let newScore = currentState.score;
        let isWin = false;

        // Collect Coin logic (Mutating layout state in parent for visual update)
        if (charAtPos === 'C') {
             // We need to update the visual layout to remove the coin
             setCurrentLayout(prevLayout => {
                const newLayout = [...prevLayout];
                const row = newLayout[newPos.y].split('');
                row[newPos.x] = '.';
                newLayout[newPos.y] = row.join('');
                return newLayout;
             });
             newCoins++;
             newScore += 50;
        }

        if (charAtPos === 'G') {
            isWin = true;
            newScore += 100 + (Math.max(0, levelData.par - currentState.commands.length) * 10);
        }

        return {
            ...currentState,
            robotPosition: newPos,
            robotDirection: newDir,
            executingCommandIndex: step,
            coinsCollected: newCoins,
            score: newScore,
            isWon: isWin,
            isPlaying: !isWin // Stop playing if won
        };
      });

      // Continue if game is still going
      setGameState(prevState => {
        if (prevState.isPlaying && !prevState.isWon && !prevState.isLost) {
            step++;
            if (step < prevState.commands.length) {
                // setTimeout returns a number in browser environment
                executionTimeoutRef.current = window.setTimeout(executeStep, 600);
            } else {
                 // Finished commands but didn't reach goal
                 return { ...prevState, isPlaying: false, executingCommandIndex: null };
            }
        }
        return prevState;
      });
    };

    // Start first step
    executionTimeoutRef.current = window.setTimeout(executeStep, 100);

  }, [gameState.commands, currentLayout, levelData.par]);

  useEffect(() => {
    return () => {
        if (executionTimeoutRef.current) clearTimeout(executionTimeoutRef.current);
    };
  }, []);


  return (
    <div className="min-h-screen bg-space-900 text-white flex flex-col md:flex-row">
      
      {/* Sidebar / Header */}
      <div className="w-full md:w-80 bg-space-800 p-6 flex flex-col gap-6 border-r border-slate-700 shadow-xl z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent-blue rounded-full flex items-center justify-center text-2xl">🤖</div>
          <h1 className="text-2xl font-bold font-sans tracking-tight">
            RoboLogic <span className="text-accent-blue">Explorer</span>
          </h1>
        </div>

        <div className="bg-slate-700/50 p-4 rounded-xl border border-slate-600">
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-400 text-sm uppercase font-bold">Level {gameState.currentLevel}</span>
            <span className="text-accent-yellow font-bold">🏆 {gameState.score}</span>
          </div>
          <p className="text-sm leading-relaxed italic">"{levelData.story}"</p>
        </div>

        {/* Hint Section */}
        <div className="relative">
            {hint && (
                <div className="bg-accent-purple/20 border border-accent-purple text-purple-200 p-3 rounded-lg text-sm mb-2 animate-pulse">
                    💡 {hint}
                </div>
            )}
            <button 
                onClick={askForHint}
                disabled={loadingHint || gameState.isPlaying}
                className="w-full py-2 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors disabled:opacity-50"
            >
                {loadingHint ? "Sedang berpikir..." : "Minta Petunjuk Robot (AI)"}
            </button>
        </div>

        <ProgramSequence 
          commands={gameState.commands} 
          executingIndex={gameState.executingCommandIndex}
          onRemoveCommand={handleRemoveCommand}
          disabled={gameState.isPlaying || gameState.isWon}
        />
      </div>

      {/* Main Game Area */}
      <div className="flex-1 p-4 md:p-8 flex flex-col items-center justify-start gap-8 bg-space-900 relative overflow-hidden">
        
        {/* Decorative Background Elements */}
        <div className="absolute top-10 right-20 w-32 h-32 bg-accent-blue rounded-full filter blur-[100px] opacity-20 pointer-events-none"></div>
        <div className="absolute bottom-10 left-20 w-40 h-40 bg-accent-purple rounded-full filter blur-[100px] opacity-20 pointer-events-none"></div>

        {/* Game Status Overlay */}
        {(gameState.isWon || gameState.isLost) && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-space-900/80 backdrop-blur-sm">
                <div className="bg-slate-800 p-8 rounded-2xl border-4 border-slate-600 shadow-2xl text-center max-w-sm transform animate-bounce-slow">
                    <div className="text-6xl mb-4">{gameState.isWon ? '🎉' : '💥'}</div>
                    <h2 className="text-3xl font-bold mb-2 text-white">
                        {gameState.isWon ? 'Misi Berhasil!' : 'Robot Rusak!'}
                    </h2>
                    <p className="text-slate-400 mb-6">
                        {gameState.isWon 
                            ? `Kamu hebat! Mengumpulkan ${gameState.coinsCollected} koin.` 
                            : 'Robot menabrak batu atau keluar jalur. Coba lagi!'}
                    </p>
                    <div className="flex gap-4 justify-center">
                        <button 
                            onClick={resetPosition}
                            className="bg-slate-600 hover:bg-slate-500 text-white py-3 px-6 rounded-xl font-bold transition-transform active:scale-95"
                        >
                            Ulangi
                        </button>
                        {gameState.isWon && (
                            <button 
                                onClick={handleNextLevel}
                                disabled={loading}
                                className="bg-accent-green hover:bg-green-400 text-slate-900 py-3 px-6 rounded-xl font-bold transition-transform active:scale-95"
                            >
                                {loading ? 'Memuat...' : 'Level Selanjutnya ➡️'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        )}

        <GridBoard layout={currentLayout} gameState={gameState} />

        {/* Controls */}
        <div className="w-full max-w-2xl flex flex-col md:flex-row gap-8 items-start justify-center">
            
            <div className="flex-1 w-full">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-slate-400 font-bold uppercase text-sm tracking-widest">Panel Kontrol</h3>
                    <div className="flex gap-2">
                         <button 
                            onClick={resetPosition}
                            disabled={gameState.isPlaying}
                            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-semibold text-sm transition-colors"
                        >
                            Reset
                        </button>
                        <button 
                            onClick={runProgram}
                            disabled={gameState.isPlaying || gameState.commands.length === 0}
                            className={`
                                px-6 py-2 rounded-lg font-bold text-slate-900 shadow-lg
                                transition-all transform active:scale-95 flex items-center gap-2
                                ${gameState.isPlaying 
                                    ? 'bg-slate-500 cursor-not-allowed' 
                                    : 'bg-accent-green hover:bg-green-400 hover:shadow-green-500/50'}
                            `}
                        >
                           <span>▶️</span> Jalankan Program
                        </button>
                    </div>
                </div>
                
                <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 backdrop-blur-sm">
                    <CommandPalette 
                        onAddCommand={handleAddCommand} 
                        disabled={gameState.isPlaying || gameState.isWon || gameState.isLost} 
                    />
                </div>
            </div>

            <div className="hidden md:block w-64 text-slate-500 text-sm">
                <h4 className="font-bold text-slate-400 mb-2">Cara Main:</h4>
                <ul className="list-disc pl-4 space-y-1">
                    <li>Gunakan tombol panah untuk membuat jalur.</li>
                    <li>Hindari batu asteroid (X).</li>
                    <li>Ambil bintang (⭐) untuk skor tambahan.</li>
                    <li>Capai roket (🚀) untuk menang!</li>
                    <li>Jika bingung, minta petunjuk Robot AI.</li>
                </ul>
            </div>
        </div>

      </div>
    </div>
  );
};

export default App;