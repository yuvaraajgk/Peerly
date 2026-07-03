'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '@/contexts/AuthContext'
import { Navbar } from '@/components/common/Navbar'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const { googleAuth } = useAuth()
  const router = useRouter()

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setLoading(true)
    try {
      const result = await googleAuth(credentialResponse.credential)
      
      if (result.needsUsername && result.userId) {
        // Store user info temporarily for username setup
        sessionStorage.setItem('pendingUser', JSON.stringify({
          userId: result.userId,
        }))
        router.push('/auth/set-username')
      }
      // If no username needed, user is redirected to dashboard automatically
    } catch (error: any) {
      console.error('Google sign in error:', error)
      toast.error(error?.response?.data?.message || error?.message || 'Sign in failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleError = () => {
    toast.error('Google sign in failed. Please try again.')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-white rounded-lg shadow-md overflow-hidden grid md:grid-cols-2">
          <div className="hidden md:flex flex-col justify-between bg-text-primary text-white p-10">
            <div className="text-xl font-bold">Peerly</div>
            <ul className="space-y-4 text-sm text-white/85">
              <li className="flex gap-2 items-start"><span className="text-success font-bold">✓</span> Verified college email required</li>
              <li className="flex gap-2 items-start"><span className="text-success font-bold">✓</span> Sign in with your existing Google account</li>
            </ul>
            <div />
          </div>

          <div className="p-8 md:p-10">
            <h1 className="text-3xl font-bold text-text-primary mb-6 text-center">Sign in to Peerly</h1>

            <div className="space-y-6">
              <div className="flex justify-center">
                {loading ? (
                  <div className="flex items-center gap-3 py-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    useOneTap={false}
                    theme="outline"
                    size="large"
                    text="signin_with"
                  />
                )}
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-text-secondary">College email required</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
