import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Diceify | Create Dice Mosaic',
  description: 'Helps build real dice mosaic art from your digitial photos.',
  openGraph: {
    title: 'Diceify | Create Dice Mosaic',
    description: 'Helps build real dice mosaic art from your digitial photos.',
    url: 'https://diceify.art',
  },
  twitter: {
    title: 'Diceify | Create Dice Mosaic',
    description: 'Helps build real dice mosaic art from your digitial photos.',
  },
}

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}