'use client'

import { DiceGrid, DiceStats } from '@/lib/types'
import { Dice } from '@/lib/dice/types'
import { useRef, useEffect } from 'react'
import CountUp from 'react-countup'
import { theme } from '@/lib/theme'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

// --- ProgressBar Component (Exported for reuse) ---

interface ProgressBarProps {
    percentage: number
    showComplete?: boolean
    className?: string
}

export function ProgressBar({ percentage, showComplete = true, className = '' }: ProgressBarProps) {
    return (
        <div className={className}>
            <div className="h-2 rounded-full overflow-hidden"
                style={{ backgroundColor: theme.colors.glass.border }}>
                <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                        width: `${percentage}%`,
                        backgroundColor: theme.colors.accent.pink
                    }}
                />
            </div>
            <div className="text-center mt-1">
                <span className="text-sm" style={{ color: theme.colors.text.secondary }}>
                    {percentage === 100 && showComplete ? 'Complete' : `${percentage.toFixed(1)}%`}
                </span>
            </div>
        </div>
    )
}

// --- BuildProgress Component (Internal) ---

interface BuildProgressProps {
    currentX: number
    currentY: number
    totalRows: number
    totalCols: number
    currentDice: Dice | null
    currentIndex: number
    totalDice: number
    blackCount: number
    whiteCount: number
    onNavigate: (direction: 'prev' | 'next' | 'prevDiff' | 'nextDiff') => void
    canNavigate: {
        prev: boolean
        next: boolean
        prevDiff: boolean
        nextDiff: boolean
    }
}

