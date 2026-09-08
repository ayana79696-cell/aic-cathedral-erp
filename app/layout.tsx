import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'AIC Cathedral ERP', description: 'AIC Cathedral Primary School management system' }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html> }
