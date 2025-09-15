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

import { useState, useEffect, useRef, useMemo, useCallback, Suspense } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
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
import AuthModal from '@/components/AuthModal'
import { theme } from '@/lib/theme'
import { WorkflowStep, DiceParams, DiceStats, DiceGrid } from '@/lib/types'

function EditorContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState<WorkflowStep>('upload')
  const [lastReachedStep, setLastReachedStep] = useState<WorkflowStep>('upload')
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showProjectModal, setShowProjectModal] = useState(false)
  
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
  const [projectName, setProjectName] = useState(`Untitled Project ${Math.random().toString(36).substring(2, 5).toUpperCase()}`)
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [showProjectsSubmenu, setShowProjectsSubmenu] = useState(false)
  const [isRestoringOAuthState, setIsRestoringOAuthState] = useState(false)
  const [userProjects, setUserProjects] = useState<any[]>([])
  const [hasCropChanged, setHasCropChanged] = useState(false)
  const [hasTuneChanged, setHasTuneChanged] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  
  // Memoize frame dimensions to prevent re-renders
  const frameWidth = useMemo(() => {
    return diceGrid ? (diceGrid.width * dieSize) / 10 : undefined
  }, [diceGrid?.width, dieSize])
  
  const frameHeight = useMemo(() => {
    return diceGrid ? (diceGrid.height * dieSize) / 10 : undefined
  }, [diceGrid?.height, dieSize])
  
  // Build progress tracking
  const [buildProgress, setBuildProgressRaw] = useState<{ x: number; y: number; percentage: number }>({
    x: 0,
    y: 0,
    percentage: 0
  })

  // Wrap setBuildProgress to add logging
  const setBuildProgress = (value: React.SetStateAction<{ x: number; y: number; percentage: number }>) => {
    if (typeof value === 'function') {
      setBuildProgressRaw((prev) => {
        const newValue = value(prev)
        console.log('[DEBUG] setBuildProgress (function) - prev:', prev, 'new:', newValue)
        return newValue
      })
    } else {
      console.log('[DEBUG] setBuildProgress - setting to:', value)
      setBuildProgressRaw(value)
    }
  }
  const [lastGridHash, setLastGridHash] = useState<string>('')
  
  // Compute if we should warn when exiting build step (only true if not at starting position)
  const shouldWarnOnExit = step === 'build' && (buildProgress.x !== 0 || buildProgress.y !== 0)
  
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
  // Keep latest buildProgress in a ref to avoid stale closures
  const buildProgressRef = useRef(buildProgress)
  buildProgressRef.current = buildProgress

  // Track when we're loading a project to prevent resetting build progress
  const loadingProjectRef = useRef(false)

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.user-menu-container')) {
        setShowUserMenu(false)
        setShowProjectsSubmenu(false)
      }
    }

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showUserMenu])


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

  const handleCropComplete = useCallback((croppedImageUrl: string, params: { x: number, y: number, width: number, height: number, rotation: number }) => {
    // Use functional updates to avoid dependency on current state
    setCropParams(prevParams => {
      // Check if crop parameters actually changed
      const hasChanged = !areCropParamsEqual(prevParams, params)
      
      // Only mark as changed if parameters are different
      if (hasChanged) {
        // Changes tracked internally
        setHasCropChanged(true) // Mark that crop has changed
        console.log('[CROP] Crop parameters changed')
        
        // When crop changes, reset lastReachedStep to 'tune' if needed
        setLastReachedStep(prev => {
          if (prev === 'build') {
            console.log('[CROP] Resetting lastReachedStep to tune - user must re-tune after crop change')
            return 'tune'
          }
          return prev
        })
        
        // Reset build progress if there was any
        setBuildProgress(prevProgress => {
          if (prevProgress.x !== 0 || prevProgress.y !== 0) {
            console.log('[CROP] Reset build progress due to crop change')
            return { x: 0, y: 0, percentage: 0 }
          }
          return prevProgress
        })
      } else {
        console.log('[CROP] Crop parameters unchanged')
      }
      
      return params
    })
    
    // Store the generated cropped image
    setCroppedImage(croppedImageUrl)
  }, [])  // No dependencies - using functional updates instead

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
      
      // Reset build progress if there was any
      if (buildProgress.x !== 0 || buildProgress.y !== 0) {
        setBuildProgress({ x: 0, y: 0, percentage: 0 })
        console.log('[TUNE] Reset build progress due to parameter change')
      }
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
      console.log('[DEBUG] Grid hash changed:', { old: lastGridHash, new: newHash })
      setLastGridHash(newHash)
      // Only reset build progress if we're not in the process of loading a project
      // The loadingProjectRef will be true when we're loading a project
      if (!loadingProjectRef.current) {
        console.log('[DEBUG] Resetting build progress due to grid change (not loading project)')
        setBuildProgress({ x: 0, y: 0, percentage: 0 })
      } else {
        console.log('[DEBUG] Skipping build progress reset - loading project')
      }
    }
  }
  
  // Throttle position updates to reduce parent re-renders
  const lastUpdateTimeRef = useRef(0)
  const pendingUpdateRef = useRef<{ x: number; y: number } | null>(null)
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  
  // Continue to the attempted step (progress will be reset when params change)
  const handleContinueToStep = () => {
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
    // Clear localStorage when resetting
    localStorage.removeItem('editorState')
    console.log('[LOCAL STORAGE] Cleared - workflow reset')
  }
  
  // Handle stepper click navigation - simplified: allow clicking any step if image is uploaded
  
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

  // Fetch user projects
  const fetchUserProjects = useCallback(async () => {
    if (!session?.user?.id) return
    
    console.log('[CLIENT] fetchUserProjects called - stack trace:', new Error().stack?.split('\n').slice(1, 4).join('\n'))
    console.log(`[DB] Fetching all projects for user`)
    try {
      const response = await fetch('/api/projects')
      if (response.ok) {
        const projects = await response.json()
        console.log('[DEBUG] Projects fetched from API:', projects.map((p: any) => ({
          id: p.id,
          name: p.name,
          currentX: p.currentX,
          currentY: p.currentY,
          percentComplete: p.percentComplete
        })))
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
    
    // Generate random 3 characters for default name
    const randomChars = Math.random().toString(36).substring(2, 5).toUpperCase()
    const defaultName = `Untitled Project ${randomChars}`
    
    // Saving automatically
    console.log(`[DB] Creating new empty project`)
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
        setLastSaved(new Date())  // New project just created
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
    
    // Generate random 3 characters for default name
    const randomChars = Math.random().toString(36).substring(2, 5).toUpperCase()
    const defaultName = `Untitled Project ${randomChars}`
    
    // Saving automatically
    console.log(`[DB] Creating new project with current state`)
    console.log('[DB] Current state when creating project:')
    console.log('  - originalImage:', originalImage ? `${originalImage.substring(0, 50)}...` : 'null')
    console.log('  - croppedImage:', croppedImage ? `${croppedImage.substring(0, 50)}...` : 'null')
    console.log('  - processedImageUrl:', processedImageUrl ? `${processedImageUrl.substring(0, 50)}...` : 'null')
    console.log('  - lastReachedStep:', lastReachedStep)
    console.log('  - diceParams:', diceParams)
    console.log('  - diceStats:', diceStats)
    
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
      
      console.log('[DB] Payload being sent to API:')
      console.log('  - originalImage in payload:', payload.originalImage ? `${payload.originalImage.substring(0, 50)}...` : 'null')
      console.log('  - croppedImage in payload:', payload.croppedImage ? `${payload.croppedImage.substring(0, 50)}...` : 'null')
      
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
        setLastSaved(new Date())  // New project just created from current state
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
          setCurrentProjectId(null)
          setProjectName(`Untitled Project ${Math.random().toString(36).substring(2, 5).toUpperCase()}`)
          updateURLWithProject(null)
        }
        
        // Check if we're in capacity modal and have work to save
        if (showProjectModal) {
          console.log('[DEBUG] Project deleted from capacity modal - checking if we need to save restored state')
          setShowProjectModal(false)
          
          // Check if user has work in progress that needs to be saved
          const hasWorkInProgress = originalImage || processedImageUrl
          if (hasWorkInProgress) {
            console.log('[DEBUG] User has work in progress after deletion - auto-creating project')
            // Now that we have space, auto-create project from current state
            await createProjectFromCurrent()
            // Clear localStorage after creating project from local state
            localStorage.removeItem('editorState')
            console.log('[LOCAL STORAGE] Cleared after creating project from deletion modal')
          } else {
            console.log('[DEBUG] No work in progress - creating fresh project')
            // No work in progress, create fresh project
            createProject()
            // Clear localStorage after creating fresh project
            localStorage.removeItem('editorState')
            console.log('[LOCAL STORAGE] Cleared after creating fresh project from deletion modal')
          }
        }
      }
    } catch (error) {
      console.error('Failed to delete project:', error)
    }
  }, [session, currentProjectId, fetchUserProjects, resetWorkflow, showProjectModal, originalImage, processedImageUrl, createProjectFromCurrent, createProject])

  // Save only progress fields (for build step)
  const saveProgressOnly = useCallback(async () => {
    if (!session?.user?.id || !currentProjectId) return

    setIsSaving(true)
    // Use ref to get the latest values, avoiding stale closure
    const currentProgress = buildProgressRef.current
    console.log(`[PROGRESS] About to save progress for project ${currentProjectId}`)
    console.log(`[PROGRESS] Current buildProgress from ref - x: ${currentProgress.x}, y: ${currentProgress.y}, percentage: ${currentProgress.percentage}`)
    console.log(`[PROGRESS] Total dice count: ${diceStats.totalCount}`)
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
        console.log('Progress saved successfully')
        setLastSaved(new Date())
        // Update local lastReachedStep to build if it wasn't already
        setLastReachedStep(prev => prev === 'build' ? prev : 'build')
        // Clear localStorage since data is saved to database
        localStorage.removeItem('editorState')
        console.log('[LOCAL STORAGE] Cleared - progress saved to database')
      }
    } catch (error) {
      console.error('Failed to save progress:', error)
    } finally {
      setIsSaving(false)
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
        setLastSaved(new Date())
        // Clear localStorage since data is saved to database
        localStorage.removeItem('editorState')
        console.log('[LOCAL STORAGE] Cleared - upload saved to database')
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
        setLastSaved(new Date())
        // Clear localStorage since data is saved to database
        localStorage.removeItem('editorState')
        console.log('[LOCAL STORAGE] Cleared - crop saved to database')
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
          // Always set to 'build' when saving tune params
          lastReachedStep: 'build'
        })
      })

      if (response.ok) {
        console.log('Tune parameters saved successfully')
        setLastSaved(new Date())
        // Clear localStorage since data is saved to database
        localStorage.removeItem('editorState')
        console.log('[LOCAL STORAGE] Cleared - tune saved to database')
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

      // 3. LEAVING build step: save progress if we have any
      if (step === 'build' && newStep !== 'build' && currentProjectId && session?.user?.id) {
        const currentProgress = buildProgressRef.current
        if (currentProgress.x > 0 || currentProgress.y > 0) {
          console.log('[CLIENT] Leaving build step, saving progress')
          await saveProgressOnly()
        }
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
  }, [step, lastReachedStep, cropParams, currentProjectId, session, saveCropStep, saveTuneStep, saveProgressOnly, hasCropChanged, hasTuneChanged])


  // Handle navigation with build progress check
  const handleStepNavigation = useCallback((newStep: WorkflowStep) => {
    console.log(`[CLIENT] handleStepNavigation called: ${newStep}`)
    // Check if trying to enter build step without auth
    if (newStep === 'build' && status !== 'authenticated') {
      // Store that user wanted to go to build after login
      sessionStorage.setItem('intendedStepAfterLogin', 'build')
      // Allow navigation to build step - user can explore up to x=3
      setStep('build')
      setLastReachedStep('build')
      // Auth modal will show when they try to go beyond x=3
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

  // Load a project
  const loadProject = useCallback(async (project: any) => {
    console.log('[CLIENT] Loading project:', project.name, 'step:', project.lastReachedStep)
    console.log('[DEBUG] Project data received:', {
      id: project.id,
      currentX: project.currentX,
      currentY: project.currentY,
      percentComplete: project.percentComplete,
      totalDice: project.totalDice,
      completedDice: project.completedDice
    })

    // Set loading flag to prevent build progress reset
    loadingProjectRef.current = true

    // Don't save progress when loading a new project - it causes contamination issues

    // If project doesn't have image data but needs it, fetch full project
    if (!project.croppedImage && !project.originalImage && project.lastReachedStep !== 'upload') {
      console.log(`[DB] Fetching full project data for ${project.id}`)
      try {
        const response = await fetch(`/api/projects/${project.id}`)
        if (response.ok) {
          const fullProject = await response.json()
          console.log('Fetched full project with image data')
          console.log('[DEBUG] Full project data:', {
            id: fullProject.id,
            currentX: fullProject.currentX,
            currentY: fullProject.currentY,
            percentComplete: fullProject.percentComplete
          })
          project = fullProject // Just use the full project data - it has everything
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
    // Don't reset build progress here - we'll set it to the correct values below
    
    // Set project info
    console.log('[DEBUG] About to set currentProjectId from', currentProjectId, 'to', project.id)
    setCurrentProjectId(project.id)
    setProjectName(project.name)
    updateURLWithProject(project.id)

    // Set last saved date from project's updatedAt
    if (project.updatedAt) {
      setLastSaved(new Date(project.updatedAt))
    }
    
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
    setDiceParams(prev => ({
      ...prev,
      ...newDiceParams
    }))

    // Set the grid hash to prevent reset when grid is generated
    const newHash = generateGridHash(newDiceParams)
    setLastGridHash(newHash)
    console.log('[DEBUG] Set initial grid hash during project load:', newHash)
    
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
    
    // Load build progress - do this AFTER setting project ID to avoid saving to wrong project
    console.log('[CLIENT] Loading build progress from project:', {
      currentX: project.currentX,
      currentY: project.currentY,
      percentComplete: project.percentComplete
    })
    const newProgress = {
      x: project.currentX || 0,
      y: project.currentY || 0,
      percentage: project.percentComplete || 0
    }
    console.log('[DEBUG] Setting buildProgress to:', newProgress)
    setBuildProgress(newProgress)

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

    // Clear loading flag after a short delay
    setTimeout(() => {
      loadingProjectRef.current = false
      console.log('[DEBUG] Project loading complete - clearing loading flag')
    }, 100)
  }, [saveProgressOnly])

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
      console.log('[AUTO-SAVE] Resetting 15-second auto-save timer')
    } else {
      console.log('[AUTO-SAVE] Starting 15-second auto-save timer')
    }
    
    // Schedule new save after 15 seconds
    buildAutoSaveTimeoutRef.current = setTimeout(() => {
      console.log('[AUTO-SAVE] Saving build progress after 15 seconds of inactivity')
      saveProgressOnly()
    }, 15000) // 15 seconds delay
  }, [saveProgressOnly])
  
  // Clean up timeouts on unmount and save build progress
  useEffect(() => {
    // Handle browser tab close/refresh
    const handleBeforeUnload = () => {
      if (step === 'build' && currentProjectId && session?.user?.id) {
        const currentProgress = buildProgressRef.current
        if (currentProgress.x > 0 || currentProgress.y > 0) {
          console.log('[CLIENT] Page unloading, saving build progress')
          // Use navigator.sendBeacon for reliable saving on page unload
          const data = JSON.stringify({
            currentX: currentProgress.x,
            currentY: currentProgress.y,
            completedDice: Math.floor((currentProgress.percentage / 100) * diceStats.totalCount),
            lastReachedStep: 'build'
          })
          navigator.sendBeacon(`/api/projects/${currentProjectId}/progress`, data)
        }
      }
    }

    // Add event listener
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      // Remove event listener
      window.removeEventListener('beforeunload', handleBeforeUnload)

      // Clear timeouts
      if (buildAutoSaveTimeoutRef.current) {
        clearTimeout(buildAutoSaveTimeoutRef.current)
      }

      // Save build progress on component unmount
      handleBeforeUnload()
    }
  }, [step, currentProjectId, session?.user?.id, diceStats.totalCount])
  
  // Memoize the navigation ready handler
  const handleNavigationReady = useCallback((nav: any) => {
    setBuildNavigation(nav)
  }, [])

  // Handle project loading from URL
  useEffect(() => {
    const projectId = searchParams.get('project')
    if (projectId && session?.user?.id && !currentProjectId) {
      console.log('[URL] Loading project from URL:', projectId)
      // Fetch and load the specific project
      fetch(`/api/projects/${projectId}`)
        .then(response => {
          if (response.ok) {
            return response.json()
          }
          throw new Error('Project not found')
        })
        .then(project => {
          console.log('[URL] Project loaded from URL')
          loadProject(project)
        })
        .catch(error => {
          console.error('[URL] Failed to load project from URL:', error)
          // Clear invalid project ID from URL
          updateURLWithProject(null)
        })
    }
  }, [searchParams, session?.user?.id, currentProjectId, loadProject, updateURLWithProject])

  // Save state to localStorage whenever it changes (for recovery on refresh)
  useEffect(() => {
    // Only save if NOT logged in and we have meaningful state
    if (!session?.user?.id && (originalImage || croppedImage || (cropParams && Object.keys(cropParams).length > 0))) {
      const stateToSave = {
        originalImage,
        croppedImage,
        processedImageUrl,
        cropParams,
        diceParams,
        step,
        lastReachedStep,
        dieSize,
        costPer1000,
        projectName,
        buildProgress,
        diceStats
      }
      localStorage.setItem('editorState', JSON.stringify(stateToSave))
      console.log('[LOCAL STORAGE] Saved editor state (not logged in)')
    } else if (session?.user?.id) {
      // Clear localStorage when logged in (using database instead)
      localStorage.removeItem('editorState')
    }
  }, [session?.user?.id, originalImage, croppedImage, processedImageUrl, cropParams, diceParams, step, lastReachedStep, dieSize, costPer1000, projectName, buildProgress, diceStats])

  // Restore state from localStorage on mount (if no project is loaded)
  useEffect(() => {
    // Skip if still determining session status
    if (status === 'loading') return
    
    // Only restore if not logged in, don't have a project, and aren't in OAuth flow
    if (!session?.user?.id && !currentProjectId && !searchParams.get('restored')) {
      const savedState = localStorage.getItem('editorState')
      if (savedState) {
        try {
          const state = JSON.parse(savedState)
          console.log('[LOCAL STORAGE] Found saved editor state, restoring...')
          
          // Only restore if the saved state has actual content
          if (state.originalImage || state.croppedImage) {
            // Restore all state
            if (state.originalImage) setOriginalImage(state.originalImage)
            if (state.croppedImage) setCroppedImage(state.croppedImage)
            if (state.processedImageUrl) setProcessedImageUrl(state.processedImageUrl)
            if (state.cropParams) setCropParams(state.cropParams)
            if (state.diceParams) setDiceParams(state.diceParams)
            if (state.dieSize) setDieSize(state.dieSize)
            if (state.costPer1000) setCostPer1000(state.costPer1000)
            if (state.projectName) setProjectName(state.projectName)
            if (state.buildProgress) setBuildProgress(state.buildProgress)
            if (state.diceStats) setDiceStats(state.diceStats)
            if (state.step) setStep(state.step)
            if (state.lastReachedStep) setLastReachedStep(state.lastReachedStep)
            
            console.log('[LOCAL STORAGE] State restored successfully')
            // Add small delay to ensure state is applied before showing UI
            setTimeout(() => setIsInitializing(false), 500)
          } else {
            // No state to restore
            setIsInitializing(false)
          }
        } catch (err) {
          console.error('[LOCAL STORAGE] Failed to restore state:', err)
          setIsInitializing(false)
        }
      } else {
        // No saved state
        setIsInitializing(false)
      }
    }
  }, [status, session?.user?.id, currentProjectId, searchParams]) // Re-run when session status changes

  // Handle OAuth restoration after redirect
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('restored') === 'true') {
      console.log('[DEBUG] OAuth redirect detected, checking for saved state')
      setIsRestoringOAuthState(true)
      const savedState = sessionStorage.getItem('editorStateBeforeAuth')
      if (savedState) {
        try {
          const state = JSON.parse(savedState)
          console.log('[DEBUG] Restoring editor state after OAuth redirect')
          console.log('[DEBUG] Saved state contains:')
          console.log('  - originalImage:', state.originalImage ? `${state.originalImage.substring(0, 50)}...` : 'null')
          console.log('  - croppedImage:', state.croppedImage ? `${state.croppedImage.substring(0, 50)}...` : 'null')
          console.log('  - processedImageUrl:', state.processedImageUrl ? `${state.processedImageUrl.substring(0, 50)}...` : 'null')
          console.log('  - step:', state.step)
          console.log('  - lastReachedStep:', state.lastReachedStep)
          console.log('  - cropParams:', state.cropParams)
          console.log('  - diceParams:', state.diceParams)
          
          // Restore the state
          if (state.originalImage) {
            console.log('[DEBUG] Restoring originalImage')
            setOriginalImage(state.originalImage)
          }
          if (state.croppedImage) {
            console.log('[DEBUG] Restoring croppedImage')
            setCroppedImage(state.croppedImage)
          }
          if (state.processedImageUrl) {
            console.log('[DEBUG] Restoring processedImageUrl')
            setProcessedImageUrl(state.processedImageUrl)
          }
          if (state.cropParams) {
            console.log('[DEBUG] Restoring cropParams')
            setCropParams(state.cropParams)
          }
          if (state.diceParams) {
            console.log('[DEBUG] Restoring diceParams')
            setDiceParams(state.diceParams)
          }
          if (state.step) {
            console.log('[DEBUG] Restoring step')
            setStep(state.step)
          }
          if (state.lastReachedStep) {
            console.log('[DEBUG] Restoring lastReachedStep')
            setLastReachedStep(state.lastReachedStep)
          }
          
          // Clear the saved state and URL param
          sessionStorage.removeItem('editorStateBeforeAuth')
          window.history.replaceState({}, '', '/editor')
          
          // Set flag for auto-save ONLY if there's actual work (an image) to save
          if (state.originalImage || state.processedImageUrl) {
            console.log('[DEBUG] Setting flag for auto-save after restoration completes (has image)')
            sessionStorage.setItem('shouldAutoSaveRestoredState', 'true')
          } else {
            console.log('[DEBUG] No image in restored state, skipping auto-save flag')
          }
          
          // Check if user intended to go to build step after login
          const intendedStep = sessionStorage.getItem('intendedStepAfterLogin')
          if (intendedStep === 'build') {
            console.log('[DEBUG] User intended to go to build step after login - navigating there')
            sessionStorage.removeItem('intendedStepAfterLogin')
            // Set step to build after restoration
            setStep('build')
            setLastReachedStep('build')
          }
          
          // Mark restoration as complete - this will trigger auto-save logic
          console.log('[DEBUG] OAuth state restoration complete')
          // Note: The state variables here will show old values due to closure, but setState calls have been made
          setIsRestoringOAuthState(false)
        } catch (err) {
          console.error('[DEBUG] Failed to restore state:', err)
          setIsRestoringOAuthState(false)
        }
      } else {
        setIsRestoringOAuthState(false)
      }
    }
  }, []) // Run once on mount

  // Handle user login - auto-create project or show capacity modal
  useEffect(() => {
    // Skip if still determining session status
    if (status === 'loading') return
    
    console.log('[LOGIN EFFECT] Triggered with:', {
      sessionStatus: status,
      hasSession: !!session?.user?.id,
      currentProjectId,
      isRestoringOAuthState,
      originalImage: !!originalImage,
      processedImageUrl: !!processedImageUrl,
      croppedImage: !!croppedImage
    })
    
    // Only run this logic when user just logged in and has no project loaded yet
    if (session?.user?.id && !currentProjectId && !isRestoringOAuthState) {
      console.log('[LOGIN EFFECT] User logged in without current project, fetching user projects...')
      fetchUserProjects().then((projects) => {
        const projectCount = (projects || []).length
        console.log('[LOGIN EFFECT] Projects fetched:', {
          projectCount,
          projects: projects?.map((p: any) => ({ id: p.id, name: p.name, updatedAt: p.updatedAt }))
        })
        
        // Check if user has work in progress (including restored OAuth state)
        const shouldAutoSaveRestoredState = sessionStorage.getItem('shouldAutoSaveRestoredState') === 'true'
        const hasWorkInProgress = originalImage || processedImageUrl || shouldAutoSaveRestoredState
        
        console.log('[LOGIN EFFECT] Work state check:', {
          shouldAutoSaveRestoredState,
          hasOriginalImage: !!originalImage,
          hasProcessedImageUrl: !!processedImageUrl,
          hasCroppedImage: !!croppedImage,
          hasWorkInProgress
        })
        
        if (shouldAutoSaveRestoredState) {
          console.log('[LOGIN EFFECT] Found shouldAutoSaveRestoredState flag - state should now be restored')
          sessionStorage.removeItem('shouldAutoSaveRestoredState')
        }
        
        if (hasWorkInProgress) {
          // User has work - try to save it
          console.log('[LOGIN EFFECT] User has work in progress')
          if (projectCount < 3) {
            // Under limit - auto-create project from current state
            console.log('[LOGIN EFFECT] Creating project from current state...')
            createProjectFromCurrent().then(() => {
              console.log('[LOGIN EFFECT] Work saved successfully as new project')
            }).catch(err => {
              console.error('[LOGIN EFFECT] Failed to auto-save work:', err)
            })
          } else {
            // At capacity - show deletion modal 
            console.log('[LOGIN EFFECT] At capacity with unsaved work - showing deletion modal')
            setShowProjectModal(true)
          }
        } else {
          // No work in progress - load most recent project if available
          console.log('[LOGIN EFFECT] No work in progress')
          // Don't load a project if URL already has a project ID (will be handled by URL effect)
          const urlProjectId = searchParams.get('project')
          if (!urlProjectId && projects && projects.length > 0) {
            // Load the most recent project (already sorted by updatedAt desc from API)
            const mostRecentProject = projects[0]
            console.log('[LOGIN EFFECT] Loading most recent project:', mostRecentProject.name, mostRecentProject.id)
            loadProject(mostRecentProject)
          } else if (!urlProjectId && projectCount < 3) {
            // No existing projects and under limit - create fresh project
            console.log('[LOGIN EFFECT] No existing projects - creating fresh project')
            createProject()
          } else if (!urlProjectId && projectCount >= 3) {
            // At capacity with no projects (shouldn't happen)
            console.log('[LOGIN EFFECT] At capacity with no projects - showing deletion modal') 
            setShowProjectModal(true)
          }
        }
        // Mark initialization as complete after handling all login logic with small delay
        setTimeout(() => setIsInitializing(false), 500)
      }).catch(err => {
        console.error('[LOGIN EFFECT] Failed to fetch projects:', err)
        // Still mark as complete even on error
        setTimeout(() => setIsInitializing(false), 500)
      })
    } else {
      console.log('[LOGIN EFFECT] Conditions not met, skipping:', {
        hasSession: !!session?.user?.id,
        hasCurrentProjectId: !!currentProjectId,
        isRestoringOAuthState
      })
      // Mark initialization as complete if not logged in or already has project
      if (!session?.user?.id || currentProjectId) {
        setTimeout(() => setIsInitializing(false), 500)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, currentProjectId, isRestoringOAuthState, originalImage, processedImageUrl, croppedImage])

  
  // Clear localStorage when a project is loaded or workflow is reset
  useEffect(() => {
    if (currentProjectId) {
      // Clear localStorage when a project is loaded
      localStorage.removeItem('editorState')
      console.log('[LOCAL STORAGE] Cleared - project loaded')
    }
  }, [currentProjectId])

  // Handle build progress updates with throttling
  const handleBuildProgressUpdate = useCallback((x: number, y: number) => {
    if (!diceGrid) return

    // Check if user is trying to go beyond x=3 without authentication
    if (!session && x > 3) {
      console.log('[AUTH] User tried to navigate beyond x=3 without authentication')
      setShowAuthModal(true)
      return // Prevent the update
    }

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
        
        const newProgress = { x, y, percentage }
        console.log(`[BUILD] Setting buildProgress to x: ${x}, y: ${y}, percentage: ${percentage}`)
        
        // Schedule auto-save
        if (session?.user?.id && currentProjectId) {
          scheduleBuildAutoSave()
        }
        
        return newProgress
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
            
            const newProgress = { x: pending.x, y: pending.y, percentage }
            
            // Schedule auto-save
            if (session?.user?.id && currentProjectId) {
              scheduleBuildAutoSave()
            }
            
            return newProgress
          })
          pendingUpdateRef.current = null
        }
        updateTimeoutRef.current = null
      }, delay)
    }
  }, [diceGrid, session, currentProjectId, scheduleBuildAutoSave, setShowAuthModal])
  
  // No cleanup needed - removed auto-save timers

  // Show loading screen while initializing or session is loading
  if (isInitializing || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#000000' }}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mb-4"></div>
          <p className="text-white text-lg">Loading workspace...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: '#000000' }}>
      
      <header 
        className="relative" 
        style={{ 
          zIndex: 50
        }}
      >
        <div className="max-w-7xl mx-auto px-4 py-4 relative">
          {/* Top row with logo and auth */}
          <div className="flex items-center">
            {/* Logo - always on left */}
            <Link href="/" className="flex-shrink-0 hover:opacity-80 transition-opacity">
              <Logo />
            </Link>
            
            {/* Spacer for desktop */}
            <div className="flex-1 hidden sm:block"></div>
            
            {/* Auth Button - always on right */}
            <div className="ml-auto">
              {status === 'authenticated' && session ? (
              <div className="flex items-center gap-3">
                <div className="relative user-menu-container">
                  <div 
                    className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-600 hover:border-gray-400 transition-colors cursor-pointer"
                    onClick={() => {
                      setShowUserMenu(!showUserMenu)
                      if (!showUserMenu) {
                        fetchUserProjects()
                      }
                    }}
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
                    <div className="absolute top-full right-0 mt-2 bg-gray-900 rounded-lg shadow-xl border border-gray-700 overflow-hidden z-50" style={{ minWidth: '250px' }}>
                      <div className="px-4 py-3 border-b border-gray-700">
                        <div className="text-sm font-medium text-white">
                          {session.user?.name || 'User'}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {session.user?.email}
                        </div>
                      </div>
                      
                      {/* Projects Menu Item */}
                      <div className="relative">
                        <button
                          onClick={() => setShowProjectsSubmenu(!showProjectsSubmenu)}
                          className="w-full px-4 py-2 text-sm text-left text-white/90 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-between"
                        >
                          <span>Projects</span>
                          <svg 
                            className={`w-4 h-4 transition-transform ${showProjectsSubmenu ? 'rotate-180' : ''}`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        
                        {/* Projects Submenu */}
                        {showProjectsSubmenu && (
                          <div className="border-t border-gray-700">
                            {userProjects.length > 0 ? (
                              <>
                                {userProjects.map((project) => (
                                  <div
                                    key={project.id}
                                    className="w-full px-6 py-2 text-sm hover:bg-white/10 transition-colors flex items-center justify-between group"
                                  >
                                    <button
                                      onClick={() => {
                                        console.log('[DEBUG] Loading project from menu:', {
                                          id: project.id,
                                          name: project.name,
                                          currentX: project.currentX,
                                          currentY: project.currentY,
                                          percentComplete: project.percentComplete
                                        })
                                        loadProject(project)
                                        setShowUserMenu(false)
                                        setShowProjectsSubmenu(false)
                                      }}
                                      className="flex-1 min-w-0 text-left flex items-center"
                                    >
                                      <div className="flex-1 min-w-0">
                                        <div className="text-white/80 truncate">
                                          {project.name || 'Untitled Project'}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          {new Date(project.updatedAt).toLocaleDateString()}
                                          {project.percentComplete !== undefined && (
                                            <span className="ml-1">• {Math.round(project.percentComplete)}%</span>
                                          )}
                                        </div>
                                      </div>
                                    </button>
                                    <div className="flex items-center gap-2 ml-2">
                                      {project.id === currentProjectId ? (
                                        <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                      ) : (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            deleteProject(project.id)
                                          }}
                                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 transition-all"
                                          title="Delete project"
                                        >
                                          <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                          </svg>
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                                {userProjects.length < 3 && (
                                  <button
                                    onClick={() => {
                                      createProject()
                                      setShowUserMenu(false)
                                      setShowProjectsSubmenu(false)
                                    }}
                                    className="w-full px-6 py-2 text-sm text-left text-blue-400 hover:text-blue-300 hover:bg-white/10 transition-colors flex items-center border-t border-gray-700"
                                  >
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Create New Project
                                  </button>
                                )}
                              </>
                            ) : (
                              <div className="px-6 py-3">
                                <div className="text-xs text-gray-500 mb-2">No projects yet</div>
                                <button
                                  onClick={() => {
                                    createProject()
                                    setShowUserMenu(false)
                                    setShowProjectsSubmenu(false)
                                  }}
                                  className="text-sm text-blue-400 hover:text-blue-300"
                                >
                                  Create your first project
                                </button>
                              </div>
                            )}
                            {userProjects.length >= 3 && (
                              <div className="px-6 py-2 text-xs text-gray-500 border-t border-gray-700">
                                At capacity (3 max)
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Sign Out */}
                      <button
                        onClick={() => {
                          setShowUserMenu(false)
                          setShowProjectsSubmenu(false)
                          signOut()
                        }}
                        className="w-full px-4 py-2 text-sm text-left text-white/90 hover:text-white hover:bg-white/10 transition-colors border-t border-gray-700"
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
          
          {/* Project name - absolutely positioned center on desktop, below logo on mobile */}
          <div className="sm:absolute sm:left-1/2 sm:top-4 sm:transform sm:-translate-x-1/2 mt-3 sm:mt-0 flex justify-center py-2">
            {session?.user && (
              <ProjectSelector 
                currentProject={projectName}
                currentProjectId={currentProjectId}
                lastSaved={lastSaved}
                isSaving={isSaving}
                onProjectChange={(name: string) => {
                  // Just update the local state - ProjectSelector handles the API call
                  setProjectName(name)
                  // Update the local projects list to reflect the change
                  setUserProjects(prev => prev.map(p => 
                    p.id === currentProjectId ? { ...p, name: name } : p
                  ))
                }}
              />
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative p-4">
        {/* Center: Stepper */}
        <div className="flex justify-center items-center mb-4">
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
          <div className="flex flex-col md:flex-row gap-6 justify-center items-center md:items-start">
            {/* Left floating panels */}
            <div className="flex flex-col space-y-4 w-80 flex-shrink-0">
              {/* Control panel - desktop: first, mobile: second (right above canvas) */}
              <div
                className="backdrop-blur-md rounded-2xl border overflow-hidden order-2 md:order-1"
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

              {/* Stats display - desktop: second, mobile: first */}
              <div
                className="backdrop-blur-md border text-white px-4 py-3 rounded-2xl order-1 md:order-2"
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
            </div>
            
            {/* Main content */}
            <div className="flex-1 min-w-0" style={{ maxWidth: '720px' }}>
              <DiceCanvas
                imageUrl={croppedImage ?? ''}
                params={diceParams}
                onStatsUpdate={handleStatsUpdate}
                onGridUpdate={handleGridUpdate}
                onProcessedImageReady={setProcessedImageUrl}
                maxWidth={720}
                maxHeight={600}
                currentStep={step}
              />
            </div>
          </div>
        )}

        {step === 'build' && (
          diceGrid ? (
          <div className="flex flex-col md:flex-row gap-6 justify-center items-center md:items-start">
            {/* Left floating panels */}
            <div className="flex flex-col space-y-4 w-80 flex-shrink-0">
              {/* Build progress - desktop: first, mobile: second (right above builder) */}
              {buildNavigation && (
                <div
                  className="backdrop-blur-md border text-white px-4 py-3 rounded-2xl order-2 md:order-1"
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
                      // Check if trying to go forward beyond x=3 without authentication
                      if (!session && (direction === 'next' || direction === 'nextDiff') && buildProgress.x >= 3) {
                        console.log('[AUTH] Navigation blocked at x=3 - showing auth modal')
                        setShowAuthModal(true)
                        return
                      }

                      if (direction === 'prev') buildNavigation.navigatePrev()
                      else if (direction === 'next') buildNavigation.navigateNext()
                      else if (direction === 'prevDiff') buildNavigation.navigatePrevDiff()
                      else if (direction === 'nextDiff') buildNavigation.navigateNextDiff()
                    }}
                    canNavigate={buildNavigation.canNavigate}
                  />
                </div>
              )}

              {/* Stats display - desktop: second, mobile: first */}
              <div
                className="backdrop-blur-md border text-white px-4 py-3 rounded-2xl order-1 md:order-2"
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
            </div>
            
            {/* Main build viewer */}
            <div className="flex-1 min-w-0">
              {(() => {
                console.log('[DEBUG] Passing to BuildViewer:', {
                  currentProjectId,
                  buildProgress,
                  'buildProgress.x': buildProgress.x,
                  'buildProgress.y': buildProgress.y
                })
                return null
              })()}
              <BuildViewer
                key={`${currentProjectId}-viewer`}
                grid={diceGrid}
                initialX={buildProgress.x}
                initialY={buildProgress.y}
                onPositionChange={handleBuildProgressUpdate}
                onNavigationReady={handleNavigationReady}
              />
            </div>
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
        message="Changing the underlying image would reset progress. Do you want to Proceed?"
        progress={buildProgress.percentage}
        confirmText="Yes"
        confirmButtonColor={theme.colors.accent.blue}
        cancelText="Back to Build"
        cancelButtonColor={theme.colors.accent.pink}
        onConfirm={handleContinueToStep}
        onCancel={handleStayInBuild}
      />
      
      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false)
          // User can continue exploring up to x=3
        }}
        onSuccess={() => {
          setShowAuthModal(false)
          setStep('build')
          // Everything else is handled automatically by the login useEffect
        }}
        message="To continue using the builder you must be signed in"
        editorState={{
          originalImage,
          croppedImage,
          processedImageUrl,
          cropParams,
          diceParams,
          step,
          lastReachedStep
        }}
      />
      
      {/* Project Capacity Modal - only shown when at capacity */}
      <ProjectSelectionModal
        isOpen={showProjectModal}
        onCreateFromCurrent={undefined} // No create options in new flow
        onCreateNew={createProject} // Keep this for TypeScript, though unused in new flow
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

// Export the page wrapped in Suspense to handle useSearchParams
export default function Editor() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#000000' }}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mb-4"></div>
          <p className="text-white text-lg">Loading workspace...</p>
        </div>
      </div>
    }>
      <EditorContent />
    </Suspense>
  )
}