'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Navbar } from '@/components/common/Navbar'
import toast from 'react-hot-toast'

export default function SetUsernamePage() {
  const [username, setUsername] = useState('')
  const [userId, setUserId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const { setUsername: setUserUsername } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Get pending user info from sessionStorage
    const pendingUser = sessionStorage.getItem('pendingUser')
    if (pendingUser) {
      const user = JSON.parse(pendingUser)
      setUserId(user.userId)
    } else {
      // No pending user, redirect to signup
      router.push('/auth/signup')
    }
  }, [router])

  const validateUsername = (value: string) => {
    return /^[a-zA-Z0-9_]{3,20}$/.test(value)
  }

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setUsername(value)
    setIsAvailable(null)

    if (value && validateUsername(value)) {
      // Check availability (you can add debouncing here)
      // For now, we'll check on submit
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!userId) {
      toast.error('Session expired. Please sign up again.')
      router.push('/auth/signup')
      return
    }

    if (!validateUsername(username)) {
      toast.error('Username must be 3-20 characters and contain only letters, numbers, and underscores')
      return
    }

    setLoading(true)
    try {
      await setUserUsername(userId, username)
      // Clear sessionStorage
      sessionStorage.removeItem('pendingUser')
      toast.success('Welcome to Peerly!')
      // Navigation happens in setUserUsername
    } catch (error: any) {
      console.error('Set username error:', error)
      toast.error(error?.response?.data?.message || error?.message || 'Failed to set username. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-white rounded-lg shadow-md overflow-hidden grid md:grid-cols-2">
          <div className="hidden md:flex flex-col justify-between bg-text-primary text-white p-10">
            <div className="text-xl font-bold">Peerly</div>
            <ul className="space-y-4 text-sm text-white/85">
              <li className="flex gap-2 items-start"><span className="text-success font-bold">✓</span> One more step to go</li>
              <li className="flex gap-2 items-start"><span className="text-success font-bold">✓</span> This is how other students see you</li>
              <li className="flex gap-2 items-start"><span className="text-success font-bold">✓</span> You can change it later in settings</li>
            </ul>
            <div />
          </div>

          <div className="p-8 md:p-10">
          <h1 className="text-3xl font-bold text-text-primary mb-2 text-center">
            Choose Your Username
          </h1>
          <p className="text-text-secondary text-center mb-8">
            Pick a unique username that others will see on your profile
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-text-primary mb-2">
                Username
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary">
                  @
                </span>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={handleUsernameChange}
                  required
                  minLength={3}
                  maxLength={20}
                  pattern="[a-zA-Z0-9_]{3,20}"
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="username"
                  autoFocus
                />
              </div>
              <p className="mt-2 text-xs text-text-secondary">
                {username && !validateUsername(username) && (
                  <span className="text-red-500">
                    Username must be 3-20 characters and contain only letters, numbers, and underscores
                  </span>
                )}
                {username && validateUsername(username) && (
                  <span className="text-green-600">✓ Valid username</span>
                )}
                {!username && '3-20 characters, letters, numbers, and underscores only'}
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !username || !validateUsername(username)}
              className="w-full py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Setting up...' : 'Continue'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-text-secondary">
            Your username can be changed later in settings
          </p>
          </div>
        </div>
      </div>
    </div>
  )
}
