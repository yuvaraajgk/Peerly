import Link from 'next/link'
import Image from 'next/image'

interface ItemCardProps {
  item: {
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
}

export function ItemCard({ item }: ItemCardProps) {
  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'New':
        return 'bg-success/10 text-success'
      case 'Like New':
        return 'bg-primary/10 text-primary-dark'
      case 'Good':
        return 'bg-warning/10 text-warning'
      default:
        return 'bg-surface text-text-secondary'
    }
  }

  // strip /api for static files
  const getImageUrl = (thumbnail: string | null) => {
    if (!thumbnail) return null
    if (thumbnail.startsWith('http://') || thumbnail.startsWith('https://')) return thumbnail
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
    const baseUrl = apiUrl.replace('/api', '')
    const thumbnailPath = thumbnail.startsWith('/') ? thumbnail : `/${thumbnail}`
    return `${baseUrl}${thumbnailPath}`
  }

  const imageUrl = getImageUrl(item.thumbnail)

  return (
    <Link href={`/marketplace/${item.itemId}`}>
      <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden">
        <div className="aspect-square relative bg-white">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={item.title}
              fill
              className="object-contain"
              unoptimized={true}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-text-secondary bg-surface">
              No Image
            </div>
          )}
          <div className="absolute top-2 left-2 flex gap-2">
            {item.isForSale && (
              <span className="px-2.5 py-1 bg-white/95 text-primary-dark text-xs font-semibold rounded-full shadow-sm">
                For Sale
              </span>
            )}
            {item.isForRent && (
              <span className="px-2.5 py-1 bg-white/95 text-warning text-xs font-semibold rounded-full shadow-sm">
                For Rent
              </span>
            )}
          </div>
        </div>
        <div className="p-4">
          <h3 className="text-lg font-semibold text-text-primary mb-2 line-clamp-2">
            {item.title}
          </h3>
          <div className="flex items-center justify-between mb-2">
            <div>
              {item.isForSale && item.priceSale && (
                <p className="text-xl font-bold text-primary font-mono tabular-nums">
                  ₹{item.priceSale.toLocaleString()}
                </p>
              )}
              {item.isForRent && item.priceRentDaily && (
                <p className="text-lg font-semibold text-warning font-mono tabular-nums">
                  ₹{item.priceRentDaily}/day
                </p>
              )}
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getConditionColor(item.condition)}`}>
              {item.condition}
            </span>
          </div>
          <p className="text-sm text-text-secondary">by {item.sellerName}</p>
        </div>
      </div>
    </Link>
  )
}
