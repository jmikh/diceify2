'use client'

import { useEffect, useState } from 'react'
import styles from './AnimatedDiceBackground.module.css'

// Generate a random dice face (1-6)
const generateDiceFace = () => Math.floor(Math.random() * 6) + 1

// Generate a column of dice faces
const generateDiceColumn = (height: number) => {
  const diceCount = Math.floor(height / 60) + 5 // Extra dice for seamless loop
  return Array.from({ length: diceCount }, () => ({
    face: generateDiceFace(),
    color: Math.random() > 0.5 ? 'black' : 'white' as 'black' | 'white',
    id: Math.random()
  }))
}

interface DiceProps {
  face: number
  color: 'black' | 'white'
  size?: number
}

// Individual dice component
const Dice = ({ face, color, size = 50 }: DiceProps) => {
  const dotPositions = {
    1: ['center'],
    2: ['top-left', 'bottom-right'],
    3: ['top-left', 'center', 'bottom-right'],
    4: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
    5: ['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right'],
    6: ['top-left', 'top-right', 'middle-left', 'middle-right', 'bottom-left', 'bottom-right']
  }

  return (
    <div 
      className={`${styles.dice} ${styles[color]}`}
      style={{ width: size, height: size }}
    >
      {dotPositions[face as keyof typeof dotPositions].map((position, index) => (
        <div 
          key={index} 
          className={`${styles.dot} ${styles[position]}`}
        />
      ))}
    </div>
  )
}

interface AnimatedColumnProps {
  columnIndex: number
  totalColumns: number
}

const AnimatedColumn = ({ columnIndex, totalColumns }: AnimatedColumnProps) => {
  const [windowHeight, setWindowHeight] = useState(1000)
  const [diceColumn, setDiceColumn] = useState(() => generateDiceColumn(1000))

  useEffect(() => {
    const updateHeight = () => {
      setWindowHeight(window.innerHeight)
      setDiceColumn(generateDiceColumn(window.innerHeight))
    }
    
    updateHeight()
    window.addEventListener('resize', updateHeight)
    return () => window.removeEventListener('resize', updateHeight)
  }, [])

  // Different speeds and delays for each column
  const animationSpeed = 15 + (columnIndex * 3) // 15-35 seconds
  const animationDelay = -(columnIndex * 2) // Staggered start

  return (
    <div 
      className={styles.column}
      style={{
        animationDuration: `${animationSpeed}s`,
        animationDelay: `${animationDelay}s`
      }}
    >
      {/* Render dice twice for seamless loop */}
      {[...diceColumn, ...diceColumn].map((dice, index) => (
        <div key={`${dice.id}-${index}`} className={styles.diceWrapper}>
          <Dice 
            face={dice.face} 
            color={dice.color}
            size={40 + Math.random() * 20} // Varied sizes
          />
        </div>
      ))}
    </div>
  )
}

export default function AnimatedDiceBackground() {
  const numberOfColumns = 8

  return (
    <div className={styles.background}>
      <div className={styles.overlay} />
      {Array.from({ length: numberOfColumns }, (_, index) => (
        <AnimatedColumn 
          key={index} 
          columnIndex={index}
          totalColumns={numberOfColumns}
        />
      ))}
    </div>
  )
}