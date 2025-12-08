import { useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useEditorStore } from '@/lib/store/useEditorStore'
import { devLog } from '@/lib/utils/debug'
import { WorkflowStep } from '@/lib/types'
import { usePersistence } from './usePersistence'

export function useWorkflow() {
    const { data: session, status } = useSession()
    const { saveCropStep, saveTuneStep, saveProgressOnly, buildProgressRef } = usePersistence()

    // Store state
    const step = useEditorStore(state => state.step)
    const lastReachedStep = useEditorStore(state => state.lastReachedStep)
    const currentProjectId = useEditorStore(state => state.currentProjectId)
    const cropParams = useEditorStore(state => state.cropParams)
    const buildProgress = useEditorStore(state => state.buildProgress)

    // Store actions
    const setStep = useEditorStore(state => state.setStep)
    const setLastReachedStep = useEditorStore(state => state.setLastReachedStep)
    const setHasCropChanged = (changed: boolean) => { /* handled internally in page for now, but could be moved to store */ }
    const setHasTuneChanged = (changed: boolean) => { /* handled internally in page for now */ }

    // Local state for navigation confirmation
    const [showBuildProgressDialog, setShowBuildProgressDialog] = useState(false)
    const [attemptedStep, setAttemptedStep] = useState<WorkflowStep | null>(null)

    // These are passed in from page.tsx for now as they are local state there
    // Ideally these would be in the store or this hook would manage them
    const [hasCropChanged, setLocalHasCropChanged] = useState(false)
    const [hasTuneChanged, setLocalHasTuneChanged] = useState(false)

    // Compute if we should warn when exiting build step
    const shouldWarnOnExit = step === 'build' && (buildProgress.x !== 0 || buildProgress.y !== 0)

    // Helper function to navigate to a step
    const navigateToStep = useCallback(async (newStep: WorkflowStep) => {
        devLog(`[CLIENT] navigateToStep called: ${step} -> ${newStep}`)
        const steps: WorkflowStep[] = ['upload', 'crop', 'tune', 'build']
        const newIndex = steps.indexOf(newStep)
        const lastReachedIndex = steps.indexOf(lastReachedStep)

        // Allow navigation to any previous step or the next step after lastReachedStep
        if (newIndex <= lastReachedIndex + 1) {
            // Save on specific transitions
            if (step === 'crop' && newStep === 'tune' && cropParams && hasCropChanged) {
                devLog('[CLIENT] Moving from crop to tune, saving crop parameters')
                if (currentProjectId && session?.user?.id) {
                    await saveCropStep()
                    setLocalHasCropChanged(false)
                }
            }

            if (step === 'tune' && newStep === 'build' && hasTuneChanged) {
                devLog('[CLIENT] Moving from tune to build, saving tune parameters')
                if (currentProjectId && session?.user?.id) {
                    await saveTuneStep()
                    setLocalHasTuneChanged(false)
                }
            }

            if (step === 'build' && newStep !== 'build' && currentProjectId && session?.user?.id) {
                const currentProgress = buildProgressRef.current
                if (currentProgress.x > 0 || currentProgress.y > 0) {
                    devLog('[CLIENT] Leaving build step, saving progress')
                    await saveProgressOnly()
                }
            }

            setStep(newStep)

            if (newStep === 'crop') {
                setLocalHasCropChanged(false)
            } else if (newStep === 'tune') {
                setLocalHasTuneChanged(false)
            }

            if (newIndex > lastReachedIndex) {
                setLastReachedStep(newStep)
            }
        }
    }, [step, lastReachedStep, cropParams, currentProjectId, session, saveCropStep, saveTuneStep, saveProgressOnly, hasCropChanged, hasTuneChanged, setStep, setLastReachedStep, buildProgressRef])

    // Handle navigation with build progress check
    const handleStepNavigation = useCallback((newStep: WorkflowStep) => {
        devLog(`[CLIENT] handleStepNavigation called: ${newStep}`)

        if (newStep === 'build' && status !== 'authenticated') {
            sessionStorage.setItem('intendedStepAfterLogin', 'build')
            setStep('build')
            setLastReachedStep('build')
            return
        }

        if (shouldWarnOnExit && newStep !== 'build') {
            setAttemptedStep(newStep)
            setShowBuildProgressDialog(true)
        } else {
            navigateToStep(newStep)
        }
    }, [shouldWarnOnExit, status, navigateToStep, setStep, setLastReachedStep])

    const handleContinueToStep = useCallback(() => {
        setShowBuildProgressDialog(false)
        if (attemptedStep) {
            setStep(attemptedStep)
            setAttemptedStep(null)
        }
    }, [attemptedStep, setStep])

    const handleStayInBuild = useCallback(() => {
        setShowBuildProgressDialog(false)
        setAttemptedStep(null)
    }, [])

    const handleStepperClick = useCallback((clickedStep: WorkflowStep) => {
        handleStepNavigation(clickedStep)
    }, [handleStepNavigation])

    return {
        navigateToStep,
        handleStepNavigation,
        handleContinueToStep,
        handleStayInBuild,
        handleStepperClick,
        showBuildProgressDialog,
        setShowBuildProgressDialog,
        attemptedStep,
        setAttemptedStep,
        hasCropChanged,
        setHasCropChanged: setLocalHasCropChanged,
        hasTuneChanged,
        setHasTuneChanged: setLocalHasTuneChanged
    }
}
