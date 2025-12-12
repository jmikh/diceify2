import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Diceify | Create Dice Mosaic',
  description: 'Helps build real dice mosaic art from your digital photos.',
  openGraph: {
    title: 'Diceify | Create Dice Mosaic',
    description: 'Helps build real dice mosaic art from your digital photos.',
    url: 'https://diceify.art',
  },
  twitter: {
    title: 'Diceify | Create Dice Mosaic',
    description: 'Helps build real dice mosaic art from your digital photos.',
  },
}

import { auth } from '@/lib/auth'
import { SessionProvider } from 'next-auth/react'
import { AnalyticsTracker } from '@/components/Analytics/AnalyticsTracker'

export default async function EditorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  return (
    <SessionProvider session={session}>
      {children}
      <AnalyticsTracker user={session?.user} />
    </SessionProvider>
  )
}