import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'Castra+ | Acompanhe seu Pet',
  description: 'Acompanhe o status da castração do seu pet',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Castra+',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#E94E35',
}

export default function TutorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {children}
    </div>
  )
}
