/**
 * Editor Page Component
 * 
 * Main orchestrator for the dice art creation workflow.
 * This is the top-level page component that manages the entire application state
 * and coordinates between different workflow steps.
 * 
 * Workflow Steps:
 * 1. Upload: User selects/drops an image file
 * 2. Crop: Image cropping and zooming interface
 * 3. Tune: Convert image to dice with parameter controls
 * 4. Build: Interactive viewer to navigate through dice one-by-one
 * 5. Export: Download the final artwork (future)
 * 6. Share: Share creations with others (future)
 * 
 * State Management:
 * - Maintains all shared state (image, parameters, dice grid)
 * - Passes data and callbacks down to child components
 * - Controls workflow progression and step visibility
 * 
 * Key Types:
 * - WorkflowStep: Current step in the process
 * - DiceParams: Configuration for dice generation
 * - ColorMode: Black & White, Black Only, or White Only
 * - DiceStats: Statistics about the generated dice
 * - DiceGrid: The actual 2D array of dice data
 * 
 * This follows a typical React pattern where the page component
 * acts as the "smart" container and child components are mostly
 * "dumb" presentational components that receive props.
 */

'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useSession, signOut } from 'next-auth/react'
import ImageUploader from '@/components/Editor/ImageUploader'
import Cropper from '@/components/Editor/Cropper'
import DiceCanvas from '@/components/Editor/DiceCanvas'
import ControlPanel from '@/components/Editor/ControlPanel'
import DiceStatsComponent from '@/components/Editor/DiceStats'
import BuildViewer from '@/components/Editor/BuildViewer'
import BuildProgress from '@/components/Editor/BuildProgress'
import ConfirmDialog from '@/components/Editor/ConfirmDialog'
import ProjectSelector from '@/components/Editor/ProjectSelector'
import ProjectSelectionModal from '@/components/ProjectSelectionModal'
import DiceStepper from '@/components/Editor/DiceStepper'
import Logo from '@/components/Logo'
// AnimatedBackground removed - no longer used
import AuthModal from '@/components/AuthModal'
import { theme } from '@/lib/theme'
import { WorkflowStep, DiceParams, DiceStats, DiceGrid } from '@/lib/types'
// Grid encoding no longer needed - generating from parameters instead
// import { encodeDiceGrid, decodeDiceGrid } from '@/lib/dice/encoding'

// Types are now imported from @/lib/types

