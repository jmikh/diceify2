'use client'

import { RefObject } from 'react'
import { FixedCropper, FixedCropperRef, ImageRestriction, StencilSize } from 'react-advanced-cropper'
import 'react-advanced-cropper/dist/style.css'
import 'react-advanced-cropper/dist/themes/corners.css'
import styles from './Cropper.module.css'
import { devLog } from '@/lib/utils/debug'
import { AspectRatioOption } from './CropperPanel'

interface CropperMainProps {
    fixedCropperRef: RefObject<FixedCropperRef>
    imageUrl: string
    selectedOption: AspectRatioOption
    rotation: number
    stencilSize: StencilSize
    onCropperReady?: (cropper: FixedCropperRef) => void
    setImageLoaded: (loaded: boolean) => void
    onCropperChange: () => void
}

export default function CropperMain({
    fixedCropperRef,
    imageUrl,
    selectedOption,
    rotation,
    stencilSize,
    onCropperReady,
    setImageLoaded,
    onCropperChange
}: CropperMainProps) {
    if (!imageUrl) return null

    return (
        <>
            <FixedCropper
                ref={fixedCropperRef}
                src={imageUrl}
                className={`h-full ${styles.cropper}`}
                stencilProps={{
                    aspectRatio: selectedOption.ratio || undefined,
                    grid: true,
                    overlayClassName: styles.overlay,
                    handlers: false,
                    lines: true,
                    movable: false,
                    resizable: false,
                }}
                stencilSize={stencilSize}
                defaultTransforms={{ rotate: rotation }}
                imageRestriction={ImageRestriction.stencil}
                onReady={() => {
                    devLog('Cropper onReady fired')
                    setImageLoaded(true)

                    if (fixedCropperRef.current) {
                        const state = fixedCropperRef.current.getState()
                        devLog('Cropper state on ready:', {
                            state: state,
                            coordinates: fixedCropperRef.current.getCoordinates()
                        })

                        // Refresh to ensure proper sizing
                        fixedCropperRef.current.refresh()

                        // Notify parent component that cropper is ready
                        if (onCropperReady) {
                            onCropperReady(fixedCropperRef.current)
                        }
                    }
                }}
                onChange={onCropperChange}
            />
        </>
    )
}
