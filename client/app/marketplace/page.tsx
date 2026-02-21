'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
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

export default function MarketplacePage() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()
  const category = searchParams.get('category')

  useEffect(() => {
    fetchItems()
  }, [category])

  const fetchItems = async () => {
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

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
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

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-text-secondary">Loading items...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-text-secondary text-lg">No items found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <ItemCard key={item.itemId} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
