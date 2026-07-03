'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '@/contexts/AuthContext'
import { Navbar } from '@/components/common/Navbar'
import toast from 'react-hot-toast'

export default function SignupPage() {
  const [loading, setLoading] = useState(false)
  const [isExistingUser, setIsExistingUser] = useState(false)
  const [storedCredential, setStoredCredential] = useState<string | null>(null)
  const [triggerGoogleClick, setTriggerGoogleClick] = useState(false)
  const [isLoginAttempt, setIsLoginAttempt] = useState(false)
  const googleButtonContainerRef = useRef<HTMLDivElement>(null)
  const { googleAuth } = useAuth()
  const router = useRouter()

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setLoading(true)
    const loginAttempt = isLoginAttempt
    setIsLoginAttempt(false) // Reset after use
    
    try {
      // If triggered from Login link, treat as login (isSignup: false)
      // Otherwise, treat as signup (isSignup: true) to detect existing users
      const result = await googleAuth(credentialResponse.credential, !loginAttempt)
      
      // Check if user already exists (only in signup mode)
      if (!loginAttempt && result.isExistingUser) {
        setIsExistingUser(true)
        setStoredCredential(credentialResponse.credential)
        setLoading(false)
        return
      }
      
      // If this was a login attempt, proceed with login flow
      if (loginAttempt) {
        if (result.needsUsername && result.userId) {
          // Store user info temporarily for username setup
          sessionStorage.setItem('pendingUser', JSON.stringify({
            userId: result.userId,
          }))
          router.push('/auth/set-username')
        }
        // If no username needed, user is redirected to dashboard automatically
        return
      }
      
      // Signup flow - new user
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
      setLoading(false)
    } finally {
      if (!isExistingUser) {
        setLoading(false)
      }
    }
  }

  // Trigger Google button click when triggerGoogleClick is true
  useEffect(() => {
    if (triggerGoogleClick && googleButtonContainerRef.current) {
      // Wait for Google button to render
      const timer = setTimeout(() => {
        // Find the Google button - it's usually rendered as a div with role="button"
        const findAndClickGoogleButton = () => {
          // Look for the Google button in the container
          const container = googleButtonContainerRef.current
          if (!container) return false

          // Try multiple selectors
          const selectors = [
            'div[role="button"]',
            'iframe + div',
            '[id*="google"]',
            'div[aria-label*="Sign"]'
          ]

          for (const selector of selectors) {
            const button = container.querySelector(selector) as HTMLElement
            if (button && button.offsetParent !== null) {
              // Check if it's visible and clickable
              const rect = button.getBoundingClientRect()
              if (rect.width > 0 && rect.height > 0) {
                button.click()
                return true
              }
            }
          }

          // Fallback: try clicking all divs with role="button"
          const allButtons = container.querySelectorAll('div[role="button"]')
          for (const btn of Array.from(allButtons)) {
            const htmlBtn = btn as HTMLElement
            const rect = htmlBtn.getBoundingClientRect()
            if (rect.width > 0 && rect.height > 0 && htmlBtn.offsetParent !== null) {
              htmlBtn.click()
              return true
            }
          }
          return false
        }

        // Try multiple times with increasing delays
        let attempts = 0
        const maxAttempts = 10
        const tryClick = () => {
          attempts++
          if (findAndClickGoogleButton()) {
            setTriggerGoogleClick(false)
          } else if (attempts < maxAttempts) {
            setTimeout(tryClick, 150)
          } else {
            setTriggerGoogleClick(false)
            setLoading(false)
          }
        }
        tryClick()
      }, 100)

      return () => clearTimeout(timer)
    }
  }, [triggerGoogleClick])

  const handleLoginClick = async () => {
    if (!storedCredential) {
      // If no stored credential, trigger Google sign-in again for login
      setIsLoginAttempt(true)
      setTriggerGoogleClick(true)
      setIsExistingUser(false)
      return
    }
    
    setLoading(true)
    setIsExistingUser(false)
    
    try {
      // Call googleAuth without isSignup flag to log in
      const result = await googleAuth(storedCredential, false)
      
      if (result.needsUsername && result.userId) {
        // Store user info temporarily for username setup
        sessionStorage.setItem('pendingUser', JSON.stringify({
          userId: result.userId,
        }))
        router.push('/auth/set-username')
      }
      // If no username needed, user is redirected to dashboard automatically
    } catch (error: any) {
      console.error('Google login error:', error)
      toast.error(error?.response?.data?.message || error?.message || 'Login failed. Please try again.')
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
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-text-primary mb-6 text-center">
            Sign Up
          </h1>
          
          {isExistingUser ? (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800 text-center font-medium">
                  Account already exists. Please log in instead.
                </p>
              </div>
              
              <div className="flex justify-center">
                {loading ? (
                  <div className="flex items-center gap-3 py-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
                    <span>Logging in...</span>
                  </div>
                ) : (
                  <button
                    onClick={handleLoginClick}
                    className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium"
                  >
                    Login
                  </button>
                )}
              </div>
              
              <p className="mt-6 text-center text-text-secondary">
                Want to sign up with a different account?{' '}
                <button
                  onClick={() => {
                    setIsExistingUser(false)
                    setStoredCredential(null)
                    setTriggerGoogleClick(false)
                  }}
                  className="text-primary hover:underline"
                >
                  Try again
                </button>
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-text-secondary mb-4 text-center">
                    Sign up with your college Gmail account to get started
                  </p>
                </div>

                <div className="flex justify-center" ref={googleButtonContainerRef}>
                  {loading && !triggerGoogleClick ? (
                    <div className="flex items-center gap-3 py-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
                      <span>Signing up...</span>
                    </div>
                  ) : (
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={handleGoogleError}
                      useOneTap={false}
                      theme="outline"
                      size="large"
                      text="signup_with"
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

                <p className="text-xs text-text-secondary text-center">
                  By signing up, you agree to Peerly's Terms of Service and Privacy Policy
                </p>
              </div>

              <p className="mt-6 text-center text-text-secondary">
                Already have an account?{' '}
                <button
                  onClick={() => router.push('/auth/login')}
                  className="text-primary hover:underline"
                >
                  Login
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
