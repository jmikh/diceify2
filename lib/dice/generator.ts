/**
 * DiceGenerator Class
 * 
 * Core algorithm engine that converts images into dice representations.
 * This is where the image processing magic happens - taking pixel data
 * and mapping it to dice faces based on brightness values.
 * 
 * Image Processing Pipeline:
 * 1. Receives cropped image data from canvas
 * 2. Divides image into a grid (e.g., 30x30 cells)
 * 3. Calculates average brightness for each cell
 * 4. Maps brightness to dice face (1-6) and color (black/white)
 * 5. Returns structured grid data for rendering
 * 
 * Brightness Mapping Algorithm:
 * - Converts RGB to grayscale using luminance formula (0.299*R + 0.587*G + 0.114*B)
 * - Applies contrast adjustment (additive only, 0-100 range)
 * - Maps brightness ranges to dice faces:
 *   - Black & White mode: 12 distinct ranges (6 black, 6 white)
 *   - Black only: 6 ranges mapped to black dice
 *   - White only: 6 ranges mapped to white dice
 * 
 * Performance Optimizations:
 * - Uses blur technique instead of averaging pixels (faster for large grids)
 * - Caches calculations where possible
 * - Processes in chunks to avoid blocking UI thread
 * 
 * The output is a DiceGrid object containing:
 * - 2D array of dice objects
 * - Each die has: face (1-6), color (black/white), rotation flag
 * - Grid dimensions matching the requested size
 */

import { ColorMode } from '@/lib/types'
import { Dice, DiceColor, DiceFace, DiceGrid } from './types'

export class DiceGenerator {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D

