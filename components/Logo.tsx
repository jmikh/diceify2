'use client'

import styles from './Logo.module.css'

export default function Logo() {
  return (
    <div className={styles.logo} data-testid="app-logo">
      <div className={styles.logoIcon}></div>
      <span className={styles.logoText}>Diceify</span>
    </div>
  )
}