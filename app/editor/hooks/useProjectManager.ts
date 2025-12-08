import { useState, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEditorStore } from '@/lib/store/useEditorStore'
import { devLog, devError } from '@/lib/utils/debug'
import { WorkflowStep, DiceParams, DiceGrid, DiceStats } from '@/lib/types'

export function useProjectManager() {
    const { data: session } = useSession()
    const router = useRouter()

    // Store state
    const currentProjectId = useEditorStore(state => state.currentProjectId)
    const originalImage = useEditorStore(state => state.originalImage)
    const croppedImage = useEditorStore(state => state.croppedImage)
    const processedImageUrl = useEditorStore(state => state.processedImageUrl)
    const cropParams = useEditorStore(state => state.cropParams)
    const diceParams = useEditorStore(state => state.diceParams)
    const diceStats = useEditorStore(state => state.diceStats)
    const diceGrid = useEditorStore(state => state.diceGrid)
    const dieSize = useEditorStore(state => state.dieSize)
    const costPer1000 = useEditorStore(state => state.costPer1000)
    const lastReachedStep = useEditorStore(state => state.lastReachedStep)
    const buildProgress = useEditorStore(state => state.buildProgress)
    const showProjectModal = useEditorStore(state => state.showProjectModal)

    // Store actions
    const setCurrentProjectId = useEditorStore(state => state.setCurrentProjectId)
    const setProjectName = useEditorStore(state => state.setProjectName)
    const setLastSaved = useEditorStore(state => state.setLastSaved)
    const setShowProjectModal = useEditorStore(state => state.setShowProjectModal)
    const setStep = useEditorStore(state => state.setStep)
    const setOriginalImage = useEditorStore(state => state.setOriginalImage)
    const setCroppedImage = useEditorStore(state => state.setCroppedImage)
    const setCropParams = useEditorStore(state => state.setCropParams)
    const setProcessedImageUrl = useEditorStore(state => state.setProcessedImageUrl)
    const setDiceParams = useEditorStore(state => state.setDiceParams)
    const setDiceStats = useEditorStore(state => state.setDiceStats)
    const setDiceGrid = useEditorStore(state => state.setDiceGrid)
    const setDieSize = useEditorStore(state => state.setDieSize)
    const setCostPer1000 = useEditorStore(state => state.setCostPer1000)
    const setBuildProgress = useEditorStore(state => state.setBuildProgress)
    const setLastReachedStep = useEditorStore(state => state.setLastReachedStep)
    const setIsInitializing = useEditorStore(state => state.setIsInitializing)
    const resetWorkflow = useEditorStore(state => state.resetWorkflow)

    // Local state
    const [userProjects, setUserProjects] = useState<any[]>([])
    const loadingProjectRef = useRef(false)
    const [lastGridHash, setLastGridHash] = useState<string>('')

    // Generate hash from grid parameters to detect changes
    const generateGridHash = (params: DiceParams): string => {
        return JSON.stringify({
            numRows: params.numRows,
            colorMode: params.colorMode,
            contrast: params.contrast,
            gamma: params.gamma,
            edgeSharpening: params.edgeSharpening,
            rotate6: params.rotate6,
            rotate3: params.rotate3,
            rotate2: params.rotate2,
        })
    }

    // Update URL with project ID
    const updateURLWithProject = useCallback((projectId: string | null) => {
        const params = new URLSearchParams(window.location.search)
        if (projectId) {
            params.set('project', projectId)
        } else {
            params.delete('project')
        }
        const newUrl = params.toString() ? `/editor?${params.toString()}` : '/editor'
        router.push(newUrl, { scroll: false })
    }, [router])

    const handleResetWorkflow = useCallback(() => {
        resetWorkflow()
        // Clear localStorage when resetting
        localStorage.removeItem('editorState')
        devLog('[LOCAL STORAGE] Cleared - workflow reset')
    }, [resetWorkflow])

    // Fetch user projects
    const fetchUserProjects = useCallback(async () => {
        if (!session?.user?.id) return []

        devLog('[CLIENT] fetchUserProjects called')
        try {
            const response = await fetch('/api/projects')
            if (response.ok) {
                const projects = await response.json()
                setUserProjects(projects)
                return projects
            }
        } catch (error) {
            devError('Failed to fetch projects:', error)
        }
        return []
    }, [session])

    // Create a new project
    const createProject = useCallback(async () => {
        if (!session?.user?.id) return

        // Reset all states for new project
        handleResetWorkflow()

        // Generate random 3 characters for default name
        const randomChars = Math.random().toString(36).substring(2, 5).toUpperCase()
        const defaultName = `Untitled Project ${randomChars}`

        devLog(`[DB] Creating new empty project`)
        try {
            const response = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: defaultName,
                    lastReachedStep: 'upload',
                    originalImage: null,
                    croppedImage: null,
                    numRows: 50,
                    colorMode: 'both',
                    contrast: 0,
                    gamma: 1.0,
                    edgeSharpening: 0,
                    rotate2: false,
                    rotate3: false,
                    rotate6: false,
                    dieSize: 16,
                    costPer1000: 60,
                    gridData: null,
                    totalDice: 0,
                    completedDice: 0,
                    currentX: 0,
                    currentY: 0,
                    percentComplete: 0
                })
            })

            if (response.ok) {
                const project = await response.json()
                setCurrentProjectId(project.id)
                setProjectName(project.name)
                updateURLWithProject(project.id)
                setLastSaved(new Date())
                setShowProjectModal(false)
                await fetchUserProjects()
                setStep('upload')
            } else if (response.status === 403) {
                const data = await response.json()
                alert(data.error || 'Project limit reached. Maximum 3 projects allowed.')
            } else {
                devError('Failed to create project')
            }
        } catch (error) {
            devError('Failed to create project:', error)
        }
    }, [session, handleResetWorkflow, fetchUserProjects, setCurrentProjectId, setProjectName, updateURLWithProject, setLastSaved, setShowProjectModal, setStep])

    // Create project from current state
    const createProjectFromCurrent = useCallback(async () => {
        if (!session?.user?.id) return

        const randomChars = Math.random().toString(36).substring(2, 5).toUpperCase()
        const defaultName = `Untitled Project ${randomChars}`

        devLog(`[DB] Creating new project with current state`)

        try {
            const payload = {
                name: defaultName,
                lastReachedStep,
                originalImage,
                croppedImage,
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
                completedDice: 0,
                currentX: buildProgress.x,
                currentY: buildProgress.y,
                percentComplete: buildProgress.percentage,
                cropX: cropParams?.x || null,
                cropY: cropParams?.y || null,
                cropWidth: cropParams?.width || null,
                cropHeight: cropParams?.height || null,
                cropRotation: cropParams?.rotation || 0
            }

            const response = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (response.ok) {
                const project = await response.json()
                setCurrentProjectId(project.id)
                setProjectName(project.name)
                updateURLWithProject(project.id)
                setLastSaved(new Date())
                setShowProjectModal(false)
                await fetchUserProjects()
            } else if (response.status === 403) {
                const data = await response.json()
                alert(data.error || 'Project limit reached. Maximum 3 projects allowed.')
            }
        } catch (error) {
            devError('Failed to create project:', error)
        }
    }, [session, lastReachedStep, originalImage, croppedImage, diceParams, dieSize, costPer1000, diceGrid, diceStats, buildProgress, fetchUserProjects, cropParams, setCurrentProjectId, setProjectName, updateURLWithProject, setLastSaved, setShowProjectModal])

    // Delete project
    const deleteProject = useCallback(async (projectId: string) => {
        if (!session?.user?.id) return

        devLog(`[DB] Deleting project ${projectId}`)
        try {
            const response = await fetch(`/api/projects/${projectId}`, {
                method: 'DELETE'
            })

            if (response.ok) {
                await fetchUserProjects()
                if (projectId === currentProjectId) {
                    handleResetWorkflow()
                    setCurrentProjectId(null)
                    setProjectName(`Untitled Project ${Math.random().toString(36).substring(2, 5).toUpperCase()}`)
                    updateURLWithProject(null)
                }

                if (showProjectModal) {
                    setShowProjectModal(false)
                    const hasWorkInProgress = originalImage || processedImageUrl
                    if (hasWorkInProgress) {
                        await createProjectFromCurrent()
                        localStorage.removeItem('editorState')
                    } else {
                        createProject()
                        localStorage.removeItem('editorState')
                    }
                }
            }
        } catch (error) {
            devError('Failed to delete project:', error)
        }
    }, [session, currentProjectId, fetchUserProjects, handleResetWorkflow, showProjectModal, originalImage, processedImageUrl, createProjectFromCurrent, createProject, setCurrentProjectId, setProjectName, updateURLWithProject, setShowProjectModal])

    // Load a project
    const loadProject = useCallback(async (project: any) => {
        devLog('[CLIENT] Loading project:', project.name)
        loadingProjectRef.current = true

        if (!project.croppedImage && !project.originalImage && project.lastReachedStep !== 'upload') {
            try {
                const response = await fetch(`/api/projects/${project.id}`)
                if (response.ok) {
                    const fullProject = await response.json()
                    project = fullProject
                }
            } catch (error) {
                devError('Failed to fetch full project:', error)
            }
        }

        // Clear state
        setOriginalImage(null)
        setCroppedImage(null)
        setCropParams(null)
        setProcessedImageUrl(null)
        setDiceGrid(null)
        setDiceStats({ blackCount: 0, whiteCount: 0, totalCount: 0 })

        // Set project info
        setCurrentProjectId(project.id)
        setProjectName(project.name)
        updateURLWithProject(project.id)

        if (project.updatedAt) {
            setLastSaved(new Date(project.updatedAt))
        }

        if (project.originalImage) {
            setOriginalImage(project.originalImage)
        }

        // Load crop params and regenerate image
        if (project.cropX !== null && project.cropY !== null && project.cropWidth && project.cropHeight) {
            const params = {
                x: project.cropX,
                y: project.cropY,
                width: project.cropWidth,
                height: project.cropHeight,
                rotation: project.cropRotation || 0
            }
            setCropParams(params)

            if (project.originalImage) {
                const img = new Image()
                img.onload = () => {
                    const canvas = document.createElement('canvas')
                    canvas.width = params.width
                    canvas.height = params.height
                    const ctx = canvas.getContext('2d')
                    if (ctx) {
                        ctx.drawImage(img, params.x, params.y, params.width, params.height, 0, 0, params.width, params.height)
                        const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.95)
                        setCroppedImage(croppedDataUrl)
                    }
                }
                img.src = project.originalImage
            }
        } else if (project.croppedImage) {
            setCroppedImage(project.croppedImage)
            if (project.currentStep === 'build') {
                setProcessedImageUrl(project.croppedImage)
            }
        }

        // Load params
        const newDiceParams = {
            numRows: project.numRows || 30,
            colorMode: project.colorMode || 'both',
            contrast: project.contrast || 0,
            gamma: project.gamma || 1.0,
            edgeSharpening: project.edgeSharpening || 0,
            rotate2: project.rotate2 || false,
            rotate3: project.rotate3 || false,
            rotate6: project.rotate6 || false
        }
        setDiceParams(newDiceParams)
        setLastGridHash(generateGridHash(newDiceParams))

        setDieSize(project.dieSize || 16)
        setCostPer1000(project.costPer1000 || 60)

        if (project.totalDice) {
            setDiceStats({
                blackCount: project.blackDice || 0,
                whiteCount: project.whiteDice || 0,
                totalCount: project.totalDice || 0
            })
        }

        setBuildProgress({
            x: project.currentX || 0,
            y: project.currentY || 0,
            percentage: project.percentComplete || 0
        })

        if (project.lastReachedStep) {
            setStep(project.lastReachedStep)
            setLastReachedStep(project.lastReachedStep)
        } else {
            if (project.croppedImage) {
                setStep('tune')
                setLastReachedStep('tune')
            } else if (project.originalImage) {
                setStep('crop')
                setLastReachedStep('crop')
            } else {
                setStep('upload')
                setLastReachedStep('upload')
            }
        }

        setTimeout(() => {
            loadingProjectRef.current = false
        }, 100)
    }, [setCurrentProjectId, setProjectName, updateURLWithProject, setLastSaved, setOriginalImage, setCroppedImage, setCropParams, setProcessedImageUrl, setDiceGrid, setDiceStats, setDiceParams, setDieSize, setCostPer1000, setBuildProgress, setStep, setLastReachedStep])

    return {
        userProjects,
        setUserProjects,
        fetchUserProjects,
        createProject,
        createProjectFromCurrent,
        deleteProject,
        loadProject,
        updateURLWithProject,
        handleResetWorkflow,
        loadingProjectRef,
        lastGridHash,
        setLastGridHash,
        generateGridHash
    }
}
