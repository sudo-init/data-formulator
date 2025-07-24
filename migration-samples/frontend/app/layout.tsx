/**
 * Root Layout Component for Data Formulator
 * Migrated from original App.tsx to Next.js App Router layout
 */

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

// Import AG Grid CSS in layout to avoid SSR issues
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Data Formulator',
  description: 'AI-powered data visualization and transformation tool',
  icons: {
    icon: '/assets/df-logo.png'
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-white`}>
        <Providers>
          <div className="absolute inset-0 min-w-[1000px] min-h-[800px]">
            <div className="flex flex-col h-full w-full overflow-hidden">
              {children}
            </div>
          </div>
        </Providers>
      </body>
    </html>
  )
}