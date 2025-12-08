import { useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useEditorStore } from '@/lib/store/useEditorStore'
import { devLog, devError } from '@/lib/utils/debug'

export function usePersistence() {
    const { data: session } = useSession()

    // Store state
    const currentProjectId = useEditorStore(state => state.currentProjectId)
    const originalImage = useEditorStore(state => state.originalImage)
    const croppedImage = useEditorStore(state => state.croppedImage)
    const cropParams = useEditorStore(state => state.cropParams)
    const diceParams = useEditorStore(state => state.diceParams)
    const diceStats = useEditorStore(state => state.diceStats)
    const diceGrid = useEditorStore(state => state.diceGrid)
    const dieSize = useEditorStore(state => state.dieSize)
    const costPer1000 = useEditorStore(state => state.costPer1000)
    const step = useEditorStore(state => state.step)
    const lastReachedStep = useEditorStore(state => state.lastReachedStep)
    const buildProgress = useEditorStore(state => state.buildProgress)

    // Store actions
    const setLastSaved = useEditorStore(state => state.setLastSaved)
    const setIsSaving = useEditorStore(state => state.setIsSaving)
    const setLastReachedStep = useEditorStore(state => state.setLastReachedStep)

    // Keep latest buildProgress in a ref to avoid stale closures
    const buildProgressRef = useRef(buildProgress)
    buildProgressRef.current = buildProgress

    // Save only progress fields (for build step)
    const saveProgressOnly = useCallback(async () => {
        if (!session?.user?.id || !currentProjectId) return

        setIsSaving(true)
        const currentProgress = buildProgressRef.current
        devLog(`[PROGRESS] About to save progress for project ${currentProjectId}`)
        try {
            const response = await fetch(`/api/projects/${currentProjectId}/progress`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentX: currentProgress.x,
                    currentY: currentProgress.y,
                    completedDice: Math.floor((currentProgress.percentage / 100) * diceStats.totalCount),
                    lastReachedStep: 'build'
                })
            })

            if (response.ok) {
                devLog('Progress saved successfully')
                setLastSaved(new Date())
                if (lastReachedStep !== 'build') {
                    setLastReachedStep('build')
                }
                localStorage.removeItem('editorState')
            }
        } catch (error) {
            devError('Failed to save progress:', error)
        } finally {
            setIsSaving(false)
        }
    }, [session, currentProjectId, diceStats.totalCount, lastReachedStep, setIsSaving, setLastSaved, setLastReachedStep])

    // Save upload step data
    const saveUploadStep = useCallback(async (imageToSave?: string) => {
        if (!session?.user?.id || !currentProjectId) return

        const image = imageToSave || originalImage
        devLog(`[UPLOAD] Saving upload data for project ${currentProjectId}`)
        try {
            const response = await fetch(`/api/projects/${currentProjectId}/upload`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    originalImage: image,
                    lastReachedStep
                })
            })

            if (response.ok) {
                devLog('Upload data saved successfully')
                setLastSaved(new Date())
                localStorage.removeItem('editorState')
            }
        } catch (error) {
            devError('Failed to save upload data:', error)
        }
    }, [session, currentProjectId, originalImage, lastReachedStep, setLastSaved])

    // Save crop step data
    const saveCropStep = useCallback(async () => {
        if (!session?.user?.id || !currentProjectId || !cropParams) return

        devLog(`[CROP] Saving crop parameters for project ${currentProjectId}`)
        try {
            const response = await fetch(`/api/projects/${currentProjectId}/crop`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cropX: cropParams.x,
                    cropY: cropParams.y,
                    cropWidth: cropParams.width,
                    cropHeight: cropParams.height,
                    cropRotation: cropParams.rotation,
                    lastReachedStep
                })
            })

            if (response.ok) {
                devLog('Crop data saved successfully')
                setLastSaved(new Date())
                localStorage.removeItem('editorState')
            }
        } catch (error) {
            devError('Failed to save crop data:', error)
        }
    }, [session, currentProjectId, cropParams, lastReachedStep, setLastSaved])

    // Save tune step parameters
    const saveTuneStep = useCallback(async () => {
        if (!session?.user?.id || !currentProjectId) return

        devLog(`[TUNE] Saving tune parameters for project ${currentProjectId}`)
        try {
            const response = await fetch(`/api/projects/${currentProjectId}/tune`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    numRows: diceParams.numRows,
                    colorMode: diceParams.colorMode,
                    contrast: diceParams.contrast,
                    gamma: diceParams.gamma,
                    edgeSharpening: diceParams.edgeSharpening,
                    rotate2: diceParams.rotate2,
                    rotate3: diceParams.rotate3,
                    rotate6: diceParams.rotate6,
                    dieSize,
                    costPer1000,
                    gridWidth: diceGrid?.width || null,
                    gridHeight: diceGrid?.height || null,
                    totalDice: diceStats.totalCount,
                    lastReachedStep: 'build'
                })
            })

            if (response.ok) {
                devLog('Tune parameters saved successfully')
                setLastSaved(new Date())
                localStorage.removeItem('editorState')
            }
        } catch (error) {
            devError('Failed to save tune parameters:', error)
        }
    }, [session, currentProjectId, diceParams, dieSize, costPer1000, diceGrid, diceStats, setLastSaved])

    return {
        saveProgressOnly,
        saveUploadStep,
        saveCropStep,
        saveTuneStep,
        buildProgressRef
    }
}
