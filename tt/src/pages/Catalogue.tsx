import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import {
  ChevronDown, Filter, Grid, List, Star, X,
  SlidersHorizontal, Check, RefreshCw
} from 'lucide-react'
import { bookApi, type Book, type Department, type Page } from '../lib/api'
import BookCard from '../components/BookCard'

const FORMATS = ['All', 'Paperback', 'Hardcover', 'Kindle / eBook']
const LANGUAGES = ['All', 'English', 'Kannada', 'Hindi']
const PRICE_PRESETS = [
  { label: 'All Prices', min: undefined, max: undefined },
  { label: 'Under ₹200', min: undefined, max: 200 },
  { label: '₹200 - ₹500', min: 200, max: 500 },
  { label: '₹500 - ₹1,000', min: 500, max: 1000 },
  { label: 'Over ₹1,000', min: 1000, max: undefined },
]
const DISCOUNT_PRESETS = [
  { label: 'All Discounts', min: undefined },
  { label: '10% Off or more', min: 10 },
  { label: '25% Off or more', min: 25 },
  { label: '35% Off or more', min: 35 },
  { label: '50% Off or more', min: 50 },
]

export default function Catalogue() {
  const [params, setParams] = useSearchParams()
  const [pageData, setPageData] = useState<Page<Book> | null>(null)
  const [loading, setLoading] = useState(true)
  const [departments, setDepartments] = useState<Department[]>([])
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Read URL query params
  const q = params.get('q') || ''
  const category = params.get('category') || params.get('genre') || ''
  const format = params.get('format') || ''
  const language = params.get('language') || ''
  const minPrice = params.get('minPrice') ? Number(params.get('minPrice')) : undefined
  const maxPrice = params.get('maxPrice') ? Number(params.get('maxPrice')) : undefined
  const minRating = params.get('minRating') ? Number(params.get('minRating')) : undefined
  const minDiscount = params.get('minDiscount') ? Number(params.get('minDiscount')) : undefined
  const available = params.get('available') === 'true'
  const bestseller = params.get('bestseller') === 'true'
  const newRelease = params.get('new_release') === 'true'
  const deals = params.get('deals') === 'true'
  const sort = params.get('sort') || 'featured'
  const page = Number(params.get('page') || '0')
  const author = params.get('author') || ''

  // Fetch departments for sidebar
  useEffect(() => {
    bookApi.departments().then(setDepartments).catch(() => {})
  }, [])

  // Fetch books on param change
  useEffect(() => {
    setLoading(true)
    bookApi.list({
      q,
      category,
      genre: category,
      format: format && format !== 'All' ? format : undefined,
      language: language && language !== 'All' ? language : undefined,
      minPrice,
      maxPrice,
      minRating,
      minDiscount,
      available,
      bestseller,
      new_release: newRelease,
      deals,
      author,
      sort,
      page,
      size: 16,
    }).then((res) => {
      setPageData(res)
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })
  }, [q, category, format, language, minPrice, maxPrice, minRating, minDiscount, available, bestseller, newRelease, deals, author, sort, page])

  const updateParam = (key: string, val: string | number | boolean | undefined) => {
    const next = new URLSearchParams(params)
    if (val === undefined || val === '' || val === false) {
      next.delete(key)
    } else {
      next.set(key, String(val))
    }
    next.set('page', '0') // reset to first page on filter change
    setParams(next)
  }

  const clearAllFilters = () => {
    setParams(new URLSearchParams())
  }

  const hasActiveFilters = Boolean(
    q || category || format || language || minPrice != null || maxPrice != null || minRating != null || minDiscount != null || available || bestseller || newRelease || deals || author
  )

  const FilterSidebar = () => (
    <div className="space-y-6 text-xs text-zinc-800">
      {/* Category / Department */}
      <div>
        <p className="font-bold text-zinc-900 text-sm mb-2.5">Category</p>
        <ul className="space-y-1.5 max-h-56 overflow-y-auto">
          <li>
            <button
              type="button"
              onClick={() => updateParam('category', undefined)}
              className={`text-left w-full hover:text-wine hover:underline ${!category ? 'font-bold text-wine' : 'text-zinc-600'}`}
            >
              All Categories
            </button>
          </li>
          {departments.map((dept) => (
            <li key={dept.id}>
              <button
                type="button"
                onClick={() => updateParam('category', dept.name)}
                className={`text-left w-full hover:text-wine hover:underline flex items-center justify-between ${
                  category === dept.name ? 'font-bold text-wine' : 'text-zinc-600'
                }`}
              >
                <span className="truncate">{dept.name}</span>
                <span className="text-zinc-400 text-[10px]">({dept.book_count})</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Customer Reviews Rating Filter */}
      <div className="border-t pt-4">
        <p className="font-bold text-zinc-900 text-sm mb-2.5">Customer Reviews</p>
        <div className="space-y-1.5">
          {[4, 3, 2, 1].map((stars) => (
            <button
              key={stars}
              type="button"
              onClick={() => updateParam('minRating', minRating === stars ? undefined : stars)}
              className={`flex items-center gap-1.5 text-zinc-600 hover:text-wine ${
                minRating === stars ? 'font-bold text-wine' : ''
              }`}
            >
              <div className="flex text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    className={i < stars ? 'fill-amber-400 text-amber-400' : 'text-zinc-300'}
                  />
                ))}
              </div>
              <span className="text-xs">& Up</span>
            </button>
          ))}
        </div>
      </div>

      {/* Price presets */}
      <div className="border-t pt-4">
        <p className="font-bold text-zinc-900 text-sm mb-2.5">Price</p>
        <div className="space-y-1.5">
          {PRICE_PRESETS.map((p) => {
            const isSelected = minPrice === p.min && maxPrice === p.max
            return (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  const next = new URLSearchParams(params)
                  if (p.min != null) next.set('minPrice', String(p.min))
                  else next.delete('minPrice')
                  if (p.max != null) next.set('maxPrice', String(p.max))
                  else next.delete('maxPrice')
                  next.set('page', '0')
                  setParams(next)
                }}
                className={`text-left w-full hover:text-wine hover:underline ${
                  isSelected ? 'font-bold text-wine' : 'text-zinc-600'
                }`}
              >
                {p.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Discount Presets */}
      <div className="border-t pt-4">
        <p className="font-bold text-zinc-900 text-sm mb-2.5">Discount</p>
        <div className="space-y-1.5">
          {DISCOUNT_PRESETS.map((d) => (
            <button
              key={d.label}
              type="button"
              onClick={() => updateParam('minDiscount', d.min)}
              className={`text-left w-full hover:text-wine hover:underline ${
                minDiscount === d.min ? 'font-bold text-wine' : 'text-zinc-600'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Book Format */}
      <div className="border-t pt-4">
        <p className="font-bold text-zinc-900 text-sm mb-2.5">Format</p>
        <div className="space-y-1.5">
          {FORMATS.map((fmt) => (
            <button
              key={fmt}
              type="button"
              onClick={() => updateParam('format', fmt === 'All' ? undefined : fmt)}
              className={`text-left w-full hover:text-wine hover:underline ${
                (format === fmt || (!format && fmt === 'All')) ? 'font-bold text-wine' : 'text-zinc-600'
              }`}
            >
              {fmt}
            </button>
          ))}
        </div>
      </div>

      {/* Language */}
      <div className="border-t pt-4">
        <p className="font-bold text-zinc-900 text-sm mb-2.5">Language</p>
        <div className="space-y-1.5">
          {LANGUAGES.map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => updateParam('language', lang === 'All' ? undefined : lang)}
              className={`text-left w-full hover:text-wine hover:underline ${
                (language === lang || (!language && lang === 'All')) ? 'font-bold text-wine' : 'text-zinc-600'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>

      {/* Availability */}
      <div className="border-t pt-4">
        <p className="font-bold text-zinc-900 text-sm mb-2.5">Availability</p>
        <label className="flex items-center gap-2 cursor-pointer text-zinc-700">
          <input
            type="checkbox"
            checked={available}
            onChange={(e) => updateParam('available', e.target.checked)}
            className="rounded border-zinc-300 text-wine focus:ring-wine"
          />
          <span>Include Out of Stock</span>
        </label>
      </div>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={clearAllFilters}
          className="w-full btn-outline text-xs py-2 mt-4"
        >
          Clear All Filters
        </button>
      )}
    </div>
  )

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Search Header / Breadcrumbs */}
      <div className="mb-4">
        <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
          <Link to="/" className="hover:text-wine">Home</Link>
          <span>/</span>
          <Link to="/books" className="hover:text-wine">Books</Link>
          {category && (
            <>
              <span>/</span>
              <span className="text-zinc-800 font-medium">{category}</span>
            </>
          )}
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg bg-white p-3 sm:p-3.5 border border-teal-900/10 shadow-sm mb-6">
        <div>
          <p className="text-xs text-zinc-600">
            {loading ? (
              'Searching catalogue...'
            ) : pageData ? (
              <span>
                Showing <strong className="text-zinc-900">{pageData.content.length > 0 ? pageData.number * pageData.size + 1 : 0}</strong> -{' '}
                <strong className="text-zinc-900">{Math.min((pageData.number + 1) * pageData.size, pageData.totalElements)}</strong> of{' '}
                <strong className="text-zinc-900">{pageData.totalElements}</strong> results
                {q && <span> for "<span className="text-teal-700 font-semibold">{q}</span>"</span>}
                {category && <span> in <span className="text-zinc-900 font-semibold">{category}</span></span>}
              </span>
            ) : null}
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          {/* Mobile Filter Trigger */}
          <button
            type="button"
            onClick={() => setMobileFilterOpen(true)}
            className="md:hidden flex-1 sm:flex-initial flex items-center justify-center gap-1.5 btn-outline text-xs py-2 px-3"
          >
            <Filter size={14} /> Filters
          </button>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-1.5 text-xs flex-1 sm:flex-initial">
            <span className="text-zinc-500 hidden sm:inline">Sort:</span>
            <select
              value={sort}
              onChange={(e) => updateParam('sort', e.target.value)}
              className="w-full sm:w-auto rounded border border-zinc-300 bg-white px-2.5 py-2 sm:py-1.5 text-xs text-zinc-800 focus:outline-none focus:ring-1 focus:ring-teal-600"
            >
              <option value="featured">Featured</option>
              <option value="bestselling">Price: Bestselling</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Avg. Customer Review</option>
              <option value="newest">Newest Arrivals</option>
              <option value="discount">Biggest Discount</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="hidden sm:flex border border-zinc-200 rounded overflow-hidden">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 ${viewMode === 'grid' ? 'bg-zinc-100 text-teal-700' : 'text-zinc-400 hover:text-zinc-700'}`}
              aria-label="Grid view"
            >
              <Grid size={16} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 ${viewMode === 'list' ? 'bg-zinc-100 text-teal-700' : 'text-zinc-400 hover:text-zinc-700'}`}
              aria-label="List view"
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 mb-5">
          <span className="text-xs text-zinc-500">Active filters:</span>
          {category && (
            <span className="inline-flex items-center gap-1 rounded-full bg-wine/10 px-3 py-1 text-xs text-wine font-medium">
              {category}
              <button type="button" onClick={() => updateParam('category', undefined)}><X size={12} /></button>
            </span>
          )}
          {q && (
            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-200 px-3 py-1 text-xs text-zinc-800 font-medium">
              "{q}"
              <button type="button" onClick={() => updateParam('q', undefined)}><X size={12} /></button>
            </span>
          )}
          {minRating && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs text-amber-900 font-medium">
              {minRating}★ & Up
              <button type="button" onClick={() => updateParam('minRating', undefined)}><X size={12} /></button>
            </span>
          )}
          {format && (
            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-200 px-3 py-1 text-xs text-zinc-800 font-medium">
              {format}
              <button type="button" onClick={() => updateParam('format', undefined)}><X size={12} /></button>
            </span>
          )}
          {minDiscount && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs text-emerald-900 font-medium">
              {minDiscount}%+ Off
              <button type="button" onClick={() => updateParam('minDiscount', undefined)}><X size={12} /></button>
            </span>
          )}
          <button
            type="button"
            onClick={clearAllFilters}
            className="text-xs text-wine font-semibold hover:underline ml-2"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Main Content Layout: Sidebar + Book Listing */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden md:block col-span-1 rounded-lg bg-white p-5 border border-wine/10 shadow-sm h-fit sticky top-24">
          <FilterSidebar />
        </aside>

        {/* Mobile Filter Modal */}
        {mobileFilterOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <div className="fixed inset-0 bg-black/60" onClick={() => setMobileFilterOpen(false)} />
            <div className="relative ml-auto flex w-full max-w-xs flex-col bg-white p-5 shadow-xl overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b mb-4">
                <span className="font-serif text-lg font-bold">Filters</span>
                <button type="button" onClick={() => setMobileFilterOpen(false)}>
                  <X size={20} />
                </button>
              </div>
              <FilterSidebar />
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="mt-6 w-full btn text-xs py-2.5"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}

        {/* Book Grid / List */}
        <div className="col-span-1 md:col-span-3">
          {loading ? (
            <div className="py-20 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-wine border-r-transparent" />
              <p className="mt-3 text-xs text-zinc-500">Searching Timeless Tales catalogue...</p>
            </div>
          ) : pageData && pageData.content.length > 0 ? (
            <div className="space-y-6">
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {pageData.content.map((book) => (
                    <BookCard key={book.id} book={book} layout="grid" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {pageData.content.map((book) => (
                    <BookCard key={book.id} book={book} layout="list" />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {pageData.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-8 border-t border-zinc-200">
                  <button
                    type="button"
                    disabled={page === 0}
                    onClick={() => updateParam('page', page - 1)}
                    className="btn-outline text-xs px-3 py-1.5 disabled:opacity-40"
                  >
                    Previous
                  </button>
                  {Array.from({ length: pageData.totalPages }).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => updateParam('page', i)}
                      className={`h-8 w-8 rounded text-xs font-semibold ${
                        page === i ? 'bg-wine text-white' : 'border border-zinc-200 hover:bg-zinc-100 text-zinc-700'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={page >= pageData.totalPages - 1}
                    onClick={() => updateParam('page', page + 1)}
                    className="btn-outline text-xs px-3 py-1.5 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-lg bg-white p-12 text-center border border-wine/10 shadow-sm">
              <p className="font-serif text-2xl font-bold text-zinc-900 mb-2">No matching books found</p>
              <p className="text-xs text-zinc-500 max-w-md mx-auto mb-6">
                We couldn't find any titles matching your filters. Try clearing your search term or adjusting filter options.
              </p>
              <button
                type="button"
                onClick={clearAllFilters}
                className="btn text-xs px-6 py-2"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
