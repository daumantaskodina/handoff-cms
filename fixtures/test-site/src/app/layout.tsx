import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Acme - Build Faster with AI',
  description: 'Ship beautiful websites in hours, not weeks.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        {children}
      </body>
    </html>
  )
}
