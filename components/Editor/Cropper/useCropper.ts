import { useState, useRef, useCallback, useEffect } from 'react'
import { FixedCropperRef, StencilSize } from 'react-advanced-cropper'
import { AspectRatioOption, aspectRatioOptions } from './CropperPanel'
import { AspectRatio } from '@/lib/types'
import { useEditorStore } from '@/lib/store/useEditorStore'
import { devLog, devError } from '@/lib/utils/debug'

interface UseCropperProps {
    windowSize: { width: number; height: number }
}

export function useCropper({ windowSize }: UseCropperProps) {
    // Store Actions
    const completeCrop = useEditorStore(state => state.completeCrop)
    const updateCrop = useEditorStore(state => state.updateCrop)
    const setStep = useEditorStore(state => state.setStep)
    const setLastReachedStep = useEditorStore(state => state.setLastReachedStep)
    const setBuildProgress = useEditorStore(state => state.setBuildProgress)
    const setHasCropChanged = useEditorStore(state => state.setHasCropChanged)
    const setCropParams = useEditorStore(state => state.setCropParams)
    const setCroppedImage = useEditorStore(state => state.setCroppedImage)

    // Store State
    const cropParams = useEditorStore(state => state.cropParams)
    const lastReachedStep = useEditorStore(state => state.lastReachedStep)
    const buildProgress = useEditorStore(state => state.buildProgress)

    // Local State
    const fixedCropperRef = useRef<FixedCropperRef>(null)
    const [imageLoaded, setImageLoaded] = useState(false)

    // Global State
    const selectedRatio = useEditorStore(state => state.selectedRatio)
    const cropRotation = useEditorStore(state => state.cropRotation)

    const cropChangeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // Rotation synchronization
    const prevRotationRef = useRef(cropRotation)

    // Sync rotation from store to cropper
    useEffect(() => {
        const cropper = fixedCropperRef.current
        if (cropper && prevRotationRef.current !== cropRotation) {
            const delta = cropRotation - prevRotationRef.current
            cropper.rotateImage(delta)
            prevRotationRef.current = cropRotation
            devLog('[CROP] Synced rotation:', { delta, newRotation: cropRotation })
        }
    }, [cropRotation])

    // Store initial params to detect changes against the session start,
    // since live cropParams are updated during interaction.
    const initialCropParamsRef = useRef(cropParams)

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
        // Check if crop parameters actually changed from the start of the session
        const hasChanged = !areCropParamsEqual(initialCropParamsRef.current, params)
        devLog('[CROP] Crop parameters initial: ', initialCropParamsRef.current)
        devLog('[CROP] Crop parameters current: ', params)
        devLog('[CROP] Crop parameters changed: ', hasChanged)

        // Only mark as changed if parameters are different
        if (hasChanged) {
            // Changes tracked internally
            if (setHasCropChanged) setHasCropChanged(true) // check existence for safety
            devLog('[CROP] Crop parameters changed')

            // When crop changes, reset lastReachedStep to 'tune' if needed
            if (lastReachedStep === 'build') {
                devLog('[CROP] Resetting lastReachedStep to tune - user must re-tune after crop change')
                setLastReachedStep('tune')
            }

            // Reset build progress if there was any
            if (buildProgress.x !== 0 || buildProgress.y !== 0) {
                devLog('[CROP] Reset build progress due to crop change')
                setBuildProgress({ x: 0, y: 0, percentage: 0 })
            }
        } else {
            devLog('[CROP] Crop parameters unchanged')
        }

        setCropParams(params)
        setCroppedImage(croppedImageUrl)
    }, [cropParams, lastReachedStep, buildProgress, setCropParams, setCroppedImage, setHasCropChanged, setLastReachedStep, setBuildProgress])

    const selectedOption = aspectRatioOptions.find(opt => opt.value === selectedRatio) || aspectRatioOptions[2]

    // Calculate stencil size
    const getStencilSize = useCallback(() => {
        if (typeof window === 'undefined') return { width: 0, height: 0 }

        const sidebarTotalWidth = 350 + 24 + 32
        const availableWidth = Math.min(900, windowSize.width - sidebarTotalWidth)
        const containerHeight = Math.max(500, Math.min(800, windowSize.height - 180))
        const availableHeight = containerHeight - 32

        const maxWidth = availableWidth * 0.9
        const maxHeight = availableHeight * 0.9

        const ratio = selectedOption.ratio || 1

        let width = maxWidth
        let height = width / ratio

        if (height > maxHeight) {
            height = maxHeight
            width = height * ratio
        }

        return { width, height }
    }, [windowSize, selectedOption])

    const stencilSize = getStencilSize()

    const performAutoCrop = useCallback(async (isComplete = false) => {

        try {
            const cropper = fixedCropperRef.current
            if (!cropper) return

            const canvas = cropper.getCanvas({
                width: 2048,
                height: (!selectedOption.ratio) ? 2048 : 2048 / selectedOption.ratio,
            })

            if (canvas) {
                const coordinates = cropper.getCoordinates()
                const state = cropper.getState()
                const croppedImage = canvas.toDataURL('image/jpeg', 0.95)

                const cropData = {
                    x: coordinates?.left || 0,
                    y: coordinates?.top || 0,
                    width: coordinates?.width || 0,
                    height: coordinates?.height || 0,
                    rotation: state?.transforms?.rotate || 0
                }

                if (isComplete) {
                    handleCropComplete(croppedImage, cropData)
                } else {
                    updateCrop(croppedImage, cropData)
                }
            }
        } catch (error) {
            devError('Error auto-cropping image:', error)
        }

    }, [selectedOption.ratio, handleCropComplete, updateCrop])


    const handleCropperChange = useCallback(() => {
        if (cropChangeTimeoutRef.current) {
            clearTimeout(cropChangeTimeoutRef.current)
        }
        cropChangeTimeoutRef.current = setTimeout(() => {
            performAutoCrop(false)
        }, 500)
    }, [performAutoCrop])

    // Auto-crop when image is ready or when aspect ratio changes
    useEffect(() => {
        if (imageLoaded) {
            const timeout = setTimeout(() => {
                performAutoCrop(false)
            }, 100)
            return () => clearTimeout(timeout)
        }
    }, [imageLoaded, selectedRatio, performAutoCrop])

    // Cleanup timeouts
    useEffect(() => {
        return () => {
            if (cropChangeTimeoutRef.current) {
                clearTimeout(cropChangeTimeoutRef.current)
            }
        }
    }, [])

    return {
        fixedCropperRef,
        imageLoaded,
        setImageLoaded,
        selectedOption,
        stencilSize,
        performAutoCrop,
        handleCropperChange
    }
}
