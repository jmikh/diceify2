/**
 * Shared Type Definitions
 * 
 * Central location for all shared types used across the application.
 * This prevents circular dependencies and makes imports cleaner.
 */

import { DiceGrid } from '../dice/types'

// Workflow types
export type WorkflowStep = 'upload' | 'crop' | 'tune' | 'build' | 'export' | 'share'

// Color mode for dice generation
export type ColorMode = 'both' | 'black' | 'white'

// Parameters for dice generation
export interface DiceParams {
  numRows: number  // Number of rows in the dice grid (columns calculated from aspect ratio)
  colorMode: ColorMode
  contrast: number
  gamma: number
  edgeSharpening: number
  rotate6: boolean
  rotate3: boolean
  rotate2: boolean
}

// Statistics about generated dice
export interface DiceStats {
  blackCount: number
  whiteCount: number
  totalCount: number
}

// Re-export dice types for convenience
export type { DiceGrid } from '../dice/types'