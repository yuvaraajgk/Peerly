'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/services/api'

interface User {
  userId: number
  collegeEmail: string
  displayName: string
  username?: string
  isVerified: boolean
  profilePicture?: string | null
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, displayName: string, password: string) => Promise<void>
  logout: () => void
  verifyEmail: (token: string) => Promise<void>
  googleAuth: (credential: string, isSignup?: boolean) => Promise<{ needsUsername: boolean; userId?: number; isExistingUser?: boolean }>
  setUsername: (userId: number, username: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check for stored token and validate
    const token = localStorage.getItem('token')
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      fetchUser()
    } else {
      setLoading(false)
    }
  }, [])

  const fetchUser = async () => {
    try {
      const response = await api.get('/auth/me')
      setUser(response.data.user)
    } catch (error) {
      localStorage.removeItem('token')
      delete api.defaults.headers.common['Authorization']
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password })
    const { token, user } = response.data
    localStorage.setItem('token', token)
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    setUser(user)
    router.push('/dashboard')
  }

  const signup = async (email: string, displayName: string, password: string) => {
    await api.post('/auth/signup', { email, displayName, password })
    // User will need to verify email before login
  }

  const verifyEmail = async (token: string) => {
    await api.post('/auth/verify-email', { token })
    router.push('/auth/login')
  }

  const googleAuth = async (credential: string, isSignup: boolean = false) => {
    const response = await api.post('/auth/google', { credential, isSignup })
    const { token, user, needsUsername, userId, isExistingUser } = response.data
    
    // If existing user trying to sign up, return flag without logging in
    if (isExistingUser) {
      return { isExistingUser: true, needsUsername: false }
    }
    
    // Store token and user info
    if (token) {
      localStorage.setItem('token', token)
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    }
    
    if (user) {
      setUser(user)
    }
    
    // If user needs username, return that info
    if (needsUsername && userId) {
      return { needsUsername: true, userId }
    }
    
    // User is fully authenticated, redirect to dashboard
    if (token && user) {
      router.push('/dashboard')
    }
    
    return { needsUsername: false }
  }

  const setUsername = async (userId: number, username: string) => {
    const response = await api.post('/auth/set-username', { userId, username })
    const { token, user } = response.data
    localStorage.setItem('token', token)
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    setUser(user)
    router.push('/dashboard')
  }

  const logout = () => {
    localStorage.removeItem('token')
    delete api.defaults.headers.common['Authorization']
    setUser(null)
    router.push('/')
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, verifyEmail, googleAuth, setUsername }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