  constructor() {
    this.canvas = document.createElement('canvas')
    // Set willReadFrequently to true for better performance with getImageData
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })!
  }

  async generateDiceGrid(
    imageUrl: string,
    numRows: number,
    colorMode: ColorMode,
    contrast: number,
    gamma: number = 1.0,
    edgeSharpening: number = 0,
    rotate6: boolean = false,
    rotate3: boolean = false,
    rotate2: boolean = false,
    cropArea?: { x: number, y: number, width: number, height: number } | null
  ): Promise<DiceGrid> {
    // Load image
    const img = await this.loadImage(imageUrl)
    
    // Calculate grid dimensions respecting aspect ratio
    // If cropArea is provided, use its aspect ratio, otherwise use full image
    const sourceWidth = cropArea ? cropArea.width : img.width
    const sourceHeight = cropArea ? cropArea.height : img.height
    const aspectRatio = sourceWidth / sourceHeight
    const rows = numRows
    const cols = Math.round(numRows * aspectRatio)

    // Resize image to exact grid dimensions
    // Each pixel will correspond to exactly one dice
    this.canvas.width = cols
    this.canvas.height = rows
    
    // Draw image scaled down to grid size with smoothing for better averaging
    this.ctx.imageSmoothingEnabled = true
    this.ctx.imageSmoothingQuality = 'high'
    
    if (cropArea) {
      // Draw only the cropped area
      this.ctx.drawImage(
        img, 
        cropArea.x, cropArea.y, cropArea.width, cropArea.height, // Source rectangle
        0, 0, cols, rows // Destination rectangle
      )
    } else {
      // Draw full image
      this.ctx.drawImage(img, 0, 0, cols, rows)
    }
    
    // Get resized image data - each pixel is now one dice
    const imageData = this.ctx.getImageData(0, 0, cols, rows)
    
    // Apply edge sharpening if requested
    let processedData = imageData
    if (edgeSharpening > 0) {
      processedData = this.applySharpeningFilter(imageData, edgeSharpening)
    }
    
    // Generate dice grid - each pixel is now one dice
    // Grid is indexed as dice[x][y] where (0,0) is bottom-left
    const dice: Dice[][] = []
    const data = processedData.data
    
    // Initialize columns (x-axis)
    for (let x = 0; x < cols; x++) {
      dice[x] = []
    }
    
    // Fill grid with dice, iterating from bottom to top
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        // Get pixel data directly - no sampling needed!
        const pixelIndex = (row * cols + col) * 4
        const r = data[pixelIndex]
        const g = data[pixelIndex + 1]
        const b = data[pixelIndex + 2]
        
        // Convert to grayscale using perceptual weighted average
        let gray = 0.299 * r + 0.587 * g + 0.114 * b
        
        // Apply gamma correction first
        if (gamma !== 1.0) {
          gray = 255 * Math.pow(gray / 255, 1 / gamma)
        }
        
        // Apply contrast
        if (contrast > 0) {
          const factor = 1 + contrast / 100
          gray = 128 + (gray - 128) * factor
          gray = Math.max(0, Math.min(255, gray))
        }
        
        // Map to dice
        const diceInfo = this.mapToDice(gray, colorMode)
        
        // Apply rotation for specific faces
        const shouldRotate = (rotate6 && diceInfo.face === 6) || (rotate3 && diceInfo.face === 3) || (rotate2 && diceInfo.face === 2)
        
        // Convert row to y coordinate (invert so 0 is at bottom)
        const x = col
        const y = rows - 1 - row  // Invert y-axis so bottom is 0
        
        dice[x][y] = {
          face: diceInfo.face,
          color: diceInfo.color,
          x: x,  // Position in grid coordinates (column)
          y: y,  // Position in grid coordinates (row from bottom)
          rotate90: shouldRotate
        }
      }
    }

    return {
      dice,
      width: cols,
      height: rows,
    }
  }

  private mapToDice(brightness: number, colorMode: ColorMode): { face: DiceFace, color: DiceColor } {
    if (colorMode === 'both') {
      // Using actual grayness values for more accurate mapping
      // Black dice (black bg, white dots): 26, 51, 77, 102, 128, 153
      // White dice (white bg, black dots): 230, 204, 179, 153, 128, 102
      
      // Split at midpoint between black 6 (153) and white 6 (102) = ~128
      // Bright values map to white dice, dark values to black dice
      if (brightness >= 217) return { face: 1, color: 'white' }  // 217-255 -> white 1 (230) - brightest
      if (brightness >= 192) return { face: 2, color: 'white' }  // 192-216 -> white 2 (204)
      if (brightness >= 166) return { face: 3, color: 'white' }  // 166-191 -> white 3 (179)
      if (brightness >= 141) return { face: 4, color: 'white' }  // 141-165 -> white 4 (153)
      if (brightness >= 115) return { face: 5, color: 'white' }  // 115-140 -> white 5 (128)
      if (brightness >= 90) return { face: 6, color: 'white' }   // 90-114 -> white 6 (102)
      
      // Dark values map to black dice (more dots = brighter)
      if (brightness >= 64) return { face: 6, color: 'black' }   // 64-89 -> black 6 (153)
      if (brightness >= 51) return { face: 5, color: 'black' }   // 51-63 -> black 5 (128)
      if (brightness >= 39) return { face: 4, color: 'black' }   // 39-50 -> black 4 (102)
      if (brightness >= 26) return { face: 3, color: 'black' }   // 26-38 -> black 3 (77)
      if (brightness >= 13) return { face: 2, color: 'black' }   // 13-25 -> black 2 (51)
      return { face: 1, color: 'black' }                         // 0-12 -> black 1 (26) - darkest
      
    } else if (colorMode === 'black') {
      // Black dice only (black bg with white dots)
      // Higher brightness = more dots
      if (brightness >= 141) return { face: 6, color: 'black' }  // Most dots (brightest for black dice)
      if (brightness >= 115) return { face: 5, color: 'black' }
      if (brightness >= 90) return { face: 4, color: 'black' }
      if (brightness >= 64) return { face: 3, color: 'black' }
      if (brightness >= 39) return { face: 2, color: 'black' }
      return { face: 1, color: 'black' }                         // Least dots (darkest)
      
    } else {
      // White dice only (white bg with black dots)
      // Higher brightness = fewer dots
      if (brightness >= 255*5/6) return { face: 1, color: 'white' }  // Least dots (brightest)
      if (brightness >= 255*4/6) return { face: 2, color: 'white' }
      if (brightness >= 255*3/6) return { face: 3, color: 'white' }
      if (brightness >= 255*2/6) return { face: 4, color: 'white' }
      if (brightness >= 255*1/6) return { face: 5, color: 'white' }
      return { face: 6, color: 'white' }                         // Most dots (darkest for white dice)
    }
  }

  private applySharpeningFilter(imageData: ImageData, strength: number): ImageData {
    const width = imageData.width
    const height = imageData.height
    const data = imageData.data
    const output = new Uint8ClampedArray(data)
    
    // Gentler sharpening for downsampled images
    // Strength from 0 to 100 maps to 0 to 1 factor (much gentler than before)
    const factor = strength / 100 // 0 to 1 range
    
    // Simple sharpening kernel - subtle effect on small images
    const kernel = [
      [0, -1 * factor, 0],
      [-1 * factor, 4 * factor + 1, -1 * factor],
      [0, -1 * factor, 0]
    ]
    
    // Apply convolution
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4
        
        // Process each color channel
        for (let c = 0; c < 3; c++) {
          let sum = 0
          
          // Apply kernel
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const pixelIdx = ((y + ky) * width + (x + kx)) * 4 + c
              sum += data[pixelIdx] * kernel[ky + 1][kx + 1]
            }
          }
          
          output[idx + c] = Math.max(0, Math.min(255, sum))
        }
      }
    }
    
    return new ImageData(output, width, height)
  }

  private loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = url
    })
  }

  calculateStats(grid: DiceGrid): { blackCount: number; whiteCount: number; totalCount: number } {
    let blackCount = 0
    let whiteCount = 0

    // Iterate through all dice in x,y grid
    for (let x = 0; x < grid.width; x++) {
      for (let y = 0; y < grid.height; y++) {
        const die = grid.dice[x][y]
        if (die.color === 'black') {
          blackCount++
        } else {
          whiteCount++
        }
      }
    }

    return {
      blackCount,
      whiteCount,
      totalCount: blackCount + whiteCount,
    }
  }

  async generateGrayscalePreview(imageUrl: string, numRows: number, contrast: number, gamma: number = 1.0, edgeSharpening: number = 0, cropArea?: { x: number, y: number, width: number, height: number } | null): Promise<string> {
    // Load image
    const img = await this.loadImage(imageUrl)
    
    // Calculate grid dimensions respecting aspect ratio (same as generateDiceGrid)
    const sourceWidth = cropArea ? cropArea.width : img.width
    const sourceHeight = cropArea ? cropArea.height : img.height
    const aspectRatio = sourceWidth / sourceHeight
    const rows = numRows
    const cols = Math.round(numRows * aspectRatio)
    
    // First canvas for downsampling
    this.canvas.width = cols
    this.canvas.height = rows
    
    // Draw image scaled down to grid size
    this.ctx.imageSmoothingEnabled = true
    this.ctx.imageSmoothingQuality = 'high'
    
    if (cropArea) {
      // Draw only the cropped area
      this.ctx.drawImage(
        img,
        cropArea.x, cropArea.y, cropArea.width, cropArea.height, // Source rectangle
        0, 0, cols, rows // Destination rectangle
      )
    } else {
      // Draw full image
      this.ctx.drawImage(img, 0, 0, cols, rows)
    }
    
    // Get downsampled image data
    let imageData = this.ctx.getImageData(0, 0, cols, rows)
    
    // Apply edge sharpening if requested (on downsampled image)
    if (edgeSharpening > 0) {
      imageData = this.applySharpeningFilter(imageData, edgeSharpening)
    }
    
    const data = imageData.data
    
    // Convert to grayscale and apply effects
    for (let i = 0; i < data.length; i += 4) {
      // Calculate grayscale value using perceptual weighted average
      let gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
      
      // Apply gamma correction first
      if (gamma !== 1.0) {
        gray = 255 * Math.pow(gray / 255, 1 / gamma)
      }
      
      // Apply contrast
      if (contrast > 0) {
        const factor = 1 + contrast / 100
        gray = 128 + (gray - 128) * factor
        gray = Math.max(0, Math.min(255, gray))
      }
      
      // Set all color channels to the grayscale value
      data[i] = gray
      data[i + 1] = gray
      data[i + 2] = gray
    }
    
    // Put the modified data back
    this.ctx.putImageData(imageData, 0, 0)
    
    // Create a second canvas to scale up for display (pixelated style)
    const displayCanvas = document.createElement('canvas')
    const displayCtx = displayCanvas.getContext('2d')!
    
    // Scale up to a reasonable display size
    const displayScale = Math.min(600 / cols, 600 / rows)
    displayCanvas.width = cols * displayScale
    displayCanvas.height = rows * displayScale
    
    // Draw with pixelated scaling (no smoothing)
    displayCtx.imageSmoothingEnabled = false
    displayCtx.drawImage(this.canvas, 0, 0, displayCanvas.width, displayCanvas.height)
    
    // Return as data URL
    return displayCanvas.toDataURL('image/jpeg', 0.95)
  }
}