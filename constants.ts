import { LevelData } from "./types";

export const GRID_SIZE = 5;

// Fallback levels in case API fails or for tutorial
export const INITIAL_LEVELS: LevelData[] = [
  {
    id: 1,
    gridSize: 5,
    layout: [
      "S....",
      ".XXX.",
      "....C",
      ".XXX.",
      "....G"
    ],
    story: "Selamat datang, Kadet! Robot kita, Robo, perlu mencapai pangkalan (G) untuk mengisi daya. Hati-hati dengan batu meteor (X) dan ambil koin (C)!",
    difficulty: "Easy",
    par: 8
  },
  {
    id: 2,
    gridSize: 5,
    layout: [
      "S.X..",
      "..X.C",
      ".X..X",
      "C...X",
      ".X.G."
    ],
    story: "Misi kedua: Jalur asteroid! Gunakan logikamu untuk menemukan jalan teraman.",
    difficulty: "Medium",
    par: 10
  }
];

export const COMMAND_ICONS: Record<string, string> = {
  UP: "⬆️",
  DOWN: "⬇️",
  LEFT: "⬅️",
  RIGHT: "➡️",
};

export const COMMAND_COLORS: Record<string, string> = {
  UP: "bg-accent-blue border-b-4 border-blue-600 hover:border-blue-500",
  DOWN: "bg-accent-blue border-b-4 border-blue-600 hover:border-blue-500",
  LEFT: "bg-accent-purple border-b-4 border-purple-600 hover:border-purple-500",
  RIGHT: "bg-accent-purple border-b-4 border-purple-600 hover:border-purple-500",
};