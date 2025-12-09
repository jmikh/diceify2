import { create } from 'zustand'
import { WorkflowStep, DiceParams, DiceStats, DiceGrid, ColorMode } from '@/lib/types'
import { devLog } from '@/lib/utils/debug'

interface CropParams {
  x: number
  y: number
  width: number
  height: number
  rotation: number
}

interface BuildProgress {
  x: number
  y: number
  percentage: number
}

interface EditorState {
  // Workflow State
  step: WorkflowStep
  lastReachedStep: WorkflowStep

  // Editor Data
  originalImage: string | null
  croppedImage: string | null
  processedImageUrl: string | null
  cropParams: CropParams | null
  hasCropChanged: boolean

  // Dice Configuration
  diceParams: DiceParams
  dieSize: number // mm
  costPer1000: number // dollars

  // Generated Data
  diceStats: DiceStats
  diceGrid: DiceGrid | null

  // Project Metadata
  projectName: string
  currentProjectId: string | null
  lastSaved: Date | null
  isSaving: boolean

  // UI State
  isInitializing: boolean
  showAuthModal: boolean
  showProjectModal: boolean
  showDonationModal: boolean

  // Build State
  buildProgress: BuildProgress

  // Actions
  setStep: (step: WorkflowStep) => void
  setLastReachedStep: (step: WorkflowStep) => void
  setOriginalImage: (url: string | null) => void
  setCroppedImage: (url: string | null) => void
  setProcessedImageUrl: (url: string | null) => void
  setCropParams: (params: CropParams | null) => void
  setHasCropChanged: (changed: boolean) => void
  setDiceParams: (params: Partial<DiceParams>) => void
  setDiceStats: (stats: DiceStats) => void
  setDiceGrid: (grid: DiceGrid | null) => void
  setDieSize: (size: number) => void
  setCostPer1000: (cost: number) => void
  setProjectName: (name: string) => void
  setCurrentProjectId: (id: string | null) => void
  setLastSaved: (date: Date | null) => void
  setIsSaving: (isSaving: boolean) => void
  setIsInitializing: (isInitializing: boolean) => void
  setShowAuthModal: (show: boolean) => void
  setShowProjectModal: (show: boolean) => void
  setShowDonationModal: (show: boolean) => void
  setBuildProgress: (progress: BuildProgress | ((prev: BuildProgress) => BuildProgress)) => void

  // Complex Actions
  uploadImage: (url: string) => void
  updateCrop: (croppedImageUrl: string, crop: CropParams) => void
  completeCrop: (croppedImageUrl: string, crop: CropParams) => void
  resetWorkflow: () => void
}

const DEFAULT_DICE_PARAMS: DiceParams = {
  numRows: 30,
  colorMode: 'both',
  contrast: 0,
  gamma: 1.0,
  edgeSharpening: 0,
  rotate6: false,
  rotate3: false,
  rotate2: false,
}

const DEFAULT_DICE_STATS: DiceStats = {
  blackCount: 0,
  whiteCount: 0,
  totalCount: 0,
}

export const useEditorStore = create<EditorState>((set, get) => ({
  // Initial State
  step: 'upload',
  lastReachedStep: 'upload',

  originalImage: null,
  croppedImage: null,
  processedImageUrl: null,
  cropParams: null,
  hasCropChanged: false,

  diceParams: DEFAULT_DICE_PARAMS,
  dieSize: 16,
  costPer1000: 60,

  diceStats: DEFAULT_DICE_STATS,
  diceGrid: null,

  projectName: 'Untitled Project',
  currentProjectId: null,
  lastSaved: null,
  isSaving: false,

  isInitializing: true,
  showAuthModal: false,
  showProjectModal: false,
  showDonationModal: false,

  buildProgress: { x: 0, y: 0, percentage: 0 },

  // Actions
  setStep: (step) => set({ step }),
  setLastReachedStep: (step) => set({ lastReachedStep: step }),

  setOriginalImage: (url) => set({ originalImage: url }),
  setCroppedImage: (url) => set({ croppedImage: url }),
  setProcessedImageUrl: (url) => set({ processedImageUrl: url }),

  setCropParams: (params) => set({ cropParams: params }),
  setHasCropChanged: (changed) => set({ hasCropChanged: changed }),

  setDiceParams: (params) => set((state) => ({
    diceParams: { ...state.diceParams, ...params }
  })),

  setDiceStats: (stats) => set({ diceStats: stats }),
  setDiceGrid: (grid) => set({ diceGrid: grid }),
  setDieSize: (size) => set({ dieSize: size }),
  setCostPer1000: (cost) => set({ costPer1000: cost }),

  setProjectName: (name) => set({ projectName: name }),
  setCurrentProjectId: (id) => set({ currentProjectId: id }),
  setLastSaved: (date) => set({ lastSaved: date }),
  setIsSaving: (isSaving) => set({ isSaving }),

  setIsInitializing: (isInitializing) => set({ isInitializing }),
  setShowAuthModal: (show) => set({ showAuthModal: show }),
  setShowProjectModal: (show) => set({ showProjectModal: show }),
  setShowDonationModal: (show) => set({ showDonationModal: show }),

  setBuildProgress: (progress) => set((state) => ({
    buildProgress: typeof progress === 'function' ? progress(state.buildProgress) : progress
  })),

  uploadImage: (url: string) => {
    set({
      originalImage: url,
      step: 'crop',
      lastReachedStep: 'crop',
      croppedImage: null,
      processedImageUrl: null,
      diceGrid: null,
      cropParams: null,
      diceStats: DEFAULT_DICE_STATS,
      buildProgress: { x: 0, y: 0, percentage: 0 }
    })
  },

  updateCrop: (croppedImageUrl: string, crop: CropParams) => {
    set({
      croppedImage: croppedImageUrl,
      cropParams: crop,
      // Don't change step here
    })
  },

  completeCrop: (croppedImageUrl: string, crop: CropParams) => {
    set({
      croppedImage: croppedImageUrl,
      cropParams: crop,
      step: 'tune',
      lastReachedStep: 'tune',
      diceGrid: null
    })
  },

  resetWorkflow: () => {
    devLog('[STORE] Resetting workflow')
    set({
      step: 'upload',
      originalImage: null,
      croppedImage: null,
      cropParams: null,
      processedImageUrl: null,
      diceParams: DEFAULT_DICE_PARAMS,
      diceStats: DEFAULT_DICE_STATS,
      buildProgress: { x: 0, y: 0, percentage: 0 },
      diceGrid: null,
      dieSize: 16,
      costPer1000: 60,
      // We don't reset project ID or name here usually, unless explicitly creating new
    })
  }
}))
