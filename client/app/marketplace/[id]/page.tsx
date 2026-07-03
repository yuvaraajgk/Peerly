'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { Navbar } from '@/components/common/Navbar'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/services/api'
import toast from 'react-hot-toast'

interface Item {
  itemId: number
  sellerId: number
  title: string
  description: string
  condition: string
  itemAge: string | null
  priceSale: number | null
  priceRentDaily: number | null
  isForSale: boolean
  isForRent: boolean
  status: string
  sellerName: string
  images: Array<{ imageId: number; imageUrl: string; sortOrder: number }>
}

export default function ItemDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [item, setItem] = useState<Item | null>(null)
  const [loading, setLoading] = useState(true)
  const [rentalDays, setRentalDays] = useState(1)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isInWishlist, setIsInWishlist] = useState(false)
  const [wishlistTransactionId, setWishlistTransactionId] = useState<number | null>(null)
  const [selectedMode, setSelectedMode] = useState<'sale' | 'rent'>('sale')

  useEffect(() => {
    fetchItem()
  }, [params.id])

  useEffect(() => {
    if (item) {
      setSelectedMode(item.isForSale ? 'sale' : 'rent')
    }
  }, [item?.itemId])

  useEffect(() => {
    if (user && item) {
      checkWishlistStatus()
    }
  }, [user, item])

  const fetchItem = async () => {
    try {
      const response = await api.get(`/items/${params.id}`)
      setItem(response.data.item)
    } catch (error) {
      toast.error('Failed to load item')
      router.push('/marketplace')
    } finally {
      setLoading(false)
    }
  }

  const checkWishlistStatus = async () => {
    if (!user || !item) return
    
    try {
      const response = await api.get('/orders/my')
      const orders = response.data.orders || []
      const order = orders.find((o: any) => o.itemId === item.itemId)
      
      if (order) {
        setIsInWishlist(true)
        setWishlistTransactionId(order.transactionId)
      } else {
        setIsInWishlist(false)
        setWishlistTransactionId(null)
      }
    } catch (error) {
      console.error('Failed to check wishlist status:', error)
    }
  }

  const handleMarkAsInterested = async () => {
    if (!user) {
      toast.error('Please login to mark items as interested')
      router.push('/auth/login')
      return
    }

    if (!item) return

    // If already in wishlist, remove it
    if (isInWishlist && wishlistTransactionId) {
      try {
        await api.delete(`/orders/${wishlistTransactionId}`)
        setIsInWishlist(false)
        setWishlistTransactionId(null)
        toast.success('Item removed from wishlist')
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to remove from wishlist')
      }
      return
    }

    const wantsRental = item.isForRent && (!item.isForSale || selectedMode === 'rent')

    // Add to wishlist
    if (wantsRental && rentalDays < 1) {
      toast.error('Please select rental duration')
      return
    }

    try {
      const transactionType = wantsRental ? 'Rental' : 'Purchase'

      const response = await api.post('/orders', {
        itemId: item.itemId,
        transactionType,
        rentalDays: transactionType === 'Rental' ? rentalDays : undefined,
        paymentMethod: 'Cash',
      })

      setIsInWishlist(true)
      setWishlistTransactionId(response.data.transaction.transactionId)
      toast.success('Item added to your wishlist!')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add to wishlist')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-16 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        </div>
      </div>
    )
  }

  if (!item) {
    return null
  }

  const totalRentalCost = item.priceRentDaily ? item.priceRentDaily * rentalDays : 0

  // Get API base URL (remove /api suffix for static files)
  const getImageUrl = (imageUrl: string) => {
    if (!imageUrl) return null
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
    const baseUrl = apiUrl.replace('/api', '')
    // Ensure imageUrl starts with /
    const imagePath = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`
    return `${baseUrl}${imagePath}`
  }

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="grid md:grid-cols-2 gap-8 p-8">
            {/* Images */}
            <div>
              <div className="aspect-square relative bg-white rounded-lg mb-4 border border-gray-200">
                {item.images.length > 0 ? (
                  <>
                    <Image
                      src={getImageUrl(item.images[selectedImageIndex].imageUrl) || ''}
                      alt={item.title}
                      fill
                      className="object-contain rounded-lg"
                      unoptimized={true}
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    {/* Transaction Type Badges */}
                    <div className="absolute top-4 left-4 flex gap-2">
                      {item.isForSale && (
                        <span className="px-3 py-1 bg-white/95 text-primary-dark text-sm font-semibold rounded-full shadow-md">
                          For Sale
                        </span>
                      )}
                      {item.isForRent && (
                        <span className="px-3 py-1 bg-white/95 text-warning text-sm font-semibold rounded-full shadow-md">
                          For Rent
                        </span>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-text-secondary bg-surface">
                    No Image
                  </div>
                )}
              </div>
              {item.images.length > 1 && (
                <div className="grid grid-cols-5 gap-2">
                  {item.images.map((img, index) => (
                    <button
                      key={img.imageId}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`aspect-square relative rounded overflow-hidden border-2 bg-white ${
                        selectedImageIndex === index ? 'border-primary' : 'border-gray-200'
                      }`}
                    >
                      <Image
                        src={getImageUrl(img.imageUrl) || ''}
                        alt={`${item.title} ${index + 1}`}
                        fill
                        className="object-contain"
                        unoptimized={true}
                        sizes="(max-width: 768px) 20vw, 10vw"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details */}
            <div>
              <h1 className="text-3xl font-bold text-text-primary mb-4">{item.title}</h1>
              
              <div className="flex items-center gap-4 mb-6">
                <span className="px-3 py-1 bg-secondary rounded-full text-sm">
                  {item.condition}
                </span>
                {item.itemAge && (
                  <span className="text-text-secondary text-sm">Age: {item.itemAge}</span>
                )}
              </div>

              <div className="mb-6">
                {item.isForSale && item.isForRent && (
                  <div className="flex gap-2 mb-4">
                    <button
                      type="button"
                      onClick={() => setSelectedMode('sale')}
                      className={`flex-1 p-3 rounded-lg border text-center transition-colors ${
                        selectedMode === 'sale'
                          ? 'border-primary bg-primary/10'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Buy</div>
                      <div className="text-lg font-bold text-text-primary font-mono tabular-nums">
                        ₹{item.priceSale?.toLocaleString()}
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedMode('rent')}
                      className={`flex-1 p-3 rounded-lg border text-center transition-colors ${
                        selectedMode === 'rent'
                          ? 'border-primary bg-primary/10'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Rent / day</div>
                      <div className="text-lg font-bold text-text-primary font-mono tabular-nums">
                        ₹{item.priceRentDaily}
                      </div>
                    </button>
                  </div>
                )}

                {item.isForSale && !item.isForRent && item.priceSale && (
                  <p className="text-3xl font-bold text-primary mb-2 font-mono tabular-nums">
                    ₹{item.priceSale.toLocaleString()}
                  </p>
                )}

                {((item.isForRent && !item.isForSale) || (item.isForRent && item.isForSale && selectedMode === 'rent')) && item.priceRentDaily && (
                  <div className="bg-warning/10 p-4 rounded-lg mb-4">
                    <p className="text-lg font-semibold text-warning mb-2 font-mono tabular-nums">
                      ₹{item.priceRentDaily}/day
                    </p>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-text-primary">
                        Rental Duration (days)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={rentalDays}
                        onChange={(e) => setRentalDays(parseInt(e.target.value) || 1)}
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg"
                      />
                      {rentalDays > 0 && (
                        <p className="text-lg font-bold text-text-primary font-mono tabular-nums">
                          Total: ₹{totalRentalCost.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Description</h2>
                <p className="text-text-secondary whitespace-pre-wrap">{item.description || 'No description provided'}</p>
              </div>

              <div className="mb-6">
                <p className="text-text-secondary">
                  Listed by <span className="font-medium text-text-primary">{item.sellerName}</span>
                </p>
              </div>

              {item.status === 'Available' && (
                <div className="space-y-3">
                  {user && user.userId === item.sellerId ? (
                    <div className="px-4 py-3 bg-gray-100 rounded-lg text-center text-text-secondary">
                      This is your own listing
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={handleMarkAsInterested}
                        className={`w-full py-3 rounded-lg font-medium transition-colors ${
                          isInWishlist
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-primary text-white hover:bg-primary-dark'
                        }`}
                      >
                        {isInWishlist ? '✓ Marked as Interested' : 'Mark as Interested'}
                      </button>
                      <button
                        onClick={() => {
                          if (user && user.userId === item.sellerId) {
                            toast.error('You cannot message yourself')
                            return
                          }
                          router.push(`/messages?itemId=${item.itemId}&sellerId=${item.sellerId}`)
                        }}
                        className="w-full py-3 border-2 border-primary text-primary rounded-lg font-medium hover:bg-primary/10 transition-colors"
                      >
                        Message Seller
                      </button>
                    </>
                  )}
                </div>
              )}

              {item.status !== 'Available' && (
                <div className="px-4 py-3 bg-gray-200 rounded-lg text-center text-text-secondary">
                  This item is {item.status.toLowerCase()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
