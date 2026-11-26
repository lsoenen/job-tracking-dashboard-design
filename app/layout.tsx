import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { ApplicationsProvider } from '@/components/applications-provider'
import { JobProfileProvider } from '@/components/job-profile-provider'
import { Toaster } from 'sonner'
import './globals.css'

export const metadata: Metadata = {
  title: 'Pursuit — Job Search Dashboard',
  description: 'Track applications, manage your job profile, and explore roles matched to your background.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#ffffff',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="light">
      <body className="antialiased">
        <ApplicationsProvider>
          <JobProfileProvider>{children}</JobProfileProvider>
        </ApplicationsProvider>
        <Toaster position="bottom-right" richColors />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
