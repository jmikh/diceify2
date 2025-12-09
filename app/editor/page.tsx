'use client'

import { useState, useEffect, useRef, useMemo, useCallback, Suspense } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

import {
  Dices
} from 'lucide-react'
import UploaderPanel from '@/components/Editor/Uploader/UploaderPanel'
import UploadMain from '@/components/Editor/Uploader/UploadMain'
import CropperPanel, { aspectRatioOptions } from '@/components/Editor/Cropper/CropperPanel'
import { AspectRatio } from '@/lib/types'
import CropperMain from '@/components/Editor/Cropper/CropperMain'
import DiceCanvas, { DiceCanvasRef } from '@/components/Editor/DiceCanvas'
import TunerPanel from '@/components/Editor/Tuner/TunerPanel'
import TunerMain from '@/components/Editor/Tuner/TunerMain'

import BuilderPanel from '@/components/Editor/Builder/BuilderPanel'
import BuilderMain from '@/components/Editor/Builder/BuilderMain'

import ProjectSelector from '@/components/Editor/ProjectSelector'
import ProjectSelectionModal from '@/components/ProjectSelectionModal'
import DiceStepper from '@/components/Editor/DiceStepper'
import Logo from '@/components/Logo'
import AuthModal from '@/components/AuthModal'
import DonationModal from '@/components/DonationModal'
import Footer from '@/components/Footer'
import { devLog, devError } from '@/lib/utils/debug'

import { useEditorStore } from '@/lib/store/useEditorStore'
import { useProjectManager } from './hooks/useProjectManager'
import { usePersistence } from './hooks/usePersistence'

function EditorContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()

  const diceCanvasRef = useRef<DiceCanvasRef>(null)

  // Custom Hooks
  const {
    userProjects,
    fetchUserProjects,
    createProject,
    deleteProject,
    loadProject,
    updateURLWithProject,
    loadingProjectRef,
    lastGridHash,
    setLastGridHash,
    generateGridHash
  } = useProjectManager()

  const {
    saveProgressOnly,
  } = usePersistence()


  // Store state
  const step = useEditorStore(state => state.step)
  const lastReachedStep = useEditorStore(state => state.lastReachedStep)
  const showAuthModal = useEditorStore(state => state.showAuthModal)
  const showProjectModal = useEditorStore(state => state.showProjectModal)
  const showDonationModal = useEditorStore(state => state.showDonationModal)

  const originalImage = useEditorStore(state => state.originalImage)
  const croppedImage = useEditorStore(state => state.croppedImage)
  const cropParams = useEditorStore(state => state.cropParams)
  const cropRotation = useEditorStore(state => state.cropRotation)
  const diceParams = useEditorStore(state => state.diceParams)
  const diceStats = useEditorStore(state => state.diceStats)
  const diceGrid = useEditorStore(state => state.diceGrid)
  const processedImageUrl = useEditorStore(state => state.processedImageUrl)
  const dieSize = useEditorStore(state => state.dieSize)
  const costPer1000 = useEditorStore(state => state.costPer1000)
  const projectName = useEditorStore(state => state.projectName)
  const currentProjectId = useEditorStore(state => state.currentProjectId)
  const lastSaved = useEditorStore(state => state.lastSaved)
  const isSaving = useEditorStore(state => state.isSaving)
  const isInitializing = useEditorStore(state => state.isInitializing)
  const buildProgress = useEditorStore(state => state.buildProgress)

  // Store actions
  const setStep = useEditorStore(state => state.setStep)
  const setLastReachedStep = useEditorStore(state => state.setLastReachedStep)
  const setShowAuthModal = useEditorStore(state => state.setShowAuthModal)
  const setShowProjectModal = useEditorStore(state => state.setShowProjectModal)
  const setShowDonationModal = useEditorStore(state => state.setShowDonationModal)
  const setOriginalImage = useEditorStore(state => state.setOriginalImage)
  const setCroppedImage = useEditorStore(state => state.setCroppedImage)
  const setCropParams = useEditorStore(state => state.setCropParams)
  const setDiceParams = useEditorStore(state => state.setDiceParams)
  const setDiceStats = useEditorStore(state => state.setDiceStats)
  const setDiceGrid = useEditorStore(state => state.setDiceGrid)
  const setProcessedImageUrl = useEditorStore(state => state.setProcessedImageUrl)
  const setDieSize = useEditorStore(state => state.setDieSize)
  const setCostPer1000 = useEditorStore(state => state.setCostPer1000)
  const setProjectName = useEditorStore(state => state.setProjectName)
  const setIsInitializing = useEditorStore(state => state.setIsInitializing)
  const setBuildProgress = useEditorStore(state => state.setBuildProgress)

  // Local UI state
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showProjectsSubmenu, setShowProjectsSubmenu] = useState(false)
  const [isRestoringOAuthState, setIsRestoringOAuthState] = useState(false)

  // Track window size for responsive cropper
  const [windowSize, setWindowSize] = useState({ width: 800, height: 600 })

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: typeof window !== 'undefined' ? window.innerWidth : 800,
        height: typeof window !== 'undefined' ? window.innerHeight : 600
      })
    }

    handleResize() // Set initial size
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])


  // Memoize frame dimensions to prevent re-renders
  const frameWidth = useMemo(() => {
    return diceGrid ? (diceGrid.width * dieSize) / 10 : undefined
  }, [diceGrid?.width, dieSize])

  const frameHeight = useMemo(() => {
    return diceGrid ? (diceGrid.height * dieSize) / 10 : undefined
  }, [diceGrid?.height, dieSize])

  // Auto-save timeout ref for build step
  const buildAutoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Keep latest buildProgress in a ref to avoid stale closures
  const buildProgressRef = useRef(buildProgress)
  buildProgressRef.current = buildProgress

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


  const handleGridUpdate = (grid: DiceGrid) => {
    setDiceGrid(grid)

    // Check if grid has changed
    const newHash = generateGridHash(diceParams)
    if (newHash !== lastGridHash) {
      devLog('[DEBUG] Grid hash changed:', { old: lastGridHash, new: newHash })
      setLastGridHash(newHash)
      // Only reset build progress if we're not in the process of loading a project
      // The loadingProjectRef will be true when we're loading a project
      if (!loadingProjectRef.current) {
        devLog('[DEBUG] Resetting build progress due to grid change (not loading project)')
        setBuildProgress({ x: 0, y: 0, percentage: 0 })
      } else {
        devLog('[DEBUG] Skipping build progress reset - loading project')
      }
    }
  }

  // Throttle position updates to reduce parent re-renders
  const lastUpdateTimeRef = useRef(0)
  const pendingUpdateRef = useRef<{ x: number; y: number } | null>(null)
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Schedule auto-save for build progress
  const scheduleBuildAutoSave = useCallback(() => {
    // Clear any existing timeout
    if (buildAutoSaveTimeoutRef.current) {
      clearTimeout(buildAutoSaveTimeoutRef.current)
      devLog('[AUTO-SAVE] Resetting 15-second auto-save timer')
    } else {
      devLog('[AUTO-SAVE] Starting 15-second auto-save timer')
    }

    // Schedule new save after 15 seconds
    buildAutoSaveTimeoutRef.current = setTimeout(() => {
      devLog('[AUTO-SAVE] Saving build progress after 15 seconds of inactivity')
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
          devLog('[CLIENT] Page unloading, saving build progress')
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

  // Handle project loading from URL
  useEffect(() => {
    const projectId = searchParams.get('project')
    if (projectId && session?.user?.id && !currentProjectId) {
      devLog('[URL] Loading project from URL:', projectId)
      // Fetch and load the specific project
      fetch(`/api/projects/${projectId}`)
        .then(response => {
          if (response.ok) {
            return response.json()
          }
          throw new Error('Project not found')
        })
        .then(project => {
          devLog('[URL] Project loaded from URL')
          loadProject(project)
        })
        .catch(error => {
          devError('[URL] Failed to load project from URL:', error)
          // Clear invalid project ID from URL
          updateURLWithProject(null)
        })
    }
  }, [searchParams, session?.user?.id, currentProjectId, loadProject, updateURLWithProject])

  // Save state to localStorage whenever it changes (for recovery on refresh)
  useEffect(() => {
    // Only save if NOT logged in and we have meaningful state
    if (!session?.user?.id && (originalImage || (cropParams && Object.keys(cropParams).length > 0))) {
      try {
        // Only store what the database stores - no generated images
        const stateToSave = {
          originalImage,  // Keep this as it's the source image
          // Don't save croppedImage or processedImageUrl - they're regenerated
          cropParams,     // Used to regenerate cropped image
          diceParams,     // Used to regenerate dice grid
          step,
          lastReachedStep,
          dieSize,
          costPer1000,
          projectName,
          buildProgress,
          diceStats
        }
        localStorage.setItem('editorState', JSON.stringify(stateToSave))
        devLog('[LOCAL STORAGE] Saved editor state (params only, not logged in)')
      } catch (error) {
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
          devError('[LOCAL STORAGE] Quota exceeded - clearing and retrying without image')
          localStorage.removeItem('editorState')
          // Try again without the original image
          try {
            const minimalState = {
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
            localStorage.setItem('editorState', JSON.stringify(minimalState))
            devLog('[LOCAL STORAGE] Saved minimal state without images')
          } catch (retryError) {
            devError('[LOCAL STORAGE] Failed to save even minimal state:', retryError)
          }
        } else {
          devError('[LOCAL STORAGE] Failed to save state:', error)
        }
      }
    } else if (session?.user?.id) {
      // Clear localStorage when logged in (using database instead)
      localStorage.removeItem('editorState')
    }
  }, [session?.user?.id, originalImage, cropParams, diceParams, step, lastReachedStep, dieSize, costPer1000, projectName, buildProgress, diceStats])

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
          devLog('[LOCAL STORAGE] Found saved editor state, restoring...')

          // Only restore if the saved state has actual content
          if (state.originalImage || state.cropParams) {
            // Restore all state
            if (state.originalImage) setOriginalImage(state.originalImage)
            // Don't restore croppedImage or processedImageUrl - they'll be regenerated
            if (state.cropParams) setCropParams(state.cropParams)
            if (state.diceParams) setDiceParams(state.diceParams)
            if (state.dieSize) setDieSize(state.dieSize)
            if (state.costPer1000) setCostPer1000(state.costPer1000)
            if (state.projectName) setProjectName(state.projectName)
            if (state.buildProgress) setBuildProgress(state.buildProgress)
            if (state.diceStats) setDiceStats(state.diceStats)
            if (state.step) setStep(state.step)
            if (state.lastReachedStep) setLastReachedStep(state.lastReachedStep)

            // If we have crop params and original image, regenerate the cropped image
            // This is needed for the tune and build steps
            if (state.cropParams && state.originalImage && (state.step === 'tune' || state.step === 'build')) {
              devLog('[LOCAL STORAGE] Regenerating cropped image from params')
              // Create a canvas to generate the cropped image
              const img = new Image()
              img.onload = () => {
                const canvas = document.createElement('canvas')
                canvas.width = state.cropParams.width
                canvas.height = state.cropParams.height
                const ctx = canvas.getContext('2d')
                if (ctx) {
                  // Draw the cropped portion
                  ctx.drawImage(img,
                    state.cropParams.x,
                    state.cropParams.y,
                    state.cropParams.width,
                    state.cropParams.height,
                    0, 0,
                    state.cropParams.width,
                    state.cropParams.height
                  )
                  const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.95)
                  devLog('[LOCAL STORAGE] Cropped image regenerated successfully')
                  setCroppedImage(croppedDataUrl)
                }
              }
              img.src = state.originalImage
            }

            devLog('[LOCAL STORAGE] State restored successfully')
            // Add small delay to ensure state is applied before showing UI
            setTimeout(() => setIsInitializing(false), 500)
          } else {
            // No state to restore
            setIsInitializing(false)
          }
        } catch (err) {
          devError('[LOCAL STORAGE] Failed to restore state:', err)
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
      devLog('[DEBUG] OAuth redirect detected, checking for saved state')
      setIsRestoringOAuthState(true)
      const savedState = sessionStorage.getItem('editorStateBeforeAuth')
      if (savedState) {
        try {
          const state = JSON.parse(savedState)
          devLog('[DEBUG] Restoring editor state after OAuth redirect')
          devLog('[DEBUG] Saved state contains:')
          devLog('  - originalImage:', state.originalImage ? `${state.originalImage.substring(0, 50)}...` : 'null')
          devLog('  - croppedImage:', state.croppedImage ? `${state.croppedImage.substring(0, 50)}...` : 'null')
          devLog('  - processedImageUrl:', state.processedImageUrl ? `${state.processedImageUrl.substring(0, 50)}...` : 'null')
          devLog('  - step:', state.step)
          devLog('  - lastReachedStep:', state.lastReachedStep)
          devLog('  - cropParams:', state.cropParams)
          devLog('  - diceParams:', state.diceParams)

          // Restore the state
          if (state.originalImage) {
            devLog('[DEBUG] Restoring originalImage')
            setOriginalImage(state.originalImage)
          }
          if (state.croppedImage) {
            devLog('[DEBUG] Restoring croppedImage')
            setCroppedImage(state.croppedImage)
          }
          if (state.processedImageUrl) {
            devLog('[DEBUG] Restoring processedImageUrl')
            setProcessedImageUrl(state.processedImageUrl)
          }
          if (state.cropParams) {
            devLog('[DEBUG] Restoring cropParams')
            setCropParams(state.cropParams)
          }
          if (state.diceParams) {
            devLog('[DEBUG] Restoring diceParams')
            setDiceParams(state.diceParams)
          }
          if (state.step) {
            devLog('[DEBUG] Restoring step')
            setStep(state.step)
          }
          if (state.lastReachedStep) {
            devLog('[DEBUG] Restoring lastReachedStep')
            setLastReachedStep(state.lastReachedStep)
          }

          // Clear the saved state and URL param
          sessionStorage.removeItem('editorStateBeforeAuth')
          window.history.replaceState({}, '', '/editor')

          // Set flag for auto-save ONLY if there's actual work (an image) to save
          if (state.originalImage || state.processedImageUrl) {
            devLog('[DEBUG] Setting flag for auto-save after restoration completes (has image)')
            sessionStorage.setItem('shouldAutoSaveRestoredState', 'true')
          } else {
            devLog('[DEBUG] No image in restored state, skipping auto-save flag')
          }

          // Check if user intended to go to build step after login
          const intendedStep = sessionStorage.getItem('intendedStepAfterLogin')
          if (intendedStep === 'build') {
            devLog('[DEBUG] User intended to go to build step after login - navigating there')
            sessionStorage.removeItem('intendedStepAfterLogin')
            // Set step to build after restoration
            setStep('build')
            setLastReachedStep('build')
          }

          // Mark restoration as complete - this will trigger auto-save logic
          devLog('[DEBUG] OAuth state restoration complete')
          // Note: The state variables here will show old values due to closure, but setState calls have been made
          setIsRestoringOAuthState(false)
        } catch (err) {
          devError('[DEBUG] Failed to restore state:', err)
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

    devLog('[LOGIN EFFECT] Triggered with:', {
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
      devLog('[LOGIN EFFECT] User logged in without current project, fetching user projects...')
      fetchUserProjects().then((projects) => {
        const projectCount = (projects || []).length
        devLog('[LOGIN EFFECT] Projects fetched:', {
          projectCount,
          projects: projects?.map((p: any) => ({ id: p.id, name: p.name, updatedAt: p.updatedAt }))
        })

        // Check if user has work in progress (including restored OAuth state)
        const shouldAutoSaveRestoredState = sessionStorage.getItem('shouldAutoSaveRestoredState') === 'true'
        const hasWorkInProgress = originalImage || processedImageUrl || shouldAutoSaveRestoredState

        devLog('[LOGIN EFFECT] Work state check:', {
          shouldAutoSaveRestoredState,
          hasOriginalImage: !!originalImage,
          hasProcessedImageUrl: !!processedImageUrl,
          hasCroppedImage: !!croppedImage,
          hasWorkInProgress
        })

        if (shouldAutoSaveRestoredState) {
          devLog('[LOGIN EFFECT] Found shouldAutoSaveRestoredState flag - state should now be restored')
          sessionStorage.removeItem('shouldAutoSaveRestoredState')
        }

        // Always show the modal on login - giving user choice to create named project or load
        // Even if they have work in progress, we let them "Save & Create" via the modal
        devLog('[LOGIN EFFECT] Showing project dashboard')
        setShowProjectModal(true)

        // Mark initialization as complete after handling all login logic with small delay
        setTimeout(() => setIsInitializing(false), 500)
      }).catch(err => {
        devError('[LOGIN EFFECT] Failed to fetch projects:', err)
        // Still mark as complete even on error
        setTimeout(() => setIsInitializing(false), 500)
      })
    } else {
      devLog('[LOGIN EFFECT] Conditions not met, skipping:', {
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
      devLog('[LOCAL STORAGE] Cleared - project loaded')
    }
  }, [currentProjectId])

  // Handle build progress updates with throttling
  const handleBuildProgressUpdate = useCallback((x: number, y: number) => {
    if (!diceGrid) return

    // Check if user is trying to go beyond x=3 without authentication
    if (!session && x > 3) {
      devLog('[AUTH] User tried to navigate beyond x=3 without authentication')
      setShowAuthModal(true)
      return // Prevent the update
    }

    // Update local state immediately for UI
    const percentage = diceStats.totalCount > 0
      ? Math.round(((diceStats.blackCount + diceStats.whiteCount) / diceStats.totalCount) * 100)
      : 0

    setBuildProgress({ x, y, percentage })

    // Schedule DB update with throttling
    const currentTime = Date.now()
    if (currentTime - lastUpdateTimeRef.current >= 2000) {
      // If enough time passed, update immediately
      if (session?.user?.id && currentProjectId) {
        scheduleBuildAutoSave(x, y)
        lastUpdateTimeRef.current = currentTime
      }
    } else {
      // Otherwise schedule for later if not already scheduled
      if (!updateTimeoutRef.current) {
        // Store pending update
        pendingUpdateRef.current = { x, y }

        updateTimeoutRef.current = setTimeout(() => {
          if (pendingUpdateRef.current) {
            if (session?.user?.id && currentProjectId) {
              scheduleBuildAutoSave(pendingUpdateRef.current.x, pendingUpdateRef.current.y)
              lastUpdateTimeRef.current = Date.now()
            }
            pendingUpdateRef.current = null
            updateTimeoutRef.current = null
          }
        }, 2000)
      } else {
        // Update the pending value to latest
        pendingUpdateRef.current = { x, y }
      }
    }
  }, [diceGrid, diceStats, session, currentProjectId, scheduleBuildAutoSave, setShowAuthModal])

  // No cleanup needed - removed auto-save timers

  // Show loading screen while initializing or session is loading
  if (isInitializing || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        {/* Background Elements */}
        <div className="bg-gradient">
          <div className="orb one"></div>
          <div className="orb two"></div>
          <div className="orb three"></div>
        </div>
        <div className="grid-overlay"></div>
        <div className="text-center relative z-10">
          <img src="/icon.svg" alt="Loading..." className="animate-spin w-12 h-12 mb-4 mx-auto block" />
          <p className="text-white text-lg">Loading workspace...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background Elements */}
      <div className="bg-gradient">
        <div className="orb one"></div>
        <div className="orb two"></div>
        <div className="orb three"></div>
      </div>
      <div className="grid-overlay"></div>

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
                            devError('Image failed to load:', session.user?.image)
                            // Hide the broken image and show fallback
                            e.currentTarget.style.display = 'none'
                            const fallback = e.currentTarget.nextElementSibling as HTMLElement
                            if (fallback) fallback.style.display = 'flex'
                          }}
                        />
                      ) : null}
                      <div
                        className="w-full h-full bg-gradient-to-br from-pink-500 to-purple-600 items-center justify-center text-white font-semibold"
                        style={{ display: session.user?.image ? 'none' : 'flex' }}
                      >
                        {session.user?.name?.[0]?.toUpperCase() || session.user?.email?.[0]?.toUpperCase() || 'U'}
                      </div>
                    </div>

                    {/* Dropdown menu */}
                    {showUserMenu && (
                      <div className="absolute top-full right-0 mt-2 bg-[#0a0014]/90 backdrop-blur-xl rounded-lg shadow-2xl border border-white/10 overflow-hidden z-50" style={{ minWidth: '250px' }}>
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
                                          devLog('[DEBUG] Loading project from menu:', {
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
                                      className="w-full px-6 py-2 text-sm text-left text-pink-400 hover:text-pink-300 hover:bg-white/10 transition-colors flex items-center border-t border-gray-700"
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
                                    className="text-sm text-pink-400 hover:text-pink-300"
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
                  className="px-4 py-2 text-sm font-medium text-white/90 hover:text-white bg-pink-600 hover:bg-pink-700 rounded-lg transition-colors"
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
                  // Note: setUserProjects is not exposed from hook, but we can refetch
                  fetchUserProjects()
                }}
              />
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative p-4 flex-grow">
        {/* Center: Stepper */}
        <div className="flex justify-center items-center mb-4">
          {/* Stepper */}
          <DiceStepper />
        </div>

        {/* Step Content */}
        {/* Step Content */}
        <div className="w-full mx-auto px-4 flex gap-6 items-stretch justify-center h-auto min-h-[calc(100vh-180px)]">
          {/* LEFT PANEL AREA */}
          <div className="flex-shrink-0 flex flex-col w-[350px] min-w-[350px] max-w-[350px] min-h-[650px] max-h-[850px] bg-[#0f0f12]/95 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
            {step === 'upload' && <UploaderPanel />}

            {step === 'crop' && <CropperPanel />}

            {step === 'tune' && <TunerPanel />}

            {step === 'build' && diceGrid && (
              <BuilderPanel />
            )}
          </div>

          {/* MAIN CONTENT AREA */}
          <div className="flex-grow flex items-center justify-center relative min-w-[400px] max-w-[850px] max-h-[850px] overflow-hidden bg-[#0f0f12]/95 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
            {step === 'upload' && <UploadMain />}

            {step === 'crop' && (
              <CropperMain windowSize={windowSize} />
            )}

            {step === 'tune' && (
              <TunerMain
                diceCanvasRef={diceCanvasRef}
                cropParams={cropParams}
              />
            )}

            {step === 'build' && (
              diceGrid ? (
                <BuilderMain />
              ) : croppedImage ? (
                // Show DiceCanvas to generate the grid
                <div className="flex justify-center w-full items-center">
                  <DiceCanvas
                    maxWidth={900}
                    maxHeight={600}
                  />
                </div>
              ) : (
                <div className="text-center text-white/60 mt-20 w-full">
                  <p>No image data available.</p>
                  <p className="text-sm mt-2">Please go back to the Upload or Crop step.</p>
                </div>
              )
            )}
          </div>
        </div>

      </main >

      {/* Auth Modal */}
      < AuthModal
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false)
          // User can continue exploring up to x=3
        }
        }
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

      {/* Donation Modal */}
      <DonationModal
        isOpen={showDonationModal}
        onClose={() => setShowDonationModal(false)}
      />

      {/* Footer */}
      <Footer />
    </div >
  )
}

// Export the page wrapped in Suspense to handle useSearchParams
export default function EditorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0014] to-black z-0" />
        <div className="relative z-10 flex flex-col items-center">
          <Dices className="w-12 h-12 text-pink-500 animate-spin mb-4" />
          <p className="text-white/60 font-medium">Loading editor...</p>
        </div>
      </div>
    }>
      <EditorContent />
    </Suspense>
  )
}