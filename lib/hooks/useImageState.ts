/**
 * useImageState Hook
 * 
 * Manages image-related state including uploads and cropping.
 * Keeps track of both original and cropped images.
 */

import { useState } from 'react'

export function useImageState() {
  const [originalImage, setOriginalImage] = useState<string | null>(null)
  const [croppedImage, setCroppedImage] = useState<string | null>(null)

  const handleImageUpload = (imageUrl: string) => {
    setOriginalImage(imageUrl)
    setCroppedImage(null) // Reset cropped when new image uploaded
  }

  const handleCropComplete = (croppedImageUrl: string) => {
    setCroppedImage(croppedImageUrl)
  }

  const reset = () => {
    setOriginalImage(null)
    setCroppedImage(null)
  }

  return {
    originalImage,
    croppedImage,
    handleImageUpload,
    handleCropComplete,
    reset
  }
}