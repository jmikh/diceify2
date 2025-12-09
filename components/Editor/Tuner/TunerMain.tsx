'use client'

import { RefObject } from 'react'
import { Download } from 'lucide-react'
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

                {/* Download Button - Top Right */}
                <button
                    onClick={() => diceCanvasRef.current?.download()}
                    className="absolute top-4 right-4 z-20 w-10 h-10 flex items-center justify-center rounded-xl bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/20 text-pink-500 hover:text-pink-400 transition-all backdrop-blur-md shadow-[0_0_15px_rgba(236,72,153,0.15)]"
                    title="Download Image"
                >
                    <Download className="w-5 h-5" />
                </button>

                <DiceCanvas
                    ref={diceCanvasRef}
                    maxWidth={850}
                    maxHeight={850}
                />
            </div>
        </>
    )
}
