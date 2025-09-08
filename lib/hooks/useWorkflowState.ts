/**
 * useWorkflowState Hook
 * 
 * Manages the workflow state and progression logic.
 * Encapsulates all workflow-related state and transitions.
 */

import { useState } from 'react'
import { WorkflowStep } from '@/lib/types'

export function useWorkflowState() {
  const [step, setStep] = useState<WorkflowStep>('upload')

  const goToStep = (newStep: WorkflowStep) => {
    setStep(newStep)
  }

  const nextStep = () => {
    const steps: WorkflowStep[] = ['upload', 'crop', 'generate', 'build', 'export', 'share']
    const currentIndex = steps.indexOf(step)
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1])
    }
  }

  const previousStep = () => {
    const steps: WorkflowStep[] = ['upload', 'crop', 'generate', 'build', 'export', 'share']
    const currentIndex = steps.indexOf(step)
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1])
    }
  }

  const reset = () => {
    setStep('upload')
  }

  return {
    step,
    setStep,
    goToStep,
    nextStep,
    previousStep,
    reset
  }
}