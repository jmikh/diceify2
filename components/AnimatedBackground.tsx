'use client'

import { useState, useEffect, useRef } from 'react'
import { theme } from '@/lib/theme'

interface Orb {
  id: number
  size: number
  top: number
  left: number
  color: string
  duration: number
  blur: string
  key: string // Add key for forcing re-render
}

export default function AnimatedBackground() {
  const [orbs, setOrbs] = useState<Orb[]>([])
  const intervalRefs = useRef<{ [key: number]: NodeJS.Timeout }>({})

  const colors = [
    theme.colors.glow.purple,
    theme.colors.glow.blue,
    theme.colors.glow.pink,
    theme.colors.glow.green,
  ]
  
  const blurOptions = ['blur-2xl', 'blur-3xl']

  const generateOrbProperties = (id: number) => ({
    id,
    size: 150 + Math.random() * 250, // 150-400px
    top: Math.random() * 120 - 20, // -20% to 120%
    left: Math.random() * 120 - 20, // -20% to 120%
    color: colors[Math.floor(Math.random() * colors.length)],
    duration: 3 + Math.random() * 4, // 3-7 seconds per cycle
    blur: blurOptions[Math.floor(Math.random() * blurOptions.length)],
    key: `${id}-${Date.now()}-${Math.random()}` // Unique key for each position
  })

  useEffect(() => {
    const orbCount = 15 // Fixed number of orbs
    const initialOrbs: Orb[] = []
    
    // Create initial orbs
    for (let i = 0; i < orbCount; i++) {
      initialOrbs.push(generateOrbProperties(i))
    }
    
    setOrbs(initialOrbs)

    // Set up individual timers for each orb
    for (let i = 0; i < orbCount; i++) {
      const randomInterval = 4000 + Math.random() * 6000 // 4-10 seconds
      
      intervalRefs.current[i] = setInterval(() => {
        setOrbs(prevOrbs => 
          prevOrbs.map(orb => 
            orb.id === i ? generateOrbProperties(i) : orb
          )
        )
      }, randomInterval)
    }

    // Cleanup
    return () => {
      Object.values(intervalRefs.current).forEach(interval => clearInterval(interval))
    }
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden">
      {orbs.map((orb) => (
        <div
          key={orb.key}
          className={`absolute rounded-full ${orb.blur}`}
          style={{
            width: `${orb.size}px`,
            height: `${orb.size}px`,
            top: `${orb.top}%`,
            left: `${orb.left}%`,
            backgroundColor: orb.color,
            animation: `fadeInOut ${orb.duration}s ease-in-out`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes fadeInOut {
          0% {
            opacity: 0;
            transform: scale(0.8);
          }
          50% {
            opacity: 1;
            transform: scale(1);
          }
          100% {
            opacity: 0;
            transform: scale(0.8);
          }
        }
      `}</style>
    </div>
  )
}