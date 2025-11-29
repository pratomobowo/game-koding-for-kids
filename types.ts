export type CellType = 'EMPTY' | 'OBSTACLE' | 'START' | 'GOAL' | 'COIN';

export enum CommandType {
  UP = 'UP',
  DOWN = 'DOWN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

export interface GridPosition {
  x: number;
  y: number;
}

export interface LevelData {
  id: number;
  gridSize: number;
  layout: string[]; // Array of strings representing rows, e.g., "S..XG"
  story: string;
  difficulty: string;
  par: number; // Optimal number of moves
}

export interface GameState {
  currentLevel: number;
  score: number;
  isPlaying: boolean;
  isWon: boolean;
  isLost: boolean;
  robotPosition: GridPosition;
  robotDirection: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
  commands: CommandType[];
  executingCommandIndex: number | null;
  coinsCollected: number;
  totalCoins: number;
}