import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Image Analyzer',
  description: 'Drop an image and get instant OCR, analysis, and summary powered by Claude Vision.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className} style={{ backgroundColor: '#0a0a0a', color: '#ffffff', minHeight: '100vh' }}>
        {children}
      </body>
    </html>
  )
}
