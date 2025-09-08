'use client'

import { useState, useEffect } from 'react'
import styles from './DiceStepper.module.css'

export interface DiceStepperProps {
  steps?: number
  currentStep?: number
  orientation?: 'horizontal' | 'vertical'
  labels?: string[]
  onStepClick?: (step: number) => void
  className?: string
}

const diceIcons = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅']

export default function DiceStepper({
  steps = 6,
  currentStep: externalCurrentStep,
  orientation = 'horizontal',
  labels,
  onStepClick,
  className = ''
}: DiceStepperProps) {
  const [currentStep, setCurrentStep] = useState(externalCurrentStep ?? 1)
  const [previousStep, setPreviousStep] = useState(currentStep)
  const [justActivated, setJustActivated] = useState<number | null>(null)
  const [spinningOut, setSpinningOut] = useState<Set<number>>(new Set())
  const [spinningIn, setSpinningIn] = useState<Set<number>>(new Set())
  const [targetStep, setTargetStep] = useState<number | null>(null)

  useEffect(() => {
    if (externalCurrentStep !== undefined && externalCurrentStep !== currentStep) {
      const oldStep = currentStep
      const newStep = externalCurrentStep
      
      // If going backwards (e.g., from step 5 to step 1)
      if (newStep < oldStep) {
        // Create cascade effect for steps spinning out
        const stepsToSpinOut = new Set<number>()
        const delays: { step: number; delay: number }[] = []
        
        // Collect all steps that need to spin out (from current down to just after target)
        for (let i = oldStep; i > newStep; i--) {
          stepsToSpinOut.add(i)
          // Calculate delay - steps spin out in sequence from highest to lowest
          delays.push({ step: i, delay: (oldStep - i) * 100 })
        }
        
        // Apply spin out animation with delays
        delays.forEach(({ step, delay }) => {
          setTimeout(() => {
            setSpinningOut(prev => new Set(prev).add(step))
          }, delay)
        })
        
        // Clear spinning out state after all animations complete
        const totalDelay = delays.length * 100 + 600 // 600ms for animation duration
        setTimeout(() => {
          setSpinningOut(new Set())
        }, totalDelay)
      }
      // If going forward and skipping steps (e.g., from step 1 to step 5)
      else if (newStep > oldStep + 1) {
        // Create cascade effect for steps spinning in
        const delays: { step: number; delay: number }[] = []
        
        // Collect all steps that need to spin in (from just after current to target)
        for (let i = oldStep + 1; i <= newStep; i++) {
          // Calculate delay - steps spin in sequence from lowest to highest
          delays.push({ step: i, delay: (i - oldStep - 1) * 100 })
        }
        
        // Apply spin in animation with delays
        delays.forEach(({ step, delay }) => {
          setTimeout(() => {
            setSpinningIn(prev => new Set(prev).add(step))
            // Remove from spinning after animation completes
            setTimeout(() => {
              setSpinningIn(prev => {
                const newSet = new Set(prev)
                newSet.delete(step)
                return newSet
              })
            }, 600)
          }, delay)
        })
      }
      
      setPreviousStep(oldStep)
      setCurrentStep(newStep)
      setJustActivated(newStep)
      
      const timer = setTimeout(() => setJustActivated(null), 600)
      return () => clearTimeout(timer)
    }
  }, [externalCurrentStep, currentStep])

  const handleStepClick = (step: number) => {
    if (step === currentStep) return // Clicking current step does nothing
    
    if (step < currentStep) {
      // Going backwards - create cascade effect for steps spinning out
      const delays: { step: number; delay: number }[] = []
      
      // Collect all steps that need to spin out
      for (let i = currentStep; i > step; i--) {
        delays.push({ step: i, delay: (currentStep - i) * 100 })
      }
      
      // Apply spin out animation with delays
      delays.forEach(({ step: stepNum, delay }) => {
        setTimeout(() => {
          setSpinningOut(prev => new Set(prev).add(stepNum))
        }, delay)
      })
      
      // Update current step after animations start
      const updateDelay = delays.length * 100
      setTimeout(() => {
        setCurrentStep(step)
        setJustActivated(step)
        onStepClick?.(step)
      }, updateDelay)
      
      // Clear spinning out state after all animations complete
      const totalDelay = delays.length * 100 + 600
      setTimeout(() => {
        setSpinningOut(new Set())
        setJustActivated(null)
      }, totalDelay)
    } else {
      // Going forward - always use cascade even for adjacent steps
      const delays: { step: number; delay: number }[] = []
      
      // Set target step so we know where we're going
      setTargetStep(step)
      
      // Collect all steps that need to spin in (including target)
      for (let i = currentStep + 1; i <= step; i++) {
        delays.push({ step: i, delay: (i - currentStep - 1) * 100 })
      }
      
      // Apply spin in animation with delays
      delays.forEach(({ step: stepNum, delay }) => {
        setTimeout(() => {
          if (stepNum === step) {
            // When cascade reaches target, update current step and activate
            setCurrentStep(step)
            setJustActivated(step)
            setTargetStep(null)
            onStepClick?.(step)
          } else {
            // For intermediate steps, spin them in
            setSpinningIn(prev => new Set(prev).add(stepNum))
            // Remove from spinning after animation completes
            setTimeout(() => {
              setSpinningIn(prev => {
                const newSet = new Set(prev)
                newSet.delete(stepNum)
                return newSet
              })
            }, 600)
          }
        }, delay)
      })
      
      // Clear just activated state after target animation completes
      const targetDelay = delays[delays.length - 1].delay
      setTimeout(() => {
        setJustActivated(null)
      }, targetDelay + 600)
    }
  }

  const stepsArray = Array.from({ length: Math.min(steps, 6) }, (_, i) => i + 1)

  return (
    <div 
      className={`
        ${styles.container}
        ${orientation === 'vertical' ? styles.vertical : styles.horizontal}
        ${className}
      `}
    >
      {stepsArray.map((step, index) => {
        const isActive = step === currentStep
        const isPrevious = step < currentStep || (targetStep !== null && step < targetStep)
        const isJustActivated = justActivated === step
        const isSpinningOut = spinningOut.has(step)
        const isSpinningIn = spinningIn.has(step)

        return (
          <div key={step} className={styles.stepWrapper}>
            <div className={styles.stepContainer}>
              {/* Pulse ring for active state */}
              {isActive && !isSpinningOut && !isSpinningIn && (
                <div className={styles.pulseContainer}>
                  <div className={styles.pulseRing} />
                </div>
              )}

              {/* Dice button */}
              <button
                onClick={() => handleStepClick(step)}
                className={`
                  ${styles.dice}
                  ${isSpinningOut
                    ? styles.spinningOut
                    : isSpinningIn
                    ? styles.spinningIn
                    : isActive 
                    ? `${styles.diceActive} ${isJustActivated ? styles.justActivated : ''}`
                    : isPrevious
                    ? styles.dicePrevious
                    : styles.diceInactive
                  }
                `}
                aria-label={`Step ${step}${labels?.[index] ? `: ${labels[index]}` : ''}`}
              >
                <span className={styles.diceIcon}>
                  {diceIcons[index]}
                </span>
              </button>
              
              {/* Label */}
              {labels?.[index] && (
                <div className={`
                  ${styles.label}
                  ${isSpinningOut || isSpinningIn
                    ? styles.labelInactive
                    : isActive 
                    ? styles.labelActive 
                    : isPrevious 
                    ? styles.labelPrevious 
                    : styles.labelInactive
                  }
                `}>
                  {labels[index]}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}