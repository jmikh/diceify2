import { DiceParams } from '@/lib/types'

// Generate hash from grid parameters to detect changes
export const generateGridHash = (params: DiceParams): string => {
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
