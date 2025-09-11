'use client'

import { useEffect, useState, useRef } from 'react'
import Logo from './Logo'
import styles from './ScrollWorkflowDemo.module.css'

// Demo stages
type DemoStage = 'hero' | 'upload' | 'crop' | 'transform' | 'tune' | 'build' | 'cta'

// Mock image data
const SAMPLE_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Cdefs%3E%3ClinearGradient id='bg' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23667eea'/%3E%3Cstop offset='100%25' style='stop-color:%23764ba2'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='400' height='300' fill='url(%23bg)'/%3E%3Ctext x='200' y='150' text-anchor='middle' dy='.3em' font-family='Arial' font-size='24' fill='white'%3ESample Image%3C/text%3E%3C/svg%3E"

export default function ScrollWorkflowDemo() {
  const [currentStage, setCurrentStage] = useState<DemoStage>('hero')
  const [stageProgress, setStageProgress] = useState(0) // 0-1 within current stage
  const [overallProgress, setOverallProgress] = useState(0) // 0-1 overall
  const [isScrollLocked, setIsScrollLocked] = useState(true)
  const [cropSelection, setCropSelection] = useState({ x: 50, y: 40, width: 200, height: 150 })
  const [buildProgress, setBuildProgress] = useState(0)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const spacerRef = useRef<HTMLDivElement>(null)
  
  // Define stage boundaries (each stage takes this much of total scroll)
  const stages: Record<DemoStage, { start: number; end: number }> = {
    hero: { start: 0, end: 0.15 },
    upload: { start: 0.15, end: 0.3 },
    crop: { start: 0.3, end: 0.45 },
    transform: { start: 0.45, end: 0.6 },
    tune: { start: 0.6, end: 0.75 },
    build: { start: 0.75, end: 0.9 },
    cta: { start: 0.9, end: 1.0 }
  }
  
  useEffect(() => {
    let ticking = false
    
    const handleScroll = () => {
      if (ticking) return
      ticking = true
      
      requestAnimationFrame(() => {
        if (!isScrollLocked) {
          ticking = false
          return
        }
        
        const scrollTop = window.scrollY
        const windowHeight = window.innerHeight
        const maxScroll = windowHeight * 6 // 6 viewport heights for demo
        
        // Calculate overall progress (0-1)
        const progress = Math.min(Math.max(scrollTop / maxScroll, 0), 1)
        setOverallProgress(progress)
        
        console.log('Scroll progress:', progress, 'ScrollTop:', scrollTop, 'MaxScroll:', maxScroll)
        
        // Determine current stage and stage progress
        let newStage: DemoStage = 'hero'
        let newStageProgress = 0
        
        for (const [stageName, bounds] of Object.entries(stages)) {
          if (progress >= bounds.start && progress < bounds.end) {
            newStage = stageName as DemoStage
            newStageProgress = (progress - bounds.start) / (bounds.end - bounds.start)
            break
          }
        }
        
        // Handle final stage
        if (progress >= stages.cta.start) {
          newStage = 'cta'
          newStageProgress = (progress - stages.cta.start) / (stages.cta.end - stages.cta.start)
          
          // Unlock scrolling when demo is complete
          if (progress >= 1) {
            setIsScrollLocked(false)
            console.log('Demo complete, unlocking scroll')
          }
        }
        
        console.log('Current stage:', newStage, 'Stage progress:', newStageProgress)
        
        setCurrentStage(newStage)
        setStageProgress(Math.min(Math.max(newStageProgress, 0), 1))
        
        // Special handling for build stage progress
        if (newStage === 'build') {
          setBuildProgress(newStageProgress * 100)
        }
        
        ticking = false
      })
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Initial call
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [isScrollLocked])
  
  // Generate dice pattern based on progress
  const generateDicePattern = (progress: number) => {
    const gridSize = Math.floor(6 + progress * 14) // 6-20 dice
    const dice = []
    
    for (let i = 0; i < gridSize * gridSize; i++) {
      const opacity = Math.min(progress * 2, 1)
      dice.push({
        id: i,
        face: Math.floor(Math.random() * 6) + 1,
        color: Math.random() > 0.5 ? 'black' : 'white',
        opacity
      })
    }
    
    return { dice, gridSize }
  }
  
  const dicePattern = generateDicePattern(stageProgress)
  
  return (
    <>
      {/* Spacer div to create scrollable area */}
      <div 
        ref={spacerRef} 
        style={{ 
          height: isScrollLocked ? `${typeof window !== 'undefined' ? window.innerHeight * 7 : 4200}px` : '0px',
          pointerEvents: 'none'
        }}
      />
      
      <div ref={containerRef} className={styles.container}>
        {/* Progress indicator */}
        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill} 
            style={{ width: `${overallProgress * 100}%` }}
          />
        </div>
        
        {/* Stage indicator */}
        <div className={styles.stageIndicator}>
          {currentStage.charAt(0).toUpperCase() + currentStage.slice(1)} Stage
        </div>
        
        {/* Main content area */}
        <div className={styles.content}>
        
        {/* Hero Stage */}
        {currentStage === 'hero' && (
          <div className={`${styles.stage} ${styles.heroStage}`}>
            <div 
              className={styles.logoContainer}
              style={{
                transform: `scale(${1 + stageProgress * 0.2})`,
                opacity: 1 - stageProgress * 0.3
              }}
            >
              <Logo />
              <div className={styles.tagline}>
                Transform photos into dice art
              </div>
            </div>
            <div className={styles.scrollHint}>
              Scroll to see how it works
              <div className={styles.scrollArrow}>↓</div>
            </div>
          </div>
        )}
        
        {/* Upload Stage */}
        {currentStage === 'upload' && (
          <div className={`${styles.stage} ${styles.uploadStage}`}>
            <div className={styles.fileIcon}>
              📁
            </div>
            <div 
              className={styles.uploadingFile}
              style={{
                transform: `translateX(${-200 + stageProgress * 200}px) scale(${0.5 + stageProgress * 0.5})`,
                opacity: stageProgress
              }}
            >
              🖼️
            </div>
            {stageProgress > 0.7 && (
              <div 
                className={styles.sampleImage}
                style={{
                  opacity: (stageProgress - 0.7) / 0.3,
                  transform: `scale(${0.8 + ((stageProgress - 0.7) / 0.3) * 0.2})`
                }}
              >
                <img src={SAMPLE_IMAGE} alt="Sample" />
              </div>
            )}
          </div>
        )}
        
        {/* Crop Stage */}
        {currentStage === 'crop' && (
          <div className={`${styles.stage} ${styles.cropStage}`}>
            <div className={styles.imageContainer}>
              <img src={SAMPLE_IMAGE} alt="Sample" className={styles.fullImage} />
              <div 
                className={styles.cropOverlay}
                style={{
                  opacity: stageProgress,
                }}
              >
                <div 
                  className={styles.cropSelection}
                  style={{
                    left: cropSelection.x,
                    top: cropSelection.y,
                    width: cropSelection.width,
                    height: cropSelection.height,
                    transform: `scale(${1 + stageProgress * 0.5})`
                  }}
                />
              </div>
            </div>
            {stageProgress > 0.6 && (
              <div className={styles.cropHint}>
                Perfect framing
              </div>
            )}
          </div>
        )}
        
        {/* Transform Stage */}
        {currentStage === 'transform' && (
          <div className={`${styles.stage} ${styles.transformStage}`}>
            <div className={styles.transformContainer}>
              <div 
                className={styles.originalImage}
                style={{
                  opacity: 1 - stageProgress,
                  transform: `scale(${1 - stageProgress * 0.3})`
                }}
              >
                <img src={SAMPLE_IMAGE} alt="Original" />
              </div>
              
              <div 
                className={styles.diceResult}
                style={{
                  opacity: stageProgress,
                  transform: `scale(${0.7 + stageProgress * 0.3})`
                }}
              >
                <div className={styles.diceGrid} style={{ 
                  gridTemplateColumns: `repeat(${Math.min(8, dicePattern.gridSize)}, 1fr)` 
                }}>
                  {dicePattern.dice.slice(0, 64).map((dice) => (
                    <div 
                      key={dice.id}
                      className={`${styles.diceFace} ${styles[dice.color]}`}
                      style={{ opacity: dice.opacity }}
                    >
                      {Array.from({ length: dice.face }, (_, i) => (
                        <div key={i} className={styles.dot} />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Particle effects */}
            {stageProgress > 0.3 && stageProgress < 0.8 && (
              <div className={styles.particles}>
                {Array.from({ length: 20 }, (_, i) => (
                  <div 
                    key={i}
                    className={styles.particle}
                    style={{
                      left: `${20 + Math.random() * 60}%`,
                      top: `${20 + Math.random() * 60}%`,
                      animationDelay: `${Math.random() * 2}s`
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Tune Stage */}
        {currentStage === 'tune' && (
          <div className={`${styles.stage} ${styles.tuneStage}`}>
            <div className={styles.tuneContainer}>
              <div className={styles.dicePreview}>
                <div className={styles.diceGrid} style={{ 
                  gridTemplateColumns: `repeat(10, 1fr)` 
                }}>
                  {Array.from({ length: 100 }, (_, i) => (
                    <div 
                      key={i}
                      className={`${styles.diceFace} ${Math.random() > 0.5 ? styles.black : styles.white}`}
                      style={{
                        transform: `scale(${0.8 + stageProgress * 0.4})`,
                        opacity: stageProgress
                      }}
                    >
                      {Array.from({ length: Math.floor(Math.random() * 6) + 1 }, (_, j) => (
                        <div key={j} className={styles.dot} />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
              
              <div 
                className={styles.controls}
                style={{
                  opacity: stageProgress,
                  transform: `translateY(${50 - stageProgress * 50}px)`
                }}
              >
                <div className={styles.slider}>
                  <label>Grid Size</label>
                  <input type="range" min="10" max="50" defaultValue="30" />
                </div>
                <div className={styles.slider}>
                  <label>Contrast</label>
                  <input type="range" min="0" max="100" defaultValue="0" />
                </div>
                <div className={styles.slider}>
                  <label>Brightness</label>
                  <input type="range" min="0" max="200" defaultValue="100" />
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Build Stage */}
        {currentStage === 'build' && (
          <div className={`${styles.stage} ${styles.buildStage}`}>
            <div className={styles.buildContainer}>
              <div className={styles.buildCanvas}>
                <div className={styles.buildGrid}>
                  {Array.from({ length: 100 }, (_, i) => {
                    const isCompleted = (i / 100) < (buildProgress / 100)
                    return (
                      <div 
                        key={i}
                        className={`${styles.buildDice} ${isCompleted ? styles.completed : styles.pending}`}
                      >
                        {isCompleted && Array.from({ length: Math.floor(Math.random() * 6) + 1 }, (_, j) => (
                          <div key={j} className={styles.dot} />
                        ))}
                      </div>
                    )
                  })}
                </div>
                
                <div className={styles.buildProgress}>
                  <div className={styles.progressLabel}>
                    Building: {Math.round(buildProgress)}%
                  </div>
                  <div className={styles.progressBarBuild}>
                    <div 
                      className={styles.progressFillBuild}
                      style={{ width: `${buildProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Call to Action Stage */}
        {currentStage === 'cta' && (
          <div className={`${styles.stage} ${styles.ctaStage}`}>
            <div 
              className={styles.ctaContent}
              style={{
                opacity: stageProgress,
                transform: `translateY(${50 - stageProgress * 50}px)`
              }}
            >
              <h2>Start Building Yours Today</h2>
              <p>Create stunning dice art from your own photos</p>
              <button className={styles.ctaButton}>
                Launch Editor
              </button>
            </div>
          </div>
        )}
        
        </div>
      </div>
    </>
  )
}