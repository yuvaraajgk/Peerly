'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Navbar } from '@/components/common/Navbar'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/services/api'
import toast from 'react-hot-toast'

interface Category {
  category_id: number
  category_name: string
  slug: string
}

export default function EditItemPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const itemId = (params?.id ?? '') as string
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [transactionType, setTransactionType] = useState<'sale' | 'rent' | ''>('')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    categoryId: '',
    condition: 'Good',
    itemAge: '',
    priceSale: '',
    priceRentDaily: '',
  })
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [existingImages, setExistingImages] = useState<Array<{ imageId: number; imageUrl: string }>>([])
  const [originalStatus, setOriginalStatus] = useState<string>('')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    } else {
      fetchCategories()
      fetchItem()
    }
  }, [user, authLoading, router, itemId])

  // Cleanup preview URLs when component unmounts or images change
  useEffect(() => {
    return () => {
      imagePreviews.forEach((preview) => URL.revokeObjectURL(preview))
    }
  }, [imagePreviews])

  const fetchCategories = async () => {
    try {
      const response = await api.get('/items/categories')
      setCategories(response.data.categories)
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const fetchItem = async () => {
    try {
      const response = await api.get(`/items/${itemId}`)
      const item = response.data.item
      
      // Store original status
      setOriginalStatus(item.status || 'Available')
      
      // If item is Available, set it to Draft (offline) for editing
      if (item.status === 'Available') {
        try {
          await api.patch(`/items/${itemId}/status`, { status: 'Draft' })
        } catch (error) {
          console.error('Failed to set item offline:', error)
        }
      }
      
      // Set transaction type
      if (item.isForSale && item.isForRent) {
        setTransactionType('sale') // Default to sale if both
      } else if (item.isForSale) {
        setTransactionType('sale')
      } else if (item.isForRent) {
        setTransactionType('rent')
      }

      // Set form data
      setFormData({
        title: item.title || '',
        description: item.description || '',
        categoryId: (item.categoryId || item.category_id)?.toString() || '',
        condition: item.condition || 'Good',
        itemAge: item.itemAge || item.item_age || '',
        priceSale: (item.priceSale || item.price_sale)?.toString() || '',
        priceRentDaily: (item.priceRentDaily || item.price_rent_daily)?.toString() || '',
      })

      // Set existing images
      if (item.images && item.images.length > 0) {
        setExistingImages(item.images)
      }
    } catch (error) {
      console.error('Failed to fetch item:', error)
      toast.error('Failed to load item')
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      
      // Validate file types (only PNG and JPG)
      const validFiles: File[] = []
      const invalidFiles: string[] = []
      
      files.forEach((file) => {
        const fileType = file.type.toLowerCase()
        const fileName = file.name.toLowerCase()
        const isValidType = 
          fileType === 'image/png' || 
          fileType === 'image/jpeg' || 
          fileType === 'image/jpg' ||
          fileName.endsWith('.png') ||
          fileName.endsWith('.jpg') ||
          fileName.endsWith('.jpeg')
        
        if (isValidType) {
          validFiles.push(file)
        } else {
          invalidFiles.push(file.name)
        }
      })
      
      if (invalidFiles.length > 0) {
        toast.error(`Invalid file type(s): ${invalidFiles.join(', ')}. Only PNG and JPG images are allowed.`)
      }
      
      // Limit to 5 images total (existing + new)
      const totalImages = existingImages.length + images.length
      const filesToAdd = validFiles.slice(0, 5 - totalImages)
      
      if (filesToAdd.length > 0) {
        // Create preview URLs
        const newPreviews = filesToAdd.map((file) => URL.createObjectURL(file))
        
        // Revoke old preview URLs
        imagePreviews.forEach((preview) => URL.revokeObjectURL(preview))
        
        setImages([...images, ...filesToAdd])
        setImagePreviews([...imagePreviews, ...newPreviews])
      } else if (totalImages >= 5) {
        toast.error('Maximum 5 images allowed')
      }
    }
  }

  const removeImage = (index: number) => {
    // Revoke the preview URL
    URL.revokeObjectURL(imagePreviews[index])
    
    // Remove from both arrays
    const newImages = images.filter((_, i) => i !== index)
    const newPreviews = imagePreviews.filter((_, i) => i !== index)
    
    setImages(newImages)
    setImagePreviews(newPreviews)
  }

  const removeExistingImage = async (imageId: number) => {
    try {
      // Remove from state (backend will handle deletion if needed)
      setExistingImages(existingImages.filter((img) => img.imageId !== imageId))
    } catch (error) {
      console.error('Failed to remove image:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Debug: Log current state
    console.log('Transaction Type:', transactionType)
    console.log('Form Data:', formData)
    
    if (!transactionType) {
      toast.error('Please select transaction type (For Sale or For Rent)')
      return
    }

    // Validate required fields based on transaction type - use strict equality and early returns
    if (transactionType === 'sale') {
      // Only validate sale-specific fields for sale transactions
      if (!formData.priceSale || formData.priceSale.trim() === '') {
        toast.error('Sale price is required')
        return
      }
      if (parseFloat(formData.priceSale) <= 0 || isNaN(parseFloat(formData.priceSale))) {
        toast.error('Sale price must be greater than 0')
        return
      }
      // Explicitly skip rental price for sale transactions
    } else if (transactionType === 'rent') {
      // Only validate rent-specific fields for rent transactions
      if (!formData.priceRentDaily || formData.priceRentDaily.trim() === '') {
        toast.error('Daily rental price is required')
        return
      }
      if (parseFloat(formData.priceRentDaily) <= 0 || isNaN(parseFloat(formData.priceRentDaily))) {
        toast.error('Daily rental price must be greater than 0')
        return
      }
      // Explicitly skip sale price for rent transactions
    } else {
      // This should never happen, but just in case
      toast.error('Invalid transaction type selected')
      return
    }

    setSubmitting(true)

    try {
      const submitData = new FormData()
      submitData.append('title', formData.title)
      submitData.append('description', formData.description)
      submitData.append('categoryId', formData.categoryId)
      submitData.append('isForSale', String(transactionType === 'sale'))
      submitData.append('isForRent', String(transactionType === 'rent'))
      
      if (transactionType === 'sale') {
        submitData.append('condition', formData.condition)
        submitData.append('itemAge', formData.itemAge)
        submitData.append('priceSale', formData.priceSale)
      }
      
      if (transactionType === 'rent') {
        submitData.append('priceRentDaily', formData.priceRentDaily)
      }

      // Only append new images if any are selected
      images.forEach((image) => {
        submitData.append('images', image)
      })

      await api.patch(`/items/${itemId}`, submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      await api.patch(`/items/${itemId}/status`, { status: 'Available' })

      toast.success('Item updated successfully!')
      router.push('/dashboard')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update item')
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-surface">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        </div>
      </div>
    )
  }

  // Get API base URL (remove /api suffix for static files)
  const getImageUrl = (imageUrl: string) => {
    if (!imageUrl) return null
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
    const baseUrl = apiUrl.replace('/api', '')
    const imagePath = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`
    return `${baseUrl}${imagePath}`
  }

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-text-primary mb-8">Edit Item</h1>

        <form onSubmit={handleSubmit} noValidate className="bg-white rounded-lg shadow-md p-8 space-y-6">
          {/* Transaction Type Selection - FIRST */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Transaction Type *
            </label>
            <div className="space-y-2">
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="transactionType"
                  value="sale"
                  checked={transactionType === 'sale'}
                  onChange={() => {
                    setTransactionType('sale')
                    setFormData({ ...formData, priceRentDaily: '' })
                  }}
                  className="mr-3"
                />
                <span className="font-medium">For Sale</span>
              </label>
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="transactionType"
                  value="rent"
                  checked={transactionType === 'rent'}
                  onChange={() => {
                    setTransactionType('rent')
                    setFormData({ ...formData, priceSale: '', condition: 'Good', itemAge: '' })
                  }}
                  className="mr-3"
                />
                <span className="font-medium">For Rent</span>
              </label>
            </div>
          </div>

          {/* Show form fields only after transaction type is selected */}
          {transactionType && (
            <>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter item title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  maxLength={2000}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Describe your item"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Category *
                </label>
                <select
                  required
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat.category_id} value={cat.category_id}>
                      {cat.category_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* FOR SALE specific fields */}
              {transactionType === 'sale' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Condition *
                    </label>
                    <select
                      required
                      value={formData.condition}
                      onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="New">New</option>
                      <option value="Like New">Like New</option>
                      <option value="Good">Good</option>
                      <option value="Acceptable">Acceptable</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Item Age
                    </label>
                    <input
                      type="text"
                      value={formData.itemAge}
                      onChange={(e) => setFormData({ ...formData, itemAge: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="e.g., 6 months, 1 year"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Sale Price (₹) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.priceSale}
                      onChange={(e) => setFormData({ ...formData, priceSale: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Enter sale price"
                    />
                  </div>
                </>
              )}

              {/* FOR RENT specific fields */}
              {transactionType === 'rent' && (
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Rental Price Per Day (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.priceRentDaily}
                    onChange={(e) => setFormData({ ...formData, priceRentDaily: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Enter daily rental price"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Images (up to 5, max 2MB each) - PNG or JPG only
                </label>
                
                {/* Existing Images */}
                {existingImages.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-text-secondary mb-2">Current Images:</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                      {existingImages.map((img) => (
                        <div key={img.imageId} className="relative group">
                          <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 bg-white">
                            <img
                              src={getImageUrl(img.imageUrl) || ''}
                              alt="Existing"
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeExistingImage(img.imageId)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                            aria-label="Remove image"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* New Image Upload */}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  multiple
                  onChange={handleImageChange}
                  disabled={existingImages.length + images.length >= 5}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {existingImages.length + images.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-text-secondary mb-3">
                      {existingImages.length + images.length} image(s) total
                    </p>
                    {imagePreviews.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {imagePreviews.map((preview, index) => (
                          <div key={index} className="relative group">
                            <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 bg-white">
                              <img
                                src={preview}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                              aria-label="Remove image"
                            >
                              ×
                            </button>
                            <p className="mt-1 text-xs text-text-secondary truncate">
                              {images[index].name}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {existingImages.length + images.length >= 5 && (
                  <p className="mt-2 text-sm text-amber-600">
                    Maximum 5 images reached
                  </p>
                )}
              </div>
            </>
          )}

          <div className="flex gap-4">
            <button
              type="button"
              onClick={async () => {
                // Restore original status if it was Available
                if (originalStatus === 'Available') {
                  try {
                    await api.patch(`/items/${itemId}/status`, { status: 'Available' })
                  } catch (error) {
                    console.error('Failed to restore status:', error)
                  }
                }
                router.push('/dashboard')
              }}
              className="flex-1 px-6 py-3 border border-gray-300 text-text-primary rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Updating...' : 'Update Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
