import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dice Art Editor',
  description: 'Create your dice mosaic art. Upload an image, adjust settings, and build your physical dice artwork step by step.',
  openGraph: {
    title: 'Dice Art Editor | Diceify',
    description: 'Create your dice mosaic art. Upload an image, adjust settings, and build your physical dice artwork step by step.',
    url: 'https://diceify.art/editor',
  },
  twitter: {
    title: 'Dice Art Editor | Diceify',
    description: 'Create your dice mosaic art. Upload an image, adjust settings, and build your physical dice artwork step by step.',
  },
}

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}