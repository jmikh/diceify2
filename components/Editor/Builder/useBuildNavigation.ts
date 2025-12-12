import { useCallback, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useEditorStore } from '@/lib/store/useEditorStore'

export function useBuildNavigation() {
    const { data: session } = useSession()
    const diceGrid = useEditorStore(state => state.diceGrid)
    const buildProgress = useEditorStore(state => state.buildProgress)
    const setBuildProgress = useEditorStore(state => state.setBuildProgress)
    const setShowAuthModal = useEditorStore(state => state.setShowAuthModal)
    const setShowLimitModal = useEditorStore(state => state.setShowLimitModal)

    const currentX = buildProgress.x
    const currentY = buildProgress.y
    const totalCols = diceGrid?.width || 0
    const totalRows = diceGrid?.height || 0
    const totalDice = totalCols * totalRows
    const currentIndex = currentY * totalCols + currentX

    // Helper to update position
    const setPosition = useCallback((x: number, y: number) => {
        setBuildProgress(prev => ({ ...prev, x, y }))
    }, [setBuildProgress])

    const navigatePrev = useCallback(() => {
        if (currentX > 0) {
            setPosition(currentX - 1, currentY)
        } else if (currentY > 0) {
            setPosition(totalCols - 1, currentY - 1)
        }
    }, [currentX, currentY, totalCols, setPosition])

    const navigateNext = useCallback(() => {
        // Enforce trial limit for non-logged in users
        // Only allow up to index 10 (11th dice)
        // If current index > 10, we block further navigation
        if (!session?.user && currentIndex > 10) {
            setShowAuthModal(true)
            return
        }

        // Enforce limit for free users (1000 dice)
        if (session?.user && !session.user.isPro && currentIndex >= 1000) {
            setShowLimitModal(true)
            return
        }

        if (currentX < totalCols - 1) {
            setPosition(currentX + 1, currentY)
        } else if (currentY < totalRows - 1) {
            setPosition(0, currentY + 1)
        }
    }, [currentX, currentY, totalCols, totalRows, setPosition, session, currentIndex, setShowAuthModal, setShowLimitModal])

    const currentDice = useMemo(() => diceGrid?.dice[currentX]?.[currentY] || null, [diceGrid, currentX, currentY])

    const navigatePrevDiff = useCallback(() => {
        if (!diceGrid) return

        const currentFace = currentDice?.face
        const currentColor = currentDice?.color

        // Find previous different dice on same row first
        for (let x = currentX - 1; x >= 0; x--) {
            const dice = diceGrid.dice[x][currentY]
            if (dice.face !== currentFace || dice.color !== currentColor) {
                setPosition(x, currentY)
                return
            }
        }

        // If no different dice found on this row and not at first row, move to previous row
        if (currentY > 0) {
            setPosition(totalCols - 1, currentY - 1)
        }
    }, [currentX, currentY, currentDice, totalCols, diceGrid, setPosition])

    const navigateNextDiff = useCallback(() => {
        if (!diceGrid) return

        // Enforce trial limit for non-logged in users
        if (!session?.user && currentIndex > 10) {
            setShowAuthModal(true)
            return
        }

        // Enforce limit for free users (1000 dice)
        if (session?.user && !session.user.isPro && currentIndex >= 1000) {
            setShowLimitModal(true)
            return
        }

        const currentFace = currentDice?.face
        const currentColor = currentDice?.color

        // Find next different dice on same row first
        for (let x = currentX + 1; x < totalCols; x++) {
            const dice = diceGrid.dice[x][currentY]
            if (dice.face !== currentFace || dice.color !== currentColor) {
                setPosition(x, currentY)
                return
            }
        }

        // If no different dice found on this row and not at last row, move to next row
        if (currentY < totalRows - 1) {
            setPosition(0, currentY + 1)
        }
    }, [currentX, currentY, currentDice, totalCols, totalRows, diceGrid, setPosition, session, currentIndex, setShowAuthModal])

    const canNavigate = useMemo(() => {
        if (!diceGrid) return { prev: false, next: false, prevDiff: false, nextDiff: false }

        const currentFace = currentDice?.face
        const currentColor = currentDice?.color

        const prevDiff = (() => {
            // Check if there's a different dice on the same row backward
            for (let x = currentX - 1; x >= 0; x--) {
                const dice = diceGrid.dice[x]?.[currentY]
                if (dice && (dice.face !== currentFace || dice.color !== currentColor)) {
                    return true
                }
            }
            // Or if we can move to previous row
            return currentY > 0
        })()

        const nextDiff = (() => {
            // Check if there's a different dice on the same row forward
            for (let x = currentX + 1; x < totalCols; x++) {
                const dice = diceGrid.dice[x]?.[currentY]
                if (dice && (dice.face !== currentFace || dice.color !== currentColor)) {
                    return true
                }
            }
            // Or if we can move to next row
            return currentY < totalRows - 1
        })()

        return {
            prev: currentIndex > 0,
            next: currentIndex < totalDice - 1,
            prevDiff,
            nextDiff
        }
    }, [diceGrid, currentDice, currentX, currentY, currentIndex, totalDice, totalCols, totalRows])

    return {
        navigatePrev,
        navigateNext,
        navigatePrevDiff,
        navigateNextDiff,
        canNavigate,
        currentDice,
        currentX,
        currentY,
        totalCols,
        totalRows,
        totalDice,
        currentIndex
    }
}
