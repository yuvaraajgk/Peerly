'use client'

import Link from 'next/link'
import { FeaturedCategories } from '@/components/common/FeaturedCategories'
import { Navbar } from '@/components/common/Navbar'
import { useAuth } from '@/contexts/AuthContext'

export default function Home() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="px-4 py-16 md:py-24 bg-gradient-to-b from-secondary/20 to-background">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-6">
            Welcome to Peerly
          </h1>
          <p className="text-lg md:text-xl text-text-secondary mb-8 max-w-2xl mx-auto">
            Your college-only marketplace for buying, selling, and renting items. 
            Connect with verified students in your community.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!user && (
              <Link
                href="/auth/signup"
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

      {/* Featured Categories */}
      <section className="px-4 py-16 max-w-6xl mx-auto">
        <h2 className="text-3xl font-semibold text-text-primary mb-8 text-center">
          Featured Categories
        </h2>
        <FeaturedCategories />
      </section>

      {/* How It Works - Only show when logged out */}
      {!user && (
        <section className="px-4 py-16 bg-surface">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-semibold text-text-primary mb-12 text-center">
              How It Works
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                  1
                </div>
                <h3 className="text-xl font-semibold mb-2">Sign Up</h3>
                <p className="text-text-secondary">
                  Verify your college email address to join the community
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                  2
                </div>
                <h3 className="text-xl font-semibold mb-2">List or Browse</h3>
                <p className="text-text-secondary">
                  Post items for sale or rent, or browse what others are offering
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                  3
                </div>
                <h3 className="text-xl font-semibold mb-2">Connect & Transact</h3>
                <p className="text-text-secondary">
                  Message sellers, complete transactions, and track your orders
                </p>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
