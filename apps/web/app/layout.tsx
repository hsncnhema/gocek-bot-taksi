import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import 'mapbox-gl/dist/mapbox-gl.css'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Göcek Bot Taksi',
  description: 'Göcek koyunda anlık tekne ulaşımı',
  manifest: '/manifest.json',
  themeColor: '#0D7EA0',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}