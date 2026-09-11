import './globals.css'
import './prototype.css'
import type { Metadata } from 'next'
export const metadata:Metadata={title:'AIC Cathedral Primary School',description:'AIC Cathedral Primary School — faith, learning and character. School website and secure management portal.'}
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
