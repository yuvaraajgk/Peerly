'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/common/Navbar'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/services/api'
import toast from 'react-hot-toast'

interface Listing {
  itemId: number
  title: string
  status: string
  priceSale: number | null
  priceRentDaily: number | null
  thumbnail: string | null
}

interface Order {
  transactionId: number
  itemId: number
  title: string
  transactionType: string
  totalAmount: number
  paymentStatus: string
  transactionStatus: string
  thumbnail: string | null
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'listings' | 'orders'>('listings')
  const [listings, setListings] = useState<Listing[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    } else if (user) {
      fetchData()
    }
  }, [user, authLoading, router])

  const fetchData = async () => {
    try {
      const [listingsRes, ordersRes] = await Promise.all([
        api.get('/items/my/listings'),
        api.get('/orders/my'),
      ])
      setListings(listingsRes.data.items)
      setOrders(ordersRes.data.orders)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateItemStatus = async (itemId: number, status: string) => {
    try {
      await api.patch(`/items/${itemId}/status`, { status })
      const statusMessages: { [key: string]: string } = {
        'Available': 'Item is now available for sale/rent',
        'Sold': 'Item marked as sold',
        'Rented': 'Item marked as rented',
      }
      toast.success(statusMessages[status] || 'Status updated successfully')
      fetchData()
    } catch (error: any) {
      console.error('Failed to update status:', error)
      toast.error(error.response?.data?.message || 'Failed to update status')
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-surface">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-16 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-text-primary">Dashboard</h1>
          <div className="flex gap-4">
            <Link
              href="/dashboard/list-item"
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
            >
              List an Item
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md">
          <div className="border-b border-surface">
            <div className="flex">
              <button
                onClick={() => setActiveTab('listings')}
                className={`px-6 py-4 font-medium ${
                  activeTab === 'listings'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                My Listings
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`px-6 py-4 font-medium ${
                  activeTab === 'orders'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                My Wishlist
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'listings' && (
              <div>
                {listings.length === 0 ? (
                  <p className="text-text-secondary text-center py-8">
                    You haven't listed any items yet.{' '}
                    <Link href="/dashboard/list-item" className="text-primary hover:underline">
                      List your first item
                    </Link>
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {listings.map((listing) => (
                      <div key={listing.itemId} className="border border-surface rounded-lg p-4">
                        <Link href={`/marketplace/${listing.itemId}`}>
                          <h3 className="font-semibold text-text-primary mb-2">{listing.title}</h3>
                        </Link>
                        <p className="text-sm text-text-secondary mb-4">
                          Status: <span className={`font-medium ${
                            listing.status === 'Draft' ? 'text-amber-600' : ''
                          }`}>
                            {listing.status === 'Draft' ? 'Draft (Offline)' : listing.status}
                          </span>
                        </p>
                        {listing.status === 'Available' && (
                          <div className="space-y-2">
                            <div className="flex gap-2">
                              <button
                                onClick={() => router.push(`/dashboard/edit-item/${listing.itemId}`)}
                                className="flex-1 px-3 py-2 bg-secondary text-text-primary rounded text-sm hover:bg-gray-200 transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => updateItemStatus(listing.itemId, 'Sold')}
                                className="flex-1 px-3 py-2 bg-success text-white rounded text-sm hover:bg-green-700"
                              >
                                Mark Sold
                              </button>
                            </div>
                            {listing.priceRentDaily && (
                              <button
                                onClick={() => updateItemStatus(listing.itemId, 'Rented')}
                                className="w-full px-3 py-2 bg-warning text-white rounded text-sm hover:bg-orange-600"
                              >
                                Mark Rented
                              </button>
                            )}
                          </div>
                        )}
                        {listing.status === 'Draft' && (
                          <button
                            onClick={() => router.push(`/dashboard/edit-item/${listing.itemId}`)}
                            className="w-full px-3 py-2 bg-primary text-white rounded text-sm hover:bg-primary-dark transition-colors"
                          >
                            Continue Editing
                          </button>
                        )}
                        {(listing.status === 'Sold' || listing.status === 'Rented') && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => router.push(`/dashboard/edit-item/${listing.itemId}`)}
                              className="flex-1 px-3 py-2 bg-secondary text-text-primary rounded text-sm hover:bg-gray-200 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => updateItemStatus(listing.itemId, 'Available')}
                              className="flex-1 px-3 py-2 bg-primary text-white rounded text-sm hover:bg-primary-dark transition-colors"
                            >
                              Launch Ad
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'orders' && (
              <div>
                {orders.length === 0 ? (
                  <p className="text-text-secondary text-center py-8">
                    Your wishlist is empty.{' '}
                    <Link href="/marketplace" className="text-primary hover:underline">
                      Browse marketplace
                    </Link>
                  </p>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.transactionId} className="border border-surface rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-text-primary">{order.title}</h3>
                            <p className="text-sm text-text-secondary mt-1">
                              Type: {order.transactionType} | Amount: ₹{order.totalAmount.toLocaleString()}
                            </p>
                            <p className="text-sm text-text-secondary">
                              Payment: {order.paymentStatus} | Status: {order.transactionStatus}
                            </p>
                          </div>
                          <Link
                            href={`/marketplace/${order.itemId}`}
                            className="text-primary hover:underline text-sm"
                          >
                            View Item
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
