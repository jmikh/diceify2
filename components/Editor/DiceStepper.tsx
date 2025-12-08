'use client'

import { useEffect, useState, memo } from 'react'
import { WorkflowStep } from '@/lib/types'
import styles from './DiceStepper.module.css'
import { useEditorStore } from '@/lib/store/useEditorStore'

interface DiceStepperProps {
  vertical?: boolean
}

const steps: { id: WorkflowStep; dice: string; label: string }[] = [
  { id: 'upload', dice: '⚀', label: 'Image' },
  { id: 'tune', dice: '⚁', label: 'Tune' },
  { id: 'build', dice: '⚂', label: 'Build' },
]

const DiceStepper = memo(function DiceStepper({ vertical = false }: DiceStepperProps) {
  const step = useEditorStore(state => state.step)
  const setStep = useEditorStore(state => state.setStep)
  const lastReachedStep = useEditorStore(state => state.lastReachedStep)
  const originalImage = useEditorStore(state => state.originalImage)

  const [justActivated, setJustActivated] = useState<WorkflowStep | null>(null)

  useEffect(() => {
    if (step) {
      setJustActivated(step)
      const timer = setTimeout(() => setJustActivated(null), 600)
      return () => clearTimeout(timer)
    }
  }, [step])

  return (
    <div className={`flex ${vertical ? 'flex-col' : 'items-center'} justify-center gap-3 ${vertical ? 'py-5 px-2' : 'px-5 py-2'}`}>
      {steps.map((s, index) => {
        const isActive = s.id === step

        // Determine if step is clickable based on lastReachedStep
        const stepOrder: WorkflowStep[] = ['upload', 'tune', 'build']
        const currentIndex = stepOrder.indexOf(s.id)
        const lastReachedIndex = lastReachedStep ? stepOrder.indexOf(lastReachedStep) : -1

        // Step is clickable if:
        // 1. It's upload (always clickable)
        // 2. It's a previously reached step (currentIndex <= lastReachedIndex)
        // 3. It's the immediate next step (currentIndex === lastReachedIndex + 1)
        const isClickable =
          s.id === 'upload' ||
          (!!originalImage && currentIndex <= lastReachedIndex + 1)

        const isJustActivated = justActivated === s.id

        return (
          <div key={s.id} className="flex items-center">
            <div className="relative">
              {/* Pulse ring for active state */}
              {isActive && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className={`absolute w-full h-full rounded-xl ${styles.pulseRing}`} />
                </div>
              )}

              {/* Dice button */}
              <button
                onClick={() => isClickable && setStep(s.id)}
                disabled={!isClickable}
                data-testid={`step-${s.id}`}
                data-active={isActive}
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
                    transform: (s.id === 'tune') ? 'rotate(90deg)' : 'none'
                  }}
                >
                  {s.dice}
                </span>
              </button>

              {/* Label */}
              <div className={`
                 mt-1 text-xs font-medium text-center transition-colors
                 ${isActive ? 'text-pink-400/80' : isClickable ? 'text-gray-500' : 'text-gray-600/50'}
               `}>
                {s.label}
              </div>
            </div>

          </div>
        )
      })}
    </div>
  )
})

export default DiceStepper