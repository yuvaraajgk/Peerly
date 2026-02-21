import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { Toaster } from 'react-hot-toast'
import { GoogleOAuthProvider } from '@react-oauth/google'

export const metadata: Metadata = {
  title: 'Peerly - College Marketplace',
  description: 'Buy, sell, and rent items within your college community',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''

  return (
    <html lang="en">
      <body>
        <GoogleOAuthProvider clientId={googleClientId}>
          <AuthProvider>
            {children}
            <Toaster position="top-right" />
          </AuthProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  )
}
