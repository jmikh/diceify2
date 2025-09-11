'use client'

import Link from 'next/link'
import Logo from './Logo'
import AnimatedDiceBackground from './AnimatedDiceBackground'
import styles from './HeroSection.module.css'

export default function HeroSection() {
  return (
    <section className={styles.hero}>
      {/* Animated background */}
      <AnimatedDiceBackground />
      
      {/* Hero content */}
      <div className={styles.content}>
        {/* Logo centerpiece with glassmorphism effect */}
        <div className={styles.logoContainer}>
          <div className={styles.logoGlow}>
            <Logo />
          </div>
          <div className={styles.tagline}>
            Transform your photos into stunning dice art
          </div>
        </div>

        {/* Call to action */}
        <div className={styles.ctaContainer}>
          <Link href="/editor" className={styles.primaryButton}>
            Start Creating
            <div className={styles.buttonGlow}></div>
          </Link>
          
          <div className={styles.features}>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>📷</div>
              <span>Upload</span>
            </div>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>✂️</div>
              <span>Crop</span>
            </div>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>🎲</div>
              <span>Generate</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Scroll indicator */}
      <div className={styles.scrollIndicator}>
        <div className={styles.scrollDot}></div>
        <div className={styles.scrollText}>Scroll to explore</div>
      </div>
    </section>
  )
}