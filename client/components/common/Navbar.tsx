'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

export function Navbar() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [showDropdown, setShowDropdown] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)

  const handleLogout = () => {
    logout()
    router.push('/')
    setShowDropdown(false)
    setShowMobileMenu(false)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setShowMobileMenu(false)
      }
    }

    if (showDropdown || showMobileMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDropdown, showMobileMenu])

  return (
    <nav className="bg-white shadow-sm border-b border-surface relative">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-primary">
            Peerly
          </Link>

          {user ? (
            <>
              {/* Desktop nav links */}
              <div className="hidden md:flex items-center gap-6">
                <Link href="/marketplace" className="text-text-primary hover:text-primary transition-colors">
                  Marketplace
                </Link>
                <Link href="/dashboard" className="text-text-primary hover:text-primary transition-colors">
                  Dashboard
                </Link>
                <Link href="/messages" className="text-text-primary hover:text-primary transition-colors">
                  Inbox
                </Link>

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
              </div>

              {/* Mobile: avatar + hamburger */}
              <div className="flex md:hidden items-center gap-3">
                {user.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt={user.displayName}
                    className="w-9 h-9 rounded-full border-2 border-gray-200"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-semibold text-sm border-2 border-gray-200">
                    {user.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  aria-label="Open menu"
                  className="p-2 -mr-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary rounded-lg"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {showMobileMenu ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3 sm:gap-6">
              <Link href="/marketplace" className="text-text-primary hover:text-primary transition-colors">
                Browse
              </Link>
              <Link
                href="/auth/login"
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                Login
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile dropdown menu (logged in) */}
      {user && showMobileMenu && (
        <div ref={mobileMenuRef} className="md:hidden absolute right-4 top-full mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          <div className="px-4 py-3 border-b border-gray-200">
            <p className="text-sm font-semibold text-text-primary">{user.displayName}</p>
            <p className="text-xs text-text-secondary mt-1">{user.collegeEmail}</p>
          </div>
          <Link
            href="/marketplace"
            onClick={() => setShowMobileMenu(false)}
            className="block px-4 py-2 text-sm text-text-primary hover:bg-gray-50 transition-colors"
          >
            Marketplace
          </Link>
          <Link
            href="/dashboard"
            onClick={() => setShowMobileMenu(false)}
            className="block px-4 py-2 text-sm text-text-primary hover:bg-gray-50 transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/messages"
            onClick={() => setShowMobileMenu(false)}
            className="block px-4 py-2 text-sm text-text-primary hover:bg-gray-50 transition-colors"
          >
            Inbox
          </Link>
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-gray-50 transition-colors border-t border-gray-200 mt-1"
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  )
}
