import Link from 'next/link'

const categories = [
  { name: 'Tech Gadgets', icon: '💻', slug: 'tech' },
  { name: 'Books', icon: '📚', slug: 'books' },
  { name: 'Stationery', icon: '✏️', slug: 'stationery' },
  { name: 'Apparel', icon: '👕', slug: 'apparel' },
  { name: 'Student Essentials', icon: '🎒', slug: 'essentials' },
]

export function FeaturedCategories() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {categories.map((category) => (
        <Link
          key={category.slug}
          href={`/marketplace?category=${category.slug}`}
          className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-surface text-center group"
        >
          <div className="text-4xl mb-3">{category.icon}</div>
          <h3 className="text-lg font-medium text-text-primary group-hover:text-primary transition-colors">
            {category.name}
          </h3>
        </Link>
      ))}
    </div>
  )
}
