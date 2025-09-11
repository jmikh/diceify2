import { DiceGrid, Dice } from './types'

/**
 * Encoded grid format:
 * {
 *   v: 1,              // version
 *   w: number,         // width
 *   h: number,         // height
 *   d: string          // encoded dice data (3 chars per die)
 * }
 * 
 * Each dice is encoded as 3 characters:
 * - Character 1: Face value ('1'-'6')
 * - Character 2: Color ('b' for black, 'w' for white)
 * - Character 3: Rotation ('r' for normal, 'R' for rotated 90°)
 */

interface EncodedGrid {
  v: number
  w: number
  h: number
  d: string
}

/**
 * Encode a dice grid to a compact string format
 */
export function encodeDiceGrid(grid: DiceGrid): string {
  const { width, height, dice } = grid
  
  // Build the encoded string
  let encoded = ''
  
  // Iterate through the grid (bottom to top, left to right)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const die = dice[y][x]
      
      // Encode each die as 3 characters
      encoded += die.face.toString()
      encoded += die.color === 'black' ? 'b' : 'w'
      encoded += die.rotate90 ? 'R' : 'r'
    }
  }
  
  const encodedGrid: EncodedGrid = {
    v: 1,
    w: width,
    h: height,
    d: encoded
  }
  
  return JSON.stringify(encodedGrid)
}

/**
 * Decode a compact string format back to a dice grid
 */
export function decodeDiceGrid(encodedStr: string): DiceGrid {
  // Parse the JSON
  let encoded: EncodedGrid
  
  try {
    const parsed = JSON.parse(encodedStr)
    
    // Check if it's the new encoded format
    if (parsed.v === 1 && parsed.d && typeof parsed.d === 'string') {
      encoded = parsed
    } else {
      // Legacy format - return as is
      return parsed as DiceGrid
    }
  } catch (e) {
    throw new Error('Invalid encoded grid format')
  }
  
  const { w: width, h: height, d: data } = encoded
  
  // Validate data length
  if (data.length !== width * height * 3) {
    throw new Error(`Invalid encoded data length. Expected ${width * height * 3}, got ${data.length}`)
  }
  
  // Build the dice array
  const dice: Dice[][] = []
  
  let dataIndex = 0
  for (let y = 0; y < height; y++) {
    const row: Dice[] = []
    for (let x = 0; x < width; x++) {
      // Extract 3 characters for this die
      const faceChar = data[dataIndex]
      const colorChar = data[dataIndex + 1]
      const rotationChar = data[dataIndex + 2]
      dataIndex += 3
      
      // Parse the die
      const face = parseInt(faceChar) as 1 | 2 | 3 | 4 | 5 | 6
      if (face < 1 || face > 6) {
        throw new Error(`Invalid face value: ${faceChar}`)
      }
      
      const color = colorChar === 'b' ? 'black' : 'white'
      const rotate90 = rotationChar === 'R'
      
      row.push({
        face,
        color,
        x,
        y,
        rotate90: rotate90 || undefined
      })
    }
    dice.push(row)
  }
  
  return {
    width,
    height,
    dice
  }
}

/**
 * Check if a string is in the encoded format
 */
export function isEncodedGrid(str: string): boolean {
  try {
    const parsed = JSON.parse(str)
    return parsed.v === 1 && typeof parsed.d === 'string'
  } catch {
    return false
  }
}