'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/common/Navbar'
import { ItemCard } from '@/components/listings/ItemCard'
import api from '@/services/api'

interface Item {
  itemId: number
  title: string
  priceSale: number | null
  priceRentDaily: number | null
  isForSale: boolean
  isForRent: boolean
  condition: string
  thumbnail: string | null
  sellerName: string
}

const CATEGORIES = [
  { name: 'Tech Gadgets', slug: 'tech' },
  { name: 'Books', slug: 'books' },
  { name: 'Stationery', slug: 'stationery' },
  { name: 'Apparel', slug: 'apparel' },
  { name: 'Student Essentials', slug: 'essentials' },
]

function MarketplaceContent() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  const category = searchParams.get('category')
  const search = searchParams.get('search') || ''
  const [searchInput, setSearchInput] = useState(search)

  useEffect(() => {
    setSearchInput(search)
  }, [search])

  useEffect(() => {
    fetchItems()
  }, [category])

  const fetchItems = async () => {
    setLoading(true)
    try {
      const params = category ? { category } : {}
      const response = await api.get('/items', { params })
      setItems(response.data.items)
    } catch (error) {
      console.error('Failed to fetch items:', error)
    } finally {
      setLoading(false)
    }
  }

  const visibleItems = useMemo(() => {
    if (!search) return items
    const q = search.toLowerCase()
    return items.filter((item) => item.title.toLowerCase().includes(q))
  }, [items, search])

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams.toString())
    if (value) next.set(key, value)
    else next.delete(key)
    router.push(`/marketplace${next.toString() ? `?${next.toString()}` : ''}`)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setParam('search', searchInput.trim() || null)
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-text-primary">
          {category ? `${category.charAt(0).toUpperCase() + category.slice(1)} Items` : 'Marketplace'}
        </h1>
        <Link
          href="/dashboard/list-item"
          className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          List an Item
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-8 bg-white border border-secondary-dark rounded-lg p-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setParam('category', null)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
              !category
                ? 'bg-text-primary text-white border-text-primary'
                : 'bg-white text-text-secondary border-secondary-dark hover:border-text-secondary'
            }`}
          >
            All
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.slug}
              onClick={() => setParam('category', c.slug)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
                category === c.slug
                  ? 'bg-text-primary text-white border-text-primary'
                  : 'bg-white text-text-secondary border-secondary-dark hover:border-text-secondary'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
        <form onSubmit={handleSearchSubmit} className="ml-auto flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search items…"
            className="px-3 py-1.5 border border-secondary-dark rounded-md text-sm min-w-[200px] focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </form>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-text-secondary">Loading items...</p>
        </div>
      ) : visibleItems.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-text-secondary text-lg">No items found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {visibleItems.map((item) => (
            <ItemCard key={item.itemId} item={item} />
          ))}
        </div>
      )}
    </>
  )
}

export default function MarketplacePage() {
  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Suspense fallback={
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-text-secondary">Loading...</p>
          </div>
        }>
          <MarketplaceContent />
        </Suspense>
      </div>
    </div>
  )
}
