'use client'

import { RefObject } from 'react'
import DiceCanvas, { DiceCanvasRef } from '@/components/Editor/DiceCanvas'
import { DiceParams } from '@/lib/types'

interface TunerMainProps {
    diceCanvasRef: RefObject<DiceCanvasRef>
    cropParams: { width: number; height: number } | null
}

export default function TunerMain({ diceCanvasRef, cropParams }: TunerMainProps) {
    return (
        <>
            <div>



                <DiceCanvas
                    ref={diceCanvasRef}
                    maxWidth={850}
                    maxHeight={850}
                />
            </div>
        </>
    )
}
