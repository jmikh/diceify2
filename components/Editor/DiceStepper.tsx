'use client'

import { useEffect, useState } from 'react'
import { WorkflowStep } from '@/lib/types'
import styles from './DiceStepper.module.css'

interface DiceStepperProps {
  currentStep: WorkflowStep
  onStepClick?: (step: WorkflowStep) => void
  hasImage?: boolean
}

const steps: { id: WorkflowStep; dice: string; label: string }[] = [
  { id: 'upload', dice: '⚀', label: 'Upload' },
  { id: 'crop', dice: '⚁', label: 'Crop' },
  { id: 'tune', dice: '⚂', label: 'Tune' },
  { id: 'build', dice: '⚃', label: 'Build' },
  { id: 'export', dice: '⚄', label: 'Export' },
  { id: 'share', dice: '⚅', label: 'Share' },
]

export default function DiceStepper({ currentStep, onStepClick, hasImage }: DiceStepperProps) {
  // Log re-renders
  console.log('DiceStepper re-rendered:', {
    currentStep,
    hasImage
  })
  
  const [justActivated, setJustActivated] = useState<WorkflowStep | null>(null)

  useEffect(() => {
    if (currentStep) {
      setJustActivated(currentStep)
      const timer = setTimeout(() => setJustActivated(null), 600)
      return () => clearTimeout(timer)
    }
  }, [currentStep])

  return (
    <div className="flex items-center justify-center gap-3 px-5 py-2 rounded-full bg-[#0a0014]">
      {steps.map((step) => {
        const isActive = step.id === currentStep
        // Upload is always clickable, other steps require an image
        const isClickable = onStepClick && (step.id === 'upload' || hasImage)
        const isJustActivated = justActivated === step.id

        return (
          <div key={step.id} className="flex items-center">
            <div className="relative">
              {/* Pulse ring for active state */}
              {isActive && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className={`absolute w-full h-full rounded-xl ${styles.pulseRing}`} />
                </div>
              )}

              {/* Dice button */}
              <button
                onClick={() => isClickable && onStepClick?.(step.id)}
                disabled={!isClickable}
                className={`
                  relative w-12 h-12 rounded-lg flex items-center justify-center
                  text-2xl z-10 transition-all
                  ${isActive 
                    ? `${styles.diceActive} ${isJustActivated ? styles.justActivated : ''}`
                    : isClickable
                      ? `${styles.diceInactive} hover:scale-110`
                      : styles.diceInactive
                  }
                  ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}
                `}
              >
                <span className={`
                  ${isActive ? 'text-white/90' : isClickable ? 'text-gray-400' : 'text-gray-600'}
                `}>
                  {step.dice}
                </span>
              </button>
              
              {/* Label */}
              <div className={`
                mt-1 text-xs font-medium text-center transition-colors
                ${isActive ? 'text-blue-400/80' : isClickable ? 'text-gray-500' : 'text-gray-700'}
              `}>
                {step.label}
              </div>
            </div>
            
          </div>
        )
      })}
    </div>
  )
}