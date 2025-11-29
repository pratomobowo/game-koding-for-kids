import { GoogleGenAI, Type } from "@google/genai";
import { LevelData } from "../types";

const apiKey = process.env.API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

export const generateLevel = async (difficulty: string, levelNumber: number): Promise<LevelData | null> => {
  if (!apiKey) {
    console.warn("No API Key provided, using fallback levels.");
    return null;
  }

  const prompt = `
    Create a grid-based puzzle level for a coding game for kids (Elementary School).
    Theme: Space Mars Rover.
    Grid Size: 5x5.
    
    Symbols to use in layout:
    'S' = Start Position (There must be exactly one 'S')
    'G' = Goal/End Position (There must be exactly one 'G')
    'X' = Obstacle/Rock
    '.' = Empty Space
    'C' = Coin (Optional bonus, put 1 or 2)

    Difficulty: ${difficulty}.
    The path should be solvable.
    
    Story: A short, fun, encouraging sentence in Indonesian language (Bahasa Indonesia) introducing the mission.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            layout: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Array of 5 strings, each 5 characters long representing the row."
            },
            story: {
              type: Type.STRING,
              description: "The mission briefing in Indonesian."
            },
            par: {
              type: Type.INTEGER,
              description: "The estimated optimal number of moves."
            }
          },
          required: ["layout", "story", "par"]
        }
      }
    });

    const data = JSON.parse(response.text);

    return {
      id: levelNumber,
      gridSize: 5,
      layout: data.layout,
      story: data.story,
      difficulty: difficulty,
      par: data.par
    };

  } catch (error) {
    console.error("Error generating level:", error);
    return null;
  }
};

export const getAIHint = async (layout: string[], currentCommands: string[]): Promise<string> => {
  if (!apiKey) return "Coba periksa langkahmu satu per satu. Kamu pasti bisa!";

  const prompt = `
    The user is playing a coding game.
    Grid Layout (S=Start, G=Goal, X=Obstacle, .=Empty):
    ${JSON.stringify(layout)}
    
    Current User Command Sequence:
    ${JSON.stringify(currentCommands)}
    
    Provide a helpful, encouraging hint in Indonesian (Bahasa Indonesia) for a child.
    Do not give the exact answer, just a nudge in the right direction. 
    Keep it under 20 words.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    return "Tetap semangat! Coba telusuri jalan robotnya lagi.";
  }
};