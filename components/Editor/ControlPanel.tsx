/**
 * ControlPanel Component
 * 
 * Parameter control interface for the dice art generation.
 * Think of this as the configuration panel that lets users fine-tune
 * how their image gets converted into dice art.
 * 
 * Controls provided:
 * - Grid Size: Number of dice per row (10-100)
 * - Color Mode: Black & White, Black Only, or White Only
 * - Contrast: Increases contrast (0-100, additive only)
 * - Rotation: 90° rotation for individual dice
 * - Die Size: Physical size in mm for real-world building
 * - Cost: Price calculation based on die cost
 * 
 * All parameters update in real-time and trigger re-rendering of the dice canvas.
 * The component uses controlled inputs with onChange callbacks to the parent.
 * 
 * Technical notes:
 * - Sliders use HTML5 range inputs with custom styling
 * - Color mode uses visual squares instead of dropdown for better UX
 * - Die size and cost inputs include units inside the field
 * - All inputs are debounced internally to prevent excessive re-renders
 */

'use client'

import { DiceParams, ColorMode } from '@/lib/types'
import { theme } from '@/lib/theme'
import { useState } from 'react'
import { Grid3x3, Contrast, Sun, Sparkles, RotateCw } from 'lucide-react'

interface ControlPanelProps {
  params: DiceParams
  onParamChange: (params: Partial<DiceParams>) => void
}

