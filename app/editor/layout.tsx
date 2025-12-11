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

import Providers from '@/components/Providers'

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Providers>
      {children}
    </Providers>
  )
}