function BuildProgress({
    currentX,
    currentY,
    totalRows,
    totalCols,
    currentDice,
    currentIndex,
    totalDice,
    blackCount,
    whiteCount,
    onNavigate,
    canNavigate
}: BuildProgressProps) {
    // Track previous values for smooth transitions
    const prevCountRef = useRef(totalDice)
    const prevBlackRef = useRef(blackCount)
    const prevWhiteRef = useRef(whiteCount)

    useEffect(() => {
        prevCountRef.current = totalDice
        prevBlackRef.current = blackCount
        prevWhiteRef.current = whiteCount
    }, [totalDice, blackCount, whiteCount])

    // Ease-out cubic function for smooth deceleration
    const easeOutCubic = (t: number, b: number, c: number, d: number) => {
        return c * ((t = t / d - 1) * t * t + 1) + b
    }

    return (
        <div className="space-y-6">
            {/* Stats Section - Copied from ControlPanel style */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-4">
                {/* Total dice count - at the very top */}
                <div className="text-center">
                    <div className="text-2xl font-bold" style={{ color: theme.colors.text.primary }}>
                        <CountUp
                            start={prevCountRef.current}
                            end={totalDice}
                            duration={1.5}
                            separator=","
                            useEasing={true}
                            easingFn={easeOutCubic}
                            preserveValue={true}
                        />
                    </div>
                    <div className="text-xs" style={{ color: theme.colors.text.muted }}>total dice</div>
                </div>

                {/* Proportional bar */}
                <div className="h-4 rounded-lg overflow-hidden flex border" style={{
                    backgroundColor: theme.colors.glass.light,
                    borderColor: 'rgba(255, 255, 255, 0.2)'
                }}>
                    {totalDice > 0 && (
                        <>
                            <div
                                className="bg-black transition-all"
                                style={{
                                    width: `${(blackCount / totalDice) * 100}%`
                                }}
                            />
                            <div
                                className="bg-white transition-all"
                                style={{
                                    width: `${(whiteCount / totalDice) * 100}%`
                                }}
                            />
                        </>
                    )}
                </div>

                <div className="flex justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-sm border" style={{ backgroundColor: 'black', borderColor: 'rgba(255, 255, 255, 0.2)' }} />
                        <span style={{ color: theme.colors.text.secondary }}>
                            <CountUp
                                start={prevBlackRef.current}
                                end={blackCount}
                                duration={1}
                                separator=","
                                useEasing={true}
                                easingFn={easeOutCubic}
                                preserveValue={true}
                            />
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-sm border" style={{ backgroundColor: 'white', borderColor: 'rgba(255, 255, 255, 0.2)' }} />
                        <span style={{ color: theme.colors.text.secondary }}>
                            <CountUp
                                start={prevWhiteRef.current}
                                end={whiteCount}
                                duration={1}
                                separator=","
                                useEasing={true}
                                easingFn={easeOutCubic}
                                preserveValue={true}
                            />
                        </span>
                    </div>
                </div>


            </div>

            {/* Coordinates & Controls Section */}
            <div className="flex flex-col gap-4">

                {/* Row 1: Coordinates (Bigger) */}
                <div className="flex justify-center gap-4">
                    {/* X Square */}
                    <fieldset className="relative"
                        style={{
                            width: '64px',
                            height: '64px',
                            backgroundColor: theme.colors.glass.medium,
                            border: `2px solid ${theme.colors.glass.border}`,
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: 0,
                            padding: 0
                        }}
                    >
                        <legend style={{
                            padding: '0 6px',
                            marginLeft: 'auto',
                            marginRight: 'auto',
                            color: theme.colors.text.muted,
                            fontSize: '12px',
                            fontWeight: 600,
                            lineHeight: '1',
                            transform: 'translateY(-2px)'
                        }}>
                            X
                        </legend>
                        <span className="text-white text-2xl font-bold" data-testid="build-pos-x">
                            {currentX + 1}
                        </span>
                    </fieldset>

                    {/* Y Square */}
                    <fieldset className="relative"
                        style={{
                            width: '64px',
                            height: '64px',
                            backgroundColor: theme.colors.glass.medium,
                            border: `2px solid ${theme.colors.glass.border}`,
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: 0,
                            padding: 0
                        }}
                    >
                        <legend style={{
                            padding: '0 6px',
                            marginLeft: 'auto',
                            marginRight: 'auto',
                            color: theme.colors.text.muted,
                            fontSize: '12px',
                            fontWeight: 600,
                            lineHeight: '1',
                            transform: 'translateY(-2px)'
                        }}>
                            Y
                        </legend>
                        <span className="text-white text-2xl font-bold" data-testid="build-pos-y">
                            {currentY + 1}
                        </span>
                    </fieldset>
                </div>

                {/* Row 2: Navigation Controls */}
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={() => onNavigate('prevDiff')}
                        disabled={!canNavigate.prevDiff}
                        className={`p-3 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer bg-white/5 hover:bg-white/20 ${canNavigate.prevDiff ? 'text-white/90' : 'text-white/50'}`}
                        title="Previous different dice"
                    >
                        <ChevronsLeft size={24} />
                    </button>

                    <button
                        onClick={() => onNavigate('prev')}
                        disabled={!canNavigate.prev}
                        className={`p-3 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer bg-white/5 hover:bg-white/20 ${canNavigate.prev ? 'text-white/90' : 'text-white/50'}`}
                        title="Previous dice"
                    >
                        <ChevronLeft size={24} />
                    </button>

                    <button
                        onClick={() => onNavigate('next')}
                        disabled={!canNavigate.next}
                        className={`p-3 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer bg-white/5 hover:bg-white/20 ${canNavigate.next ? 'text-white/90' : 'text-white/50'}`}
                        title="Next dice"
                    >
                        <ChevronRight size={24} />
                    </button>

                    <button
                        onClick={() => onNavigate('nextDiff')}
                        disabled={!canNavigate.nextDiff}
                        className={`p-3 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer bg-white/5 hover:bg-white/20 ${canNavigate.nextDiff ? 'text-white/90' : 'text-white/50'}`}
                        title="Next different dice"
                    >
                        <ChevronsRight size={24} />
                    </button>
                </div>
                {/* Progress Bar - Moved below controls */}
                <div className="pt-2">
                    <ProgressBar percentage={(currentIndex / totalDice) * 100} />
                </div>
            </div>
        </div>
    )
}

// --- BuilderPanel Component (Main Export) ---

interface BuilderPanelProps {
    currentX: number
    currentY: number
    totalRows: number
    totalCols: number
    currentDice: Dice | null
    currentIndex: number
    totalDice: number
    blackCount: number
    whiteCount: number
    onNavigate: (direction: 'prev' | 'next' | 'prevDiff' | 'nextDiff') => void
    canNavigate: {
        prev: boolean
        next: boolean
        prevDiff: boolean
        nextDiff: boolean
    }
    onBack: () => void
    buildNavigation: any // Using any here for now as the type is inferred from a hook in page.tsx
}

export default function BuilderPanel({
    currentX,
    currentY,
    totalRows,
    totalCols,
    currentDice,
    currentIndex,
    totalDice,
    blackCount,
    whiteCount,
    onNavigate,
    canNavigate,
    onBack,
    buildNavigation
}: BuilderPanelProps) {
    return (
        <>
            {/* Build Progress Controls */}
            <div className="mb-6">
                {buildNavigation && (
                    <BuildProgress
                        currentX={currentX}
                        currentY={currentY}
                        totalRows={totalRows}
                        totalCols={totalCols}
                        currentDice={currentDice}
                        currentIndex={currentIndex}
                        totalDice={totalDice}
                        blackCount={blackCount}
                        whiteCount={whiteCount}
                        onNavigate={onNavigate}
                        canNavigate={canNavigate}
                    />
                )}
            </div>

            {/* Spacer */}
            <div className="flex-grow" />

            {/* Navigation Buttons */}
            <div className="flex gap-3 mt-6 pt-6 border-t border-white/10 flex-shrink-0">
                <button
                    onClick={onBack}
                    className="w-full py-3.5 rounded-full border border-white/10 hover:bg-white/5 text-white/70 hover:text-white font-semibold transition-all flex items-center justify-center gap-2 text-sm"
                >
                    ← Back
                </button>
            </div>
        </>
    )
}