export default function Editor() {
  const { data: session, status } = useSession()
  const [step, setStep] = useState<WorkflowStep>('upload')
  const [lastReachedStep, setLastReachedStep] = useState<WorkflowStep>('upload')
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showProjectModal, setShowProjectModal] = useState(false)
  
  // Debug refs to track callback stability
  const [originalImage, setOriginalImage] = useState<string | null>(null)
  const [croppedImage, setCroppedImage] = useState<string | null>(null) // Generated from crop params
  const [cropParams, setCropParams] = useState<{
    x: number
    y: number
    width: number
    height: number
    rotation: number
  } | null>(null) // Store crop parameters instead of image
  const [diceParams, setDiceParams] = useState<DiceParams>({
    numRows: 30,
    colorMode: 'both',
    contrast: 0,
    gamma: 1.0,
    edgeSharpening: 0,
    rotate6: false,
    rotate3: false,
    rotate2: false,
  })
  const [diceStats, setDiceStats] = useState<DiceStats>({
    blackCount: 0,
    whiteCount: 0,
    totalCount: 0,
  })
  const [diceGrid, setDiceGrid] = useState<DiceGrid | null>(null)
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null) // Processed dice grid image
  const [dieSize, setDieSize] = useState(16) // mm
  const [costPer1000, setCostPer1000] = useState(60) // dollars
  const [projectName, setProjectName] = useState('Untitled Project')
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null)
  const [, forceUpdate] = useState(0) // Force re-render for save indicator
  
  // Remove auto-save refs - no longer needed
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [userProjects, setUserProjects] = useState<any[]>([])
  const [hasCropChanged, setHasCropChanged] = useState(false) // Track if crop has changed
  const [hasTuneChanged, setHasTuneChanged] = useState(false) // Track if tune parameters have changed
  // Removed loadingProjects - no longer needed
  const [headerOpacity, setHeaderOpacity] = useState(1)
  
  // Memoize frame dimensions to prevent re-renders
  const frameWidth = useMemo(() => {
    return diceGrid ? (diceGrid.width * dieSize) / 10 : undefined
  }, [diceGrid?.width, dieSize])
  
  const frameHeight = useMemo(() => {
    return diceGrid ? (diceGrid.height * dieSize) / 10 : undefined
  }, [diceGrid?.height, dieSize])
  
  // Build progress tracking
  const [buildProgress, setBuildProgress] = useState<{ x: number; y: number; percentage: number }>({ 
    x: 0, 
    y: 0, 
    percentage: 0 
  })
  const [lastGridHash, setLastGridHash] = useState<string>('')
  
  // Compute if we should warn when exiting build step (only true if there's progress)
  const shouldWarnOnExit = step === 'build' && buildProgress.percentage > 0
  
  // Navigation confirmation dialog
  const [showBuildProgressDialog, setShowBuildProgressDialog] = useState(false)
  const [attemptedStep, setAttemptedStep] = useState<WorkflowStep | null>(null)
  
  // Build navigation handlers
  const [buildNavigation, setBuildNavigation] = useState<{
    navigatePrev: () => void
    navigateNext: () => void
    navigatePrevDiff: () => void
    navigateNextDiff: () => void
    canNavigate: {
      prev: boolean
      next: boolean
      prevDiff: boolean
      nextDiff: boolean
    }
  } | null>(null)
  
  // Auto-save timeout ref for build step
  const buildAutoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.user-menu-container')) {
        setShowUserMenu(false)
      }
    }

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showUserMenu])

  // Handle scroll to hide/show header
  useEffect(() => {
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement
      const scrollTop = target.scrollTop
      // Hide header completely after 50px of scroll
      if (scrollTop > 50) {
        setHeaderOpacity(0)
      } else {
        setHeaderOpacity(1)
      }
    }

    // Find the main element and add scroll listener
    const mainElement = document.querySelector('main')
    if (mainElement) {
      mainElement.addEventListener('scroll', handleScroll)
      return () => mainElement.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const handleImageUpload = (imageUrl: string) => {
    setOriginalImage(imageUrl)
    setCroppedImage(null)
    setCropParams(null)
    setDiceGrid(null)
    setBuildProgress({ x: 0, y: 0, percentage: 0 })
    setDiceStats({
      blackCount: 0,
      whiteCount: 0,
      totalCount: 0,
    })
    // When uploading image, we move to crop and that becomes our lastReachedStep
    setStep('crop')
    setLastReachedStep('crop')
    
    // Save the uploaded image if we have a project
    // Upload is saved immediately when image is uploaded
    if (currentProjectId && session?.user?.id) {
      // Pass the image directly since state hasn't updated yet
      saveUploadStep(imageUrl)
    }
  }

  // navigateToStep moved below save functions to fix dependency issue

  // Helper function to compare crop parameters
  const areCropParamsEqual = (params1: typeof cropParams, params2: typeof cropParams): boolean => {
    if (!params1 || !params2) return params1 === params2
    
    // Compare with small tolerance for floating point differences
    const tolerance = 0.01
    return Math.abs(params1.x - params2.x) < tolerance &&
           Math.abs(params1.y - params2.y) < tolerance &&
           Math.abs(params1.width - params2.width) < tolerance &&
           Math.abs(params1.height - params2.height) < tolerance &&
           Math.abs(params1.rotation - params2.rotation) < tolerance
  }

  const handleCropComplete = (croppedImageUrl: string, params: { x: number, y: number, width: number, height: number, rotation: number }) => {
    // Check if crop parameters actually changed
    const hasChanged = !areCropParamsEqual(cropParams, params)
    
    // Store crop parameters and generated image
    setCropParams(params)
    setCroppedImage(croppedImageUrl) // Store the generated cropped image for display
    
    // Only mark as changed if parameters are different
    if (hasChanged) {
      // Changes tracked internally
      setHasCropChanged(true) // Mark that crop has changed
      console.log('[CROP] Crop parameters changed')
      
      // When crop changes, reset lastReachedStep to 'tune' to force user through tune step again
      if (lastReachedStep === 'build') {
        setLastReachedStep('tune')
        console.log('[CROP] Resetting lastReachedStep to tune - user must re-tune after crop change')
      }
    } else {
      console.log('[CROP] Crop parameters unchanged')
    }
  }

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

  const handleParamChange = (params: Partial<DiceParams>) => {
    setDiceParams(prev => ({ ...prev, ...params }))
    if (step === 'tune') {
      // Changes tracked internally
      setHasTuneChanged(true) // Mark that tune has changed
    }
  }

  const handleStatsUpdate = (stats: DiceStats) => {
    setDiceStats(stats)
  }

  const handleDieSizeChange = (size: number) => {
    setDieSize(size)
    if (step === 'tune') {
      // Changes tracked internally
      setHasTuneChanged(true) // Mark that tune has changed
    }
  }

  const handleCostChange = (cost: number) => {
    setCostPer1000(cost)
    if (step === 'tune') {
      // Changes tracked internally
      setHasTuneChanged(true) // Mark that tune has changed
    }
  }

  const handleGridUpdate = (grid: DiceGrid) => {
    setDiceGrid(grid)
    
    // Check if grid has changed
    const newHash = generateGridHash(diceParams)
    if (newHash !== lastGridHash) {
      setLastGridHash(newHash)
      // Reset build progress when grid changes
      setBuildProgress({ x: 0, y: 0, percentage: 0 })
    }
  }
  
  // Throttle position updates to reduce parent re-renders
  const lastUpdateTimeRef = useRef(0)
  const pendingUpdateRef = useRef<{ x: number; y: number } | null>(null)
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // handleStepNavigation moved below navigateToStep to fix dependency issue
  
  // Reset build progress and navigate to attempted step
  const handleResetBuildProgress = () => {
    setBuildProgress({ x: 0, y: 0, percentage: 0 })
    setShowBuildProgressDialog(false)
    if (attemptedStep) {
      setStep(attemptedStep)
      setAttemptedStep(null)
    }
  }
  
  // Cancel navigation and stay in build
  const handleStayInBuild = () => {
    setShowBuildProgressDialog(false)
    setAttemptedStep(null)
  }

  const resetWorkflow = () => {
    setStep('upload')
    setOriginalImage(null)
    setCroppedImage(null)
    setCropParams(null)
    setProcessedImageUrl(null)
    setDiceParams({
      numRows: 30,
      colorMode: 'both',
      contrast: 0,
      gamma: 1.0,
      edgeSharpening: 0,
      rotate6: false,
      rotate3: false,
      rotate2: false,
    })
    setDiceStats({
      blackCount: 0,
      whiteCount: 0,
      totalCount: 0,
    })
    setBuildProgress({ x: 0, y: 0, percentage: 0 })
    setDiceGrid(null)
    setDieSize(16)
    setCostPer1000(60)
  }
  
  // Handle stepper click navigation - simplified: allow clicking any step if image is uploaded
  
  // Fetch user projects
  const fetchUserProjects = useCallback(async () => {
    if (!session?.user?.id) return
    
    console.log('[CLIENT] fetchUserProjects called - stack trace:', new Error().stack?.split('\n').slice(1, 4).join('\n'))
    console.log(`[DB] Fetching all projects for user`)
    try {
      const response = await fetch('/api/projects')
      if (response.ok) {
        const projects = await response.json()
        setUserProjects(projects)
        return projects
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    } finally {
      // Loading state removed
    }
    return []
  }, [session])
  
  // Create a new project
  const createProject = useCallback(async () => {
    if (!session?.user?.id) return

    // Reset all states for new project
    resetWorkflow()
    
    // Saving automatically
    console.log(`[DB] Creating new empty project`)
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Untitled Project',
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
        // Save completed
        setShowProjectModal(false)
        await fetchUserProjects()
        // Navigate to upload step for new project
        setStep('upload')
      } else if (response.status === 403) {
        const data = await response.json()
        alert(data.error || 'Project limit reached. Maximum 3 projects allowed.')
      } else {
        console.error('Failed to create project')
      }
    } catch (error) {
      console.error('Failed to create project:', error)
    } finally {
      // Save operation finished
    }
  }, [session, resetWorkflow, fetchUserProjects])

  // Create project from current state
  const createProjectFromCurrent = useCallback(async () => {
    if (!session?.user?.id) return
    
    // Saving automatically
    console.log(`[DB] Creating new project with current state`)
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Untitled Project',
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
          gridData: null, // No longer storing grid data
          gridWidth: diceGrid?.width || null,
          gridHeight: diceGrid?.height || null,
          totalDice: diceStats.totalCount,
          completedDice: 0,
          currentX: buildProgress.x,
          currentY: buildProgress.y,
          percentComplete: buildProgress.percentage
        })
      })

      if (response.ok) {
        const project = await response.json()
        setCurrentProjectId(project.id)
        setProjectName(project.name)
        // Save completed
        setShowProjectModal(false)
        await fetchUserProjects()
      } else if (response.status === 403) {
        const data = await response.json()
        alert(data.error || 'Project limit reached. Maximum 3 projects allowed.')
      }
    } catch (error) {
      console.error('Failed to create project:', error)
    } finally {
      // Save operation finished
    }
  }, [session, step, lastReachedStep, originalImage, croppedImage, diceParams, dieSize, costPer1000, diceGrid, diceStats, buildProgress, fetchUserProjects])

  // Delete project
  const deleteProject = useCallback(async (projectId: string) => {
    if (!session?.user?.id) return
    
    console.log(`[DB] Deleting project ${projectId}`)
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        await fetchUserProjects()
        if (projectId === currentProjectId) {
          // Reset if we deleted the current project
          resetWorkflow()
        }
      }
    } catch (error) {
      console.error('Failed to delete project:', error)
    }
  }, [session, currentProjectId, fetchUserProjects, resetWorkflow])

  // Save only progress fields (for build step)
  const saveProgressOnly = useCallback(async () => {
    if (!session?.user?.id || !currentProjectId) return

    console.log(`[PROGRESS] Saving progress for project ${currentProjectId}`)
    try {
      const response = await fetch(`/api/projects/${currentProjectId}/progress`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentX: buildProgress.x,
          currentY: buildProgress.y,
          completedDice: Math.floor((buildProgress.percentage / 100) * diceStats.totalCount)
        })
      })

      if (response.ok) {
        console.log('Progress saved successfully')
      }
    } catch (error) {
      console.error('Failed to save progress:', error)
    }
  }, [session, currentProjectId, buildProgress, diceStats.totalCount])

  // Save upload step data
  const saveUploadStep = useCallback(async (imageToSave?: string) => {
    if (!session?.user?.id || !currentProjectId) return

    // Use provided image or fall back to originalImage state
    const image = imageToSave || originalImage
    console.log(`[UPLOAD] Saving upload data for project ${currentProjectId}, hasImage=${!!image}`)
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
        console.log('Upload data saved successfully')
        // Save completed
      }
    } catch (error) {
      console.error('Failed to save upload data:', error)
    }
  }, [session, currentProjectId, originalImage, step, lastReachedStep])

  // Save crop step data
  const saveCropStep = useCallback(async () => {
    if (!session?.user?.id || !currentProjectId || !cropParams) return

    console.log(`[CROP] Saving crop parameters for project ${currentProjectId}`)
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
        console.log('Crop data saved successfully')
        // Save completed
      }
    } catch (error) {
      console.error('Failed to save crop data:', error)
    }
  }, [session, currentProjectId, croppedImage, lastReachedStep])

  // Save tune step parameters
  const saveTuneStep = useCallback(async () => {
    if (!session?.user?.id || !currentProjectId) return

    console.log(`[TUNE] Saving tune parameters for project ${currentProjectId} - called from:`, new Error().stack?.split('\n').slice(1, 3).join('\n'))
    // Saving automatically
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
          lastReachedStep
        })
      })

      if (response.ok) {
        console.log('Tune parameters saved successfully')
        // Save completed
        setTimeout(() => forceUpdate(prev => prev + 1), 3000)
      }
    } catch (error) {
      console.error('Failed to save tune parameters:', error)
    } finally {
      // Save operation finished
    }
  }, [session, currentProjectId, diceParams, dieSize, costPer1000, diceGrid, diceStats, step, lastReachedStep])

  // Helper function to navigate to a step
  const navigateToStep = useCallback(async (newStep: WorkflowStep) => {
    console.log(`[CLIENT] navigateToStep called: ${step} -> ${newStep}`)
    const steps: WorkflowStep[] = ['upload', 'crop', 'tune', 'build']
    const newIndex = steps.indexOf(newStep)
    const lastReachedIndex = steps.indexOf(lastReachedStep)
    
    // Allow navigation to any previous step or the next step after lastReachedStep
    if (newIndex <= lastReachedIndex + 1) {
      // Save on specific transitions as requested:
      // 1. Moving from crop to tune: save crop parameters only if they changed
      if (step === 'crop' && newStep === 'tune' && cropParams && hasCropChanged) {
        console.log('[CLIENT] Moving from crop to tune, saving crop parameters')
        if (currentProjectId && session?.user?.id) {
          await saveCropStep()
          setHasCropChanged(false) // Reset flag after saving
        }
      } else if (step === 'crop' && newStep === 'tune' && !hasCropChanged) {
        console.log('[CLIENT] Moving from crop to tune, no changes to save')
      }
      
      // 2. Moving from tune to build: save tune parameters only if they changed
      if (step === 'tune' && newStep === 'build' && hasTuneChanged) {
        console.log('[CLIENT] Moving from tune to build, saving tune parameters')
        if (currentProjectId && session?.user?.id) {
          await saveTuneStep()
          setHasTuneChanged(false) // Reset flag after saving
        }
      } else if (step === 'tune' && newStep === 'build' && !hasTuneChanged) {
        console.log('[CLIENT] Moving from tune to build, no changes to save')
      }
      
      setStep(newStep)
      // Navigation complete
      
      // Reset change flags when entering new steps
      if (newStep === 'crop') {
        setHasCropChanged(false)
      } else if (newStep === 'tune') {
        setHasTuneChanged(false)
      }
      
      // Update lastReachedStep if we're moving forward
      if (newIndex > lastReachedIndex) {
        setLastReachedStep(newStep)
      }
    }
  }, [step, lastReachedStep, cropParams, currentProjectId, session, saveCropStep, saveTuneStep])

  // Manual save removed - saves happen automatically on step transitions

  // Handle navigation with build progress check
  const handleStepNavigation = useCallback((newStep: WorkflowStep) => {
    console.log(`[CLIENT] handleStepNavigation called: ${newStep}`)
    // Check if trying to enter build step without auth
    if (newStep === 'build' && status !== 'authenticated') {
      setShowAuthModal(true)
      return
    }
    
    // Check if leaving build step with progress
    if (shouldWarnOnExit && newStep !== 'build') {
      setAttemptedStep(newStep)
      setShowBuildProgressDialog(true)
    } else {
      // Use navigateToStep for consistent navigation logic
      navigateToStep(newStep)
    }
  }, [shouldWarnOnExit, status, navigateToStep])

  // Save project metadata (name)
  // Removed saveProjectMetadata - project name updates are now handled by ProjectSelector component
  // Removed saveFullProject - we now use step-specific saves

  // Load a project
  const loadProject = useCallback(async (project: any) => {
    console.log('[CLIENT] Loading project:', project.name, 'step:', project.lastReachedStep)
    
    // If project doesn't have image data but needs it, fetch full project
    if (!project.croppedImage && !project.originalImage && project.lastReachedStep !== 'upload') {
      console.log(`[DB] Fetching full project data for ${project.id}`)
      try {
        const response = await fetch(`/api/projects/${project.id}`)
        if (response.ok) {
          const fullProject = await response.json()
          console.log('Fetched full project with image data')
          project = fullProject // Use the full project data
        }
      } catch (error) {
        console.error('Failed to fetch full project:', error)
      }
    }
    
    // Clear all existing state first
    setOriginalImage(null)
    setCroppedImage(null)
    setCropParams(null)
    setProcessedImageUrl(null)
    setDiceGrid(null)
    setDiceStats({
      blackCount: 0,
      whiteCount: 0,
      totalCount: 0,
    })
    setBuildProgress({
      x: 0,
      y: 0,
      percentage: 0
    })
    
    // Set project info
    setCurrentProjectId(project.id)
    setProjectName(project.name)
    
    // Load images
    if (project.originalImage) {
      console.log('Setting original image')
      setOriginalImage(project.originalImage)
    }
    
    // Load crop parameters and regenerate cropped image if needed
    if (project.cropX !== null && project.cropY !== null && project.cropWidth && project.cropHeight) {
      const params = {
        x: project.cropX,
        y: project.cropY,
        width: project.cropWidth,
        height: project.cropHeight,
        rotation: project.cropRotation || 0
      }
      setCropParams(params)
      console.log('Loaded crop parameters:', params)
      
      // If we have the original image and crop params, regenerate the cropped image
      if (project.originalImage) {
        // Create a canvas to generate the cropped image
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          canvas.width = params.width
          canvas.height = params.height
          const ctx = canvas.getContext('2d')
          if (ctx) {
            // Don't apply rotation here - the coordinates already account for it
            // Draw the cropped portion
            ctx.drawImage(img, params.x, params.y, params.width, params.height, 0, 0, params.width, params.height)
            const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.95)
            console.log('Regenerated cropped image from parameters')
            setCroppedImage(croppedDataUrl)
          }
        }
        img.src = project.originalImage
      }
    } else if (project.croppedImage) {
      // Fallback to old cropped image if no crop params
      console.log('Setting cropped image (legacy)')
      setCroppedImage(project.croppedImage)
      // If we have a cropped image and are loading into build state,
      // use the cropped image as the processed image so the build view has something to display
      if (project.currentStep === 'build') {
        console.log('Setting processed image for build state')
        setProcessedImageUrl(project.croppedImage)
      }
    }
    
    // Load parameters
    console.log('[CLIENT] Setting dice params from project')
    setDiceParams(prev => ({
      ...prev,
      numRows: project.numRows || 30,
      colorMode: project.colorMode || 'both',
      contrast: project.contrast || 0,
      gamma: project.gamma || 1.0,
      edgeSharpening: project.edgeSharpening || 0,
      rotate2: project.rotate2 || false,
      rotate3: project.rotate3 || false,
      rotate6: project.rotate6 || false
    }))
    
    // Load die size and cost
    setDieSize(project.dieSize || 16)
    setCostPer1000(project.costPer1000 || 60)
    
    // Grid will be generated from parameters when needed
    // Load saved stats if available
    if (project.totalDice) {
      setDiceStats({
        blackCount: project.blackDice || 0,
        whiteCount: project.whiteDice || 0,
        totalCount: project.totalDice || 0
      })
    }
    
    // Load progress
    setBuildProgress({
      x: project.currentX || 0,
      y: project.currentY || 0,
      percentage: project.percentComplete || 0
    })
    
    // Always load to lastReachedStep
    if (project.lastReachedStep) {
      console.log('[CLIENT] Setting step to lastReachedStep:', project.lastReachedStep)
      setStep(project.lastReachedStep)
      setLastReachedStep(project.lastReachedStep)
    } else {
      // Fallback to determining step from data
      if (project.croppedImage) {
        console.log('Navigating to tune step')
        setStep('tune')
        setLastReachedStep('tune')
      } else if (project.originalImage) {
        console.log('Navigating to crop step')
        setStep('crop')
        setLastReachedStep('crop')
      } else {
        console.log('Starting at upload step')
        setStep('upload')
        setLastReachedStep('upload')
      }
    }
  }, [])

  const handleStepperClick = useCallback((clickedStep: WorkflowStep) => {
    console.log(`[CLIENT] handleStepperClick called: ${clickedStep}`)
    // Use handleStepNavigation for all navigation to ensure auth checks
    handleStepNavigation(clickedStep)
  }, [handleStepNavigation])
  
  // Schedule auto-save for build progress
  const scheduleBuildAutoSave = useCallback(() => {
    // Clear any existing timeout
    if (buildAutoSaveTimeoutRef.current) {
      clearTimeout(buildAutoSaveTimeoutRef.current)
    }
    
    // Schedule new save after 30 seconds
    buildAutoSaveTimeoutRef.current = setTimeout(() => {
      console.log('[AUTO-SAVE] Saving build progress after 30 seconds of inactivity')
      saveProgressOnly()
    }, 30000) // 30 seconds delay
  }, [saveProgressOnly])
  
  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (buildAutoSaveTimeoutRef.current) {
        clearTimeout(buildAutoSaveTimeoutRef.current)
      }
    }
  }, [])
  
  // Memoize the navigation ready handler
  const handleNavigationReady = useCallback((nav: any) => {
    // Wrap navigation functions to trigger auto-save
    const wrappedNav = {
      ...nav,
      navigatePrev: () => {
        nav.navigatePrev()
        scheduleBuildAutoSave()
      },
      navigateNext: () => {
        nav.navigateNext()
        scheduleBuildAutoSave()
      },
      navigatePrevDiff: () => {
        nav.navigatePrevDiff()
        scheduleBuildAutoSave()
      },
      navigateNextDiff: () => {
        nav.navigateNextDiff()
        scheduleBuildAutoSave()
      }
    }
    setBuildNavigation(wrappedNav)
  }, [scheduleBuildAutoSave])

  // Handle user login - show project selection modal
  useEffect(() => {
    if (session?.user?.id && !currentProjectId) {
      fetchUserProjects().then(() => {
        // Show project modal if user has no active project
        setShowProjectModal(true)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, currentProjectId]) // fetchUserProjects excluded to prevent re-runs

  // Removed auto-save - now only saving on step transitions

  // No more auto-save - saves are now manual or on step transitions
  
  // Handle build progress updates with throttling
  const handleBuildProgressUpdate = useCallback((x: number, y: number) => {
    if (!diceGrid) return
    
    const now = Date.now()
    const timeSinceLastUpdate = now - lastUpdateTimeRef.current
    
    // Clear any pending timeout
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current)
      updateTimeoutRef.current = null
    }
    
    // Store the pending update
    pendingUpdateRef.current = { x, y }
    
    // Throttle updates to max 10 per second (100ms)
    if (timeSinceLastUpdate >= 100) {
      // Enough time has passed, update immediately
      lastUpdateTimeRef.current = now
      setBuildProgress(prev => {
        if (prev.x === x && prev.y === y) {
          return prev // No change, return same reference
        }
        
        const totalDice = diceGrid.width * diceGrid.height
        const currentIndex = y * diceGrid.width + x
        const percentage = Math.round((currentIndex / totalDice) * 100)
        
        // No auto-save for progress - manual save only
        
        return { x, y, percentage }
      })
      pendingUpdateRef.current = null
    } else {
      // Schedule an update for when the throttle period expires
      const delay = 100 - timeSinceLastUpdate
      updateTimeoutRef.current = setTimeout(() => {
        const pending = pendingUpdateRef.current
        if (pending) {
          lastUpdateTimeRef.current = Date.now()
          setBuildProgress(prev => {
            if (prev.x === pending.x && prev.y === pending.y) {
              return prev // No change, return same reference
            }
            
            const totalDice = diceGrid.width * diceGrid.height
            const currentIndex = pending.y * diceGrid.width + pending.x
            const percentage = Math.round((currentIndex / totalDice) * 100)
            
            // No auto-save for progress - manual save only
            
            return { x: pending.x, y: pending.y, percentage }
          })
          pendingUpdateRef.current = null
        }
        updateTimeoutRef.current = null
      }, delay)
    }
  }, [diceGrid, step, currentProjectId, session])
  
  // No cleanup needed - removed auto-save timers

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: '#000000' }}>
      
      <header 
        className="fixed top-0 left-0 right-0 transition-opacity duration-300" 
        style={{ 
          zIndex: 50,
          opacity: headerOpacity,
          pointerEvents: headerOpacity < 0.1 ? 'none' : 'auto'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 py-4 relative flex items-center">
          
          {/* Logo on the left */}
          <div className="flex-shrink-0">
            <Logo />
          </div>
          
          {/* Spacer */}
          <div className="flex-1"></div>
          
          {/* Auth Button */}
          <div className="absolute right-4">
            {status === 'authenticated' && session ? (
              <div className="flex items-center gap-3">
                <div className="relative user-menu-container">
                  <div 
                    className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-600 hover:border-gray-400 transition-colors cursor-pointer"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                  >
                    {session.user?.image ? (
                      <img 
                        src={session.user.image} 
                        alt={session.user.name || 'User'} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          console.error('Image failed to load:', session.user?.image)
                          // Hide the broken image and show fallback
                          e.currentTarget.style.display = 'none'
                          const fallback = e.currentTarget.nextElementSibling as HTMLElement
                          if (fallback) fallback.style.display = 'flex'
                        }}
                      />
                    ) : null}
                    <div 
                      className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 items-center justify-center text-white font-semibold"
                      style={{ display: session.user?.image ? 'none' : 'flex' }}
                    >
                      {session.user?.name?.[0]?.toUpperCase() || session.user?.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                  </div>
                  
                  {/* Dropdown menu */}
                  {showUserMenu && (
                    <div className="absolute top-full right-0 mt-2 bg-gray-900 rounded-lg shadow-xl border border-gray-700 overflow-hidden z-50">
                      <div className="px-4 py-3 border-b border-gray-700">
                        <div className="text-sm font-medium text-white">
                          {session.user?.name || 'User'}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {session.user?.email}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setShowUserMenu(false)
                          signOut()
                        }}
                        className="w-full px-4 py-2 text-sm text-left text-white/90 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-4 py-2 text-sm font-medium text-white/90 hover:text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Sign in
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative h-screen overflow-y-auto p-8 pt-24">
        {/* Center: Project Selector and Stepper */}
        <div className="flex justify-center items-center gap-8 mb-4">
          {/* Project selector */}
          {session?.user && (
            <ProjectSelector 
              currentProject={projectName}
              currentProjectId={currentProjectId}
              projects={userProjects}
              onProjectChange={(name: string) => {
                // Just update the local state - ProjectSelector handles the API call
                setProjectName(name)
                // Update the local projects list to reflect the change
                setUserProjects(prev => prev.map(p => 
                  p.id === currentProjectId ? { ...p, name: name } : p
                ))
              }}
              onProjectSelect={loadProject}
              onCreateProject={createProject}
              onProjectsChange={fetchUserProjects}
            />
          )}
          
          {/* Stepper */}
          <DiceStepper
            currentStep={step} 
            onStepClick={handleStepperClick}
            hasImage={!!originalImage}
            lastReachedStep={lastReachedStep}
          />
        </div>

        {/* Step Content */}
        {step === 'upload' && (
          <ImageUploader 
            onImageUpload={handleImageUpload} 
            currentImage={originalImage}
          />
        )}

        {step === 'crop' && originalImage && (
          <Cropper
            imageUrl={originalImage}
            onCropComplete={handleCropComplete}
            initialCrop={cropParams || undefined}
          />
        )}

        {step === 'tune' && croppedImage && (
          <div className="flex flex-wrap lg:flex-nowrap gap-6 justify-center">
            {/* Left floating panels */}
            <div className="space-y-4 w-80 flex-shrink-0">
              {/* Stats display */}
              <div 
                className="backdrop-blur-md border text-white px-4 py-3 rounded-2xl"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  borderColor: `${theme.colors.accent.purple}33`,
                  boxShadow: `0 10px 40px rgba(139, 92, 246, 0.25),
                             0 0 60px rgba(59, 130, 246, 0.08),
                             0 5px 20px rgba(0, 0, 0, 0.3)`
                }}
              >
                <DiceStatsComponent 
                  key={`tune-stats-${currentProjectId}-${diceStats.totalCount}-${croppedImage?.substring(0, 20)}`}
                  blackCount={diceStats.blackCount}
                  whiteCount={diceStats.whiteCount}
                  totalCount={diceStats.totalCount}
                  gridWidth={diceGrid?.width}
                  gridHeight={diceGrid?.height}
                  frameWidth={frameWidth}
                  frameHeight={frameHeight}
                  dieSize={dieSize}
                  costPer1000={costPer1000}
                  onDieSizeChange={handleDieSizeChange}
                  onCostPer1000Change={handleCostChange}
                  imageUrl={processedImageUrl || croppedImage || undefined}
                />
              </div>
              
              {/* Control panel */}
              <div 
                className="backdrop-blur-md rounded-2xl border overflow-hidden"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  borderColor: `${theme.colors.accent.purple}33`,
                  boxShadow: `0 10px 40px rgba(139, 92, 246, 0.25),
                             0 0 60px rgba(59, 130, 246, 0.08),
                             0 5px 20px rgba(0, 0, 0, 0.3)`
                }}
              >
                <ControlPanel
                  params={diceParams}
                  onParamChange={handleParamChange}
                />
              </div>
            </div>
            
            {/* Main content */}
            <DiceCanvas
              imageUrl={croppedImage ?? ''}
              params={diceParams}
              onStatsUpdate={handleStatsUpdate}
              onGridUpdate={handleGridUpdate}
              onProcessedImageReady={setProcessedImageUrl}
              maxWidth={900}
              maxHeight={600}
              currentStep={step}
            />
          </div>
        )}

        {step === 'build' && (
          diceGrid ? (
          <div className="flex flex-wrap lg:flex-nowrap gap-6 justify-center">
            {/* Left floating panels */}
            <div className="space-y-4 w-80 flex-shrink-0">
              {/* Stats display */}
              <div 
                className="backdrop-blur-md border text-white px-4 py-3 rounded-2xl"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  borderColor: `${theme.colors.accent.purple}33`,
                  boxShadow: `0 10px 40px rgba(139, 92, 246, 0.25),
                             0 0 60px rgba(59, 130, 246, 0.08),
                             0 5px 20px rgba(0, 0, 0, 0.3)`
                }}
              >
                <DiceStatsComponent 
                  key={`build-stats-${currentProjectId}-${diceStats.totalCount}-${croppedImage?.substring(0, 20)}`}
                  blackCount={diceStats.blackCount}
                  whiteCount={diceStats.whiteCount}
                  totalCount={diceStats.totalCount}
                  gridWidth={diceGrid?.width}
                  gridHeight={diceGrid?.height}
                  frameWidth={frameWidth}
                  frameHeight={frameHeight}
                  dieSize={dieSize}
                  costPer1000={costPer1000}
                  onDieSizeChange={handleDieSizeChange}
                  onCostPer1000Change={handleCostChange}
                  imageUrl={processedImageUrl || croppedImage || undefined}
                />
              </div>
              
              {/* Build progress */}
              {buildNavigation && (
                <div 
                  className="backdrop-blur-md border text-white px-4 py-3 rounded-2xl"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(10px)',
                    borderColor: `${theme.colors.accent.purple}33`,
                    boxShadow: `0 10px 40px rgba(139, 92, 246, 0.25),
                               0 0 60px rgba(59, 130, 246, 0.08),
                               0 5px 20px rgba(0, 0, 0, 0.3)`
                  }}
                >
                  <BuildProgress
                    currentX={buildProgress.x}
                    currentY={buildProgress.y}
                    totalRows={diceGrid.height}
                    totalCols={diceGrid.width}
                    currentDice={null}
                    currentIndex={buildProgress.y * diceGrid.width + buildProgress.x}
                    totalDice={diceGrid.width * diceGrid.height}
                    onNavigate={(direction) => {
                      if (direction === 'prev') buildNavigation.navigatePrev()
                      else if (direction === 'next') buildNavigation.navigateNext()
                      else if (direction === 'prevDiff') buildNavigation.navigatePrevDiff()
                      else if (direction === 'nextDiff') buildNavigation.navigateNextDiff()
                    }}
                    canNavigate={buildNavigation.canNavigate}
                  />
                </div>
              )}
            </div>
            
            {/* Main build viewer */}
            <BuildViewer 
              key={`${currentProjectId}-viewer`}
              grid={diceGrid}
              initialX={buildProgress.x}
              initialY={buildProgress.y}
              onPositionChange={handleBuildProgressUpdate}
              onNavigationReady={handleNavigationReady}
            />
          </div>
        ) : croppedImage ? (
          // Show DiceCanvas to generate the grid
          <div className="flex justify-center">
            <DiceCanvas
              imageUrl={croppedImage ?? ''}
              params={diceParams}
              onStatsUpdate={handleStatsUpdate}
              onGridUpdate={handleGridUpdate}
              onProcessedImageReady={setProcessedImageUrl}
              maxWidth={900}
              maxHeight={600}
              currentStep={step}
            />
          </div>
        ) : (
          <div className="text-center text-white/60 mt-20">
            <p>No image data available.</p>
            <p className="text-sm mt-2">Please go back to the Upload or Crop step.</p>
          </div>
        )
        )}

      </main>
      
      {/* Build Progress Dialog */}
      <ConfirmDialog
        isOpen={showBuildProgressDialog}
        title="Build in Progress"
        message="You have a build in progress. Are you sure you want to reset?"
        progress={buildProgress.percentage}
        confirmText="Reset"
        confirmButtonColor={theme.colors.accent.pink}
        cancelText="Back to Build"
        cancelButtonColor={theme.colors.accent.blue}
        onConfirm={handleResetBuildProgress}
        onCancel={handleStayInBuild}
      />
      
      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false)
          setStep('build')
          // After login, fetch projects and show modal
          fetchUserProjects().then(() => {
            setShowProjectModal(true)
          })
        }}
        message="Sign in to save your progress and start building your dice art"
      />
      
      {/* Project Selection Modal */}
      <ProjectSelectionModal
        isOpen={showProjectModal}
        // Don't provide onClose if user is logged in and has no active project - they must select one
        onClose={(!session?.user || currentProjectId) ? () => setShowProjectModal(false) : undefined}
        onCreateFromCurrent={originalImage ? createProjectFromCurrent : undefined}
        onCreateNew={createProject}
        onSelectProject={(projectId) => {
          const project = userProjects.find(p => p.id === projectId)
          if (project) {
            loadProject(project)
            setShowProjectModal(false)
          }
        }}
        onDeleteProject={deleteProject}
        projects={userProjects}
        hasCurrentState={!!originalImage}
        maxProjects={3}
      />
    </div>
  )
}