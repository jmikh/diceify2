'use client'

import { useEffect, useState, memo } from 'react'
import { WorkflowStep } from '@/lib/types'
import styles from './DiceStepper.module.css'

interface DiceStepperProps {
  currentStep: WorkflowStep
  onStepClick?: (step: WorkflowStep) => void
  hasImage?: boolean
  lastReachedStep?: WorkflowStep
  vertical?: boolean
}

const steps: { id: WorkflowStep; dice: string; label: string }[] = [
  { id: 'upload', dice: '⚀', label: 'Upload' },
  { id: 'crop', dice: '⚁', label: 'Crop' },
  { id: 'tune', dice: '⚂', label: 'Tune' },
  { id: 'build', dice: '⚃', label: 'Build' },
]

const DiceStepper = memo(function DiceStepper({
  currentStep, onStepClick, hasImage, lastReachedStep, vertical = false }: DiceStepperProps) {
  const [justActivated, setJustActivated] = useState<WorkflowStep | null>(null)

  useEffect(() => {
    if (currentStep) {
      setJustActivated(currentStep)
      const timer = setTimeout(() => setJustActivated(null), 600)
      return () => clearTimeout(timer)
    }
  }, [currentStep])

  return (
    <div className={`flex ${vertical ? 'flex-col' : 'items-center'} justify-center gap-3 ${vertical ? 'py-5 px-2' : 'px-5 py-2'}`}>
      {steps.map((step, index) => {
        const isActive = step.id === currentStep
        
        // Determine if step is clickable based on lastReachedStep
        const stepOrder: WorkflowStep[] = ['upload', 'crop', 'tune', 'build']
        const currentIndex = stepOrder.indexOf(step.id)
        const lastReachedIndex = lastReachedStep ? stepOrder.indexOf(lastReachedStep) : -1
        
        // Step is clickable if:
        // 1. It's upload (always clickable)
        // 2. It's a previously reached step (currentIndex <= lastReachedIndex)
        // 3. It's the immediate next step (currentIndex === lastReachedIndex + 1)
        const isClickable = onStepClick && (
          step.id === 'upload' || 
          (hasImage && currentIndex <= lastReachedIndex + 1)
        )
        
        const isJustActivated = justActivated === step.id
        const isFutureStep = currentIndex > lastReachedIndex + 1

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
                  ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-30'}
                `}
              >
                <span 
                className={`
                  ${isActive ? 'text-white/90' : isClickable ? 'text-gray-400' : 'text-gray-600/50'}
                `}
                style={{
                  display: 'inline-block',
                  transform: (step.id === 'crop' || step.id === 'tune') ? 'rotate(90deg)' : 'none'
                }}
              >
                  {step.dice}
                </span>
              </button>
              
              {/* Label */}
              <div className={`
                mt-1 text-xs font-medium text-center transition-colors
                ${isActive ? 'text-blue-400/80' : isClickable ? 'text-gray-500' : 'text-gray-600/50'}
              `}>
                {step.label}
              </div>
            </div>
            
          </div>
        )
      })}
    </div>
  )
})

export default DiceStepper