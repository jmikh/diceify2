/**
 * DiceSVGRenderer Class
 * 
 * SVG-based rendering engine for dice grids, used in the build viewer.
 * Unlike the Canvas renderer, this generates vector graphics that can be
 * smoothly zoomed and panned using SVG viewBox manipulation.
 * 
 * Key responsibilities:
 * - Generates SVG representations of individual dice (1-6 dots, black/white)
 * - Assembles dice into a complete SVG grid
 * - Handles highlighting for current dice position
 * - Manages viewBox for zoom/pan functionality
 * - Adds consecutive count badges when multiple same dice appear in a row
 * 
 * SVG Structure:
 * - Each die is a nested SVG element with its own viewBox (100x100)
 * - Dice are positioned using x,y attributes (1 unit = 1 die)
 * - Highlight layer is rendered last to appear on top
 * - ViewBox controls the visible window (e.g., "0 0 5 5" shows 5x5 dice)
 * 
 * Special features:
 * - Smart badge positioning that avoids edges
 * - Smooth CSS transitions on viewBox changes (0.75s cubic-bezier)
 * - Glow effect on highlighted dice using SVG filters
 * - Support for 90° rotation of individual dice
 * 
 * This is more memory-efficient than Canvas for large grids since
 * SVG elements outside the viewBox aren't rendered by the browser.
 */

import { DiceGrid, DiceColor, DiceFace } from './types'
import { DICE_RENDERING } from './constants'
import { devWarn } from '../utils/debug'

export class DiceSVGRenderer {
  private getSvgDice(side: DiceFace, color: DiceColor, rotate90: boolean = false): string {
    const radius = 100.0 * DICE_RENDERING.DOT_RADIUS_FACTOR
    const lower = 100.0 * (1 + DICE_RENDERING.PADDING_FACTOR) / 6
    const middle = 100.0 * 3 / 6
    const upper = 100.0 * (5 - DICE_RENDERING.PADDING_FACTOR) / 6

    const colors = DICE_RENDERING.COLORS[color]
    const strokeWidth = 100.0 * DICE_RENDERING.BORDER_WIDTH_FACTOR
    const cornerRadius = 100.0 * DICE_RENDERING.CORNER_RADIUS_FACTOR
    
    // Add rotation transform if needed - use 50 50 as center since viewBox is 0 0 100 100
    const transform = rotate90 ? `transform='rotate(90 50 50)'` : ''
    
    let svg = `<g ${transform}><rect width='100%' height='100%' fill='${colors.background}' stroke-width='${strokeWidth}%' rx='${cornerRadius}%' stroke='${DICE_RENDERING.COLORS.stroke}' />`

    if (side >= 2) { // top left 
      svg += `<circle cx='${lower}%' cy='${lower}%' r='${radius}%' fill='${colors.dot}' />`
    }
    if (side === 6) { // top center
      svg += `<circle cx='${middle}%' cy='${lower}%' r='${radius}%' fill='${colors.dot}' />`
    }
    if (side >= 4) { // top right
      svg += `<circle cx='${upper}%' cy='${lower}%' r='${radius}%' fill='${colors.dot}' />`
    }
    if (side % 2 === 1) { // center
      svg += `<circle cx='${middle}%' cy='${middle}%' r='${radius}%' fill='${colors.dot}' />`
    }
    if (side >= 4) { // bottom left
      svg += `<circle cx='${lower}%' cy='${upper}%' r='${radius}%' fill='${colors.dot}' />`
    }
    if (side === 6) { // bottom center
      svg += `<circle cx='${middle}%' cy='${upper}%' r='${radius}%' fill='${colors.dot}' />`
    }
    if (side >= 2) { // bottom right
      svg += `<circle cx='${upper}%' cy='${upper}%' r='${radius}%' fill='${colors.dot}' />`
    }
    
    svg += '</g>'  // Close the group tag
    return svg
  }

