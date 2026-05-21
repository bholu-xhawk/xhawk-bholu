import type { Metadata } from 'next'
import './globals.css'
import Footer from '../components/Footer'

export const metadata: Metadata = {
  title: 'My Next.js 14 Portfolio',
  description: 'A simple starter with Tailwind and dummy sections',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <div className="mx-auto max-w-5xl px-4">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  )
}
