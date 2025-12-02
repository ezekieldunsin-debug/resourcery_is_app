import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Resourcery IS Portal',
  description: 'Fast IS support for the entire office',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