  render(grid: DiceGrid): string {
    const svgElements: string[] = []
    
    // Calculate dimensions
    const cols = grid.dice[0]?.length || 0
    const rows = grid.dice.length
    
    // Create main SVG container
    const viewBox = `0 0 ${cols} ${rows}`
    
    // Build dice elements
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const dice = grid.dice[row][col]
        const svg = this.getSvgDice(dice.face, dice.color, dice.rotate90 || false)
        svgElements.push(
          `<svg x='${col}' y='${row}' width='1' height='1' viewBox='0 0 100 100'>${svg}</svg>`
        )
      }
    }
    
    // Combine into final SVG with black background
    return `<svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="${viewBox}" 
      preserveAspectRatio="xMidYMid meet"
      style="width: 100%; height: 100%; image-rendering: crisp-edges; background-color: #000000;"
    >
      <rect width="${cols}" height="${rows}" fill="#000000" />
      ${svgElements.join('\n')}
    </svg>`
  }

  renderWithStats(grid: DiceGrid, highlight?: { highlightX: number; highlightY: number; highlightColor: string; consecutiveCount?: number; isAtEdge?: { top: boolean; right: boolean; bottom: boolean; left: boolean } }): { svg: string; blacks: number; whites: number; total: number } {
    let blacks = 0
    let whites = 0
    const svgElements: string[] = []
    let highlightElement: string | null = null
    
    // Calculate dimensions
    const cols = grid.width
    const rows = grid.height
    
    
    // Build dice elements and count - iterate through x,y coordinates
    for (let x = 0; x < cols; x++) {
      for (let y = 0; y < rows; y++) {
        const dice = grid.dice[x]?.[y]
        if (!dice) {
          devWarn(`Missing dice at x ${x}, y ${y}`)
          continue
        }
        
        if (dice.color === 'black') {
          blacks++
        } else {
          whites++
        }
        
        // SVG Y coordinate needs to be flipped (SVG 0 is top, our 0 is bottom)
        const svgY = rows - 1 - y
        const svg = this.getSvgDice(dice.face, dice.color, dice.rotate90 || false)
        
        // Check if this is the highlighted dice
        const isHighlighted = highlight && highlight.highlightX === x && highlight.highlightY === y
        
        // Always add the regular dice
        svgElements.push(
          `<svg x='${x}' y='${svgY}' width='1' height='1' viewBox='0 0 100 100'>${svg}</svg>`
        )
        
        // Store highlight element separately to render it last (on top)
        if (isHighlighted) {
          // Smart positioning for counter based on edges
          let counterX = 85, counterY = 15 // Default: top-right
          
          if (highlight.isAtEdge) {
            const { top, right, bottom, left } = highlight.isAtEdge
            
            if (top && right) {
              // Top-right corner: move to bottom-left
              counterX = 15
              counterY = 85
            } else if (top && left) {
              // Top-left corner: move to bottom-right
              counterX = 85
              counterY = 85
            } else if (bottom && right) {
              // Bottom-right corner: move to top-left
              counterX = 15
              counterY = 15
            } else if (bottom && left) {
              // Bottom-left corner: stay top-right (default)
              counterX = 85
              counterY = 15
            } else if (right) {
              // Right edge: move to left
              counterX = 15
              counterY = 15
            } else if (top) {
              // Top edge: move to bottom
              counterX = 85
              counterY = 85
            }
          }
          
          const consecutiveText = highlight.consecutiveCount && highlight.consecutiveCount > 1 
            ? `<g transform='translate(${counterX}, ${counterY})'>
                <circle cx='0' cy='0' r='15' fill='#FFA500' stroke='#FF8C00' stroke-width='2'/>
                <text x='0' y='5' font-family='monospace' font-size='14' font-weight='bold' fill='#000' text-anchor='middle'>x${highlight.consecutiveCount}</text>
              </g>`
            : ''
          
          highlightElement = `<svg x='${x}' y='${svgY}' width='1' height='1' viewBox='0 0 100 100' style='overflow: visible;'>
            <defs>
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <rect x='2' y='2' width='96' height='96' fill='none' stroke='${highlight.highlightColor}' stroke-width='8' rx='10' filter='url(#glow)' 
                  style='transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);' />
            ${consecutiveText}
          </svg>`
        }
      }
    }
    
    // Return just the inner SVG content (without outer <svg> tags)
    // The BuildViewer will wrap this in its own SVG element with animated viewBox
    const svg = `${svgElements.join('\n')}${highlightElement ? '\n' + highlightElement : ''}`
    
    return {
      svg,
      blacks,
      whites,
      total: blacks + whites
    }
  }
}