'use client'

import { SessionProvider } from "next-auth/react"
import { type Session } from "next-auth"
import { AnalyticsTracker } from "@/components/Analytics/AnalyticsTracker"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
    </>
  )
}