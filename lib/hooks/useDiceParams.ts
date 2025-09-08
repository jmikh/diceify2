/**
 * useDiceParams Hook
 * 
 * Manages dice generation parameters and statistics.
 * Includes both the configuration and the results.
 */

import { useState } from 'react'
import { DiceParams, DiceStats, DiceGrid } from '@/lib/types'

const DEFAULT_PARAMS: DiceParams = {
  numRows: 30,
  colorMode: 'both',
  contrast: 0,
  gamma: 1,
  edgeSharpening: 0,
  rotate6: false,
  rotate3: false,
  rotate2: false
}

const DEFAULT_STATS: DiceStats = {
  blackCount: 0,
  whiteCount: 0,
  totalCount: 0
}

export function useDiceParams() {
  const [diceParams, setDiceParams] = useState<DiceParams>(DEFAULT_PARAMS)
  const [diceStats, setDiceStats] = useState<DiceStats>(DEFAULT_STATS)
  const [diceGrid, setDiceGrid] = useState<DiceGrid | null>(null)
  const [dieSize, setDieSize] = useState(16) // mm
  const [costPer1000, setCostPer1000] = useState(60) // dollars

  const updateParams = (params: Partial<DiceParams>) => {
    setDiceParams(prev => ({ ...prev, ...params }))
  }

  const updateStats = (stats: DiceStats) => {
    setDiceStats(stats)
  }

  const updateGrid = (grid: DiceGrid) => {
    setDiceGrid(grid)
  }

  const reset = () => {
    setDiceParams(DEFAULT_PARAMS)
    setDiceStats(DEFAULT_STATS)
    setDiceGrid(null)
  }

  return {
    diceParams,
    diceStats,
    diceGrid,
    dieSize,
    costPer1000,
    setDieSize,
    setCostPer1000,
    updateParams,
    updateStats,
    updateGrid,
    reset
  }
}