'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/common/Navbar'
import { useAuth } from '@/contexts/AuthContext'

export default function Home() {
  const { user } = useAuth()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const query = searchQuery.trim()
    router.push(query ? `/marketplace?search=${encodeURIComponent(query)}` : '/marketplace')
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section
        className="px-4 py-16 md:py-24"
        style={{ background: 'linear-gradient(120deg, #EEF2FF 0%, #ECFEFF 60%, #FFFFFF 100%)' }}
      >
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-6">
            Welcome to Peerly
          </h1>
          <p className="text-lg md:text-xl text-text-secondary mb-8 max-w-2xl mx-auto">
            Your college-only marketplace for buying, selling, and renting items.
            Connect with verified students in your community.
          </p>

          <form onSubmit={handleSearch} className="flex gap-2 max-w-xl mx-auto mb-8">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search calculator, cycle, textbook…"
              className="min-w-0 flex-1 px-4 py-3 text-sm sm:text-base border border-secondary-dark rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <button
              type="submit"
              className="px-4 sm:px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors whitespace-nowrap"
            >
              Search
            </button>
          </form>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!user && (
              <Link
                href="/auth/login"
                className="px-8 py-4 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
              >
                Sign Up & Post Your First Item
              </Link>
            )}
            <Link
              href="/marketplace"
              className="px-8 py-4 border-2 border-primary text-primary rounded-lg font-medium hover:bg-primary/10 transition-colors"
            >
              Browse Marketplace
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
