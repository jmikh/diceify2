export type DiceFace = 1 | 2 | 3 | 4 | 5 | 6
export type DiceColor = 'black' | 'white'

export interface Dice {
  face: DiceFace
  color: DiceColor
  x: number
  y: number
  rotate90?: boolean
}

export interface DiceGrid {
  dice: Dice[][]
  width: number
  height: number
}

// Grayness values for each dice face (0-255 scale)
// Based on approximate dot coverage area percentage
// Each dot covers ~10% of the dice face area (larger dots for better visibility)
export const DICE_GRAYNESS = {
  black: {
    // Black background with yellow/white dots
    1: 26,   // ~10% white dots = 90% black = 26/255
    2: 51,   // ~20% white dots = 80% black = 51/255
    3: 77,   // ~30% white dots = 70% black = 77/255
    4: 102,  // ~40% white dots = 60% black = 102/255
    5: 128,  // ~50% white dots = 50% black = 128/255
    6: 153,  // ~60% white dots = 40% black = 153/255
  },
  white: {
    // White background with black dots
    1: 230,  // ~10% black dots = 90% white = 230/255
    2: 204,  // ~20% black dots = 80% white = 204/255
    3: 179,  // ~30% black dots = 70% white = 179/255
    4: 153,  // ~40% black dots = 60% white = 153/255
    5: 128,  // ~50% black dots = 50% white = 128/255
    6: 102,  // ~60% black dots = 40% white = 102/255
  }
} as const

// Helper function to get grayness value for a dice
export function getDiceGrayness(color: DiceColor, face: DiceFace): number {
  return DICE_GRAYNESS[color][face]
}