export default function ControlPanel({ params, onParamChange }: ControlPanelProps) {
  // Initialize rotations based on current params - default to 90 degrees
  const getInitialRotation = (isRotated: boolean) => isRotated ? 0 : 90
  
  // Track rotation angles for animation (cumulative rotation)
  const [rotations, setRotations] = useState({ 
    dice2: getInitialRotation(params.rotate2), 
    dice3: getInitialRotation(params.rotate3), 
    dice6: getInitialRotation(params.rotate6) 
  })
  
  // Track which sliders are being dragged
  const [isDragging, setIsDragging] = useState({
    numRows: false,
    contrast: false,
    gamma: false,
    edgeSharpening: false
  })

  const handleNumRowsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onParamChange({ numRows: parseInt(e.target.value) })
  }

  const handleContrastChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onParamChange({ contrast: parseInt(e.target.value) })
  }

  const handleGammaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onParamChange({ gamma: parseFloat(e.target.value) })
  }

  const handleEdgeSharpeningChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onParamChange({ edgeSharpening: parseInt(e.target.value) })
  }

  const handleDiceRotation = (dice: 2 | 3 | 6) => {
    // Increment rotation angle for visual animation
    setRotations(prev => ({
      ...prev,
      [`dice${dice}`]: prev[`dice${dice}`] + 90
    }))
    
    // Toggle the rotation state
    if (dice === 2) {
      onParamChange({ rotate2: !params.rotate2 })
    } else if (dice === 3) {
      onParamChange({ rotate3: !params.rotate3 })
    } else if (dice === 6) {
      onParamChange({ rotate6: !params.rotate6 })
    }
  }

  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold mb-3" style={{ color: theme.colors.text.primary }}>
        Controls
      </h3>
      
      <div className="space-y-4">
        {/* Grid Size */}
        <div className="group relative">
          <div className="flex items-center gap-2">
            <Grid3x3 size={16} style={{ color: theme.colors.text.secondary, flexShrink: 0 }} />
            <input
              type="range"
              id="numRows"
              min="20"
              max="120"
              value={params.numRows}
              onChange={handleNumRowsChange}
              onMouseDown={() => setIsDragging({ ...isDragging, numRows: true })}
              onMouseUp={() => setIsDragging({ ...isDragging, numRows: false })}
              onTouchStart={() => setIsDragging({ ...isDragging, numRows: true })}
              onTouchEnd={() => setIsDragging({ ...isDragging, numRows: false })}
              className="flex-1 h-1 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, ${theme.colors.accent.blue} 0%, ${theme.colors.accent.blue} ${((params.numRows - 20) / 100) * 100}%, ${theme.colors.glass.border} ${((params.numRows - 20) / 100) * 100}%, ${theme.colors.glass.border} 100%)`
              }}
            />
          </div>
          {/* Tooltip positioned above slider thumb */}
          <div 
            className="absolute -top-8 px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap"
            style={{
              left: `calc(24px + ${((params.numRows - 20) / 100) * 85}%)`,
              transform: 'translateX(-50%)',
              backgroundColor: 'rgba(10, 0, 20, 0.95)',
              color: 'white'
            }}
          >
            {isDragging.numRows ? params.numRows : 'Rows'}
          </div>
        </div>

        {/* Color Mode */}
        <div>
          <div 
            className="flex rounded-lg overflow-hidden border"
            style={{ 
              backgroundColor: theme.colors.glass.light,
              borderColor: theme.colors.glass.border
            }}
          >
            {/* Black & White */}
            <button
              onClick={() => onParamChange({ colorMode: 'both' })}
              className="flex-1 h-10 flex items-center justify-center transition-all relative"
              style={{ 
                backgroundColor: params.colorMode === 'both' ? theme.colors.accent.blue : 'transparent',
                borderRight: `1px solid ${theme.colors.glass.border}`
              }}
            >
              {/* Diagonally split square */}
              <svg width="20" height="20" viewBox="0 0 20 20">
                <path d="M0 0 L20 20 L20 0 Z" fill="white" />
                <path d="M0 0 L0 20 L20 20 Z" fill="black" />
              </svg>
            </button>
            
            {/* Black Only */}
            <button
              onClick={() => onParamChange({ colorMode: 'black' })}
              className="flex-1 h-10 flex items-center justify-center transition-all relative"
              style={{ 
                backgroundColor: params.colorMode === 'black' ? theme.colors.accent.blue : 'transparent',
                borderRight: `1px solid ${theme.colors.glass.border}`
              }}
            >
              {/* Black square */}
              <div className="w-5 h-5 rounded-sm" style={{ backgroundColor: 'black' }} />
            </button>
            
            {/* White Only */}
            <button
              onClick={() => onParamChange({ colorMode: 'white' })}
              className="flex-1 h-10 flex items-center justify-center transition-all relative"
              style={{ 
                backgroundColor: params.colorMode === 'white' ? theme.colors.accent.blue : 'transparent'
              }}
            >
              {/* White square */}
              <div className="w-5 h-5 rounded-sm border" style={{ backgroundColor: 'white', borderColor: theme.colors.glass.border }} />
            </button>
          </div>
        </div>

        {/* Contrast */}
        <div className="group relative">
          <div className="flex items-center gap-2">
            <Contrast size={16} style={{ color: theme.colors.text.secondary, flexShrink: 0 }} />
            <input
              type="range"
              id="contrast"
              min="0"
              max="100"
              value={params.contrast}
              onChange={handleContrastChange}
              onMouseDown={() => setIsDragging({ ...isDragging, contrast: true })}
              onMouseUp={() => setIsDragging({ ...isDragging, contrast: false })}
              onTouchStart={() => setIsDragging({ ...isDragging, contrast: true })}
              onTouchEnd={() => setIsDragging({ ...isDragging, contrast: false })}
              className="flex-1 h-1 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, ${theme.colors.accent.blue} 0%, ${theme.colors.accent.blue} ${params.contrast}%, ${theme.colors.glass.border} ${params.contrast}%, ${theme.colors.glass.border} 100%)`
              }}
            />
          </div>
          {/* Tooltip positioned above slider thumb */}
          <div 
            className="absolute -top-8 px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap"
            style={{
              left: `calc(24px + ${(params.contrast / 100) * 85}%)`,
              transform: 'translateX(-50%)',
              backgroundColor: 'rgba(10, 0, 20, 0.95)',
              color: 'white'
            }}
          >
            {isDragging.contrast ? params.contrast : 'Contrast'}
          </div>
        </div>

        {/* Brightness (Gamma) */}
        <div className="group relative">
          <div className="flex items-center gap-2">
            <Sun size={16} style={{ color: theme.colors.text.secondary, flexShrink: 0 }} />
            <input
              type="range"
              id="gamma"
              min="0.5"
              max="1.5"
              step="0.01"
              value={params.gamma}
              onChange={handleGammaChange}
              onMouseDown={() => setIsDragging({ ...isDragging, gamma: true })}
              onMouseUp={() => setIsDragging({ ...isDragging, gamma: false })}
              onTouchStart={() => setIsDragging({ ...isDragging, gamma: true })}
              onTouchEnd={() => setIsDragging({ ...isDragging, gamma: false })}
              className="flex-1 h-1 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, ${theme.colors.accent.blue} 0%, ${theme.colors.accent.blue} ${((params.gamma - 0.5) / 1.0) * 100}%, ${theme.colors.glass.border} ${((params.gamma - 0.5) / 1.0) * 100}%, ${theme.colors.glass.border} 100%)`
              }}
            />
          </div>
          {/* Tooltip positioned above slider thumb */}
          <div 
            className="absolute -top-8 px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap"
            style={{
              left: `calc(24px + ${((params.gamma - 0.5) / 1.0) * 85}%)`,
              transform: 'translateX(-50%)',
              backgroundColor: 'rgba(10, 0, 20, 0.95)',
              color: 'white'
            }}
          >
            {isDragging.gamma ? `${((params.gamma - 1.0) * 100).toFixed(0)}%` : 'Brightness'}
          </div>
        </div>

        {/* Edge Sharpening */}
        <div className="group relative">
          <div className="flex items-center gap-2">
            <Sparkles size={16} style={{ color: theme.colors.text.secondary, flexShrink: 0 }} />
            <input
              type="range"
              id="edgeSharpening"
              min="0"
              max="100"
              value={params.edgeSharpening}
              onChange={handleEdgeSharpeningChange}
              onMouseDown={() => setIsDragging({ ...isDragging, edgeSharpening: true })}
              onMouseUp={() => setIsDragging({ ...isDragging, edgeSharpening: false })}
              onTouchStart={() => setIsDragging({ ...isDragging, edgeSharpening: true })}
              onTouchEnd={() => setIsDragging({ ...isDragging, edgeSharpening: false })}
              className="flex-1 h-1 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, ${theme.colors.accent.blue} 0%, ${theme.colors.accent.blue} ${params.edgeSharpening}%, ${theme.colors.glass.border} ${params.edgeSharpening}%, ${theme.colors.glass.border} 100%)`
              }}
            />
          </div>
          {/* Tooltip positioned above slider thumb */}
          <div 
            className="absolute -top-8 px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap"
            style={{
              left: `calc(24px + ${(params.edgeSharpening / 100) * 85}%)`,
              transform: 'translateX(-50%)',
              backgroundColor: 'rgba(10, 0, 20, 0.95)',
              color: 'white'
            }}
          >
            {isDragging.edgeSharpening ? params.edgeSharpening : 'Sharpening'}
          </div>
        </div>

        {/* Dice Rotation - Unified Panel */}
        <div className="flex items-center gap-2">
          <RotateCw size={16} style={{ color: theme.colors.text.secondary, flexShrink: 0 }} />
          
          <div 
            className="flex flex-1 rounded-lg overflow-hidden border"
            style={{ 
              backgroundColor: theme.colors.glass.light,
              borderColor: theme.colors.glass.border
            }}
          >
            {/* Dice 2 */}
            <button
              onClick={() => handleDiceRotation(2)}
              className="flex-1 h-10 flex items-center justify-center transition-all hover:bg-white/10 relative group"
              style={{ 
                borderRight: `1px solid ${theme.colors.glass.border}`
              }}
            >
              <span 
                className="text-2xl inline-block transition-transform"
                style={{ 
                  transform: `rotate(${rotations.dice2}deg)`,
                  transformOrigin: 'center',
                  transition: 'transform 0.3s ease',
                  color: theme.colors.text.secondary
                }}
              >
                ⚁
              </span>
              {/* Hover indicator */}
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{ 
                  background: `radial-gradient(circle at center, ${theme.colors.glow.blue}, transparent)`
                }}
              />
            </button>
            
            {/* Dice 3 */}
            <button
              onClick={() => handleDiceRotation(3)}
              className="flex-1 h-10 flex items-center justify-center transition-all hover:bg-white/10 relative group"
              style={{ 
                borderRight: `1px solid ${theme.colors.glass.border}`
              }}
            >
              <span 
                className="text-2xl inline-block transition-transform"
                style={{ 
                  transform: `rotate(${rotations.dice3}deg)`,
                  transformOrigin: 'center',
                  transition: 'transform 0.3s ease',
                  color: theme.colors.text.secondary
                }}
              >
                ⚂
              </span>
              {/* Hover indicator */}
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{ 
                  background: `radial-gradient(circle at center, ${theme.colors.glow.blue}, transparent)`
                }}
              />
            </button>
            
            {/* Dice 6 */}
            <button
              onClick={() => handleDiceRotation(6)}
              className="flex-1 h-10 flex items-center justify-center transition-all hover:bg-white/10 relative group"
            >
              <span 
                className="text-2xl inline-block transition-transform"
                style={{ 
                  transform: `rotate(${rotations.dice6}deg)`,
                  transformOrigin: 'center',
                  transition: 'transform 0.3s ease',
                  color: theme.colors.text.secondary
                }}
              >
                ⚅
              </span>
              {/* Hover indicator */}
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{ 
                  background: `radial-gradient(circle at center, ${theme.colors.glow.blue}, transparent)`
                }}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}