'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

export function Navbar() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const handleLogout = () => {
    logout()
    router.push('/')
    setShowDropdown(false)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDropdown])

  return (
    <nav className="bg-white shadow-sm border-b border-surface">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-primary">
            Peerly
          </Link>
          
          <div className="flex items-center gap-6">
            {user ? (
              <>
                <Link href="/marketplace" className="text-text-primary hover:text-primary transition-colors">
                  Marketplace
                </Link>
                <Link href="/dashboard" className="text-text-primary hover:text-primary transition-colors">
                  Dashboard
                </Link>
                <Link href="/messages" className="text-text-primary hover:text-primary transition-colors">
                  Inbox
                </Link>
                
                {/* Profile Picture Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-full"
                  >
                    {user.profilePicture ? (
                      <img
                        src={user.profilePicture}
                        alt={user.displayName}
                        className="w-10 h-10 rounded-full border-2 border-gray-200 hover:border-primary transition-colors"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-semibold text-sm border-2 border-gray-200 hover:border-primary transition-colors">
                        {user.displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </button>

                  {/* Dropdown Menu */}
                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                      <div className="px-4 py-3 border-b border-gray-200">
                        <p className="text-sm font-semibold text-text-primary">{user.displayName}</p>
                        <p className="text-xs text-text-secondary mt-1">{user.collegeEmail}</p>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-gray-50 transition-colors"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/marketplace" className="text-text-primary hover:text-primary transition-colors">
                  Browse
                </Link>
                <Link
                  href="/auth/signup"
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
