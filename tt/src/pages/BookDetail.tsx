import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  BookOpen, Check, Heart, MapPin, Share2, ShieldCheck,
  ShoppingBag, Star, Truck, ArrowRight, ThumbsUp, X,
  RotateCcw, Sparkles, AlertCircle, FileText
} from 'lucide-react'
import { bookApi, type Book, type BookEdition, type Review } from '../lib/api'
import { useStore } from '../lib/store'
import BookCard from '../components/BookCard'
import BookCover from '../components/BookCover'

export default function BookDetail() {
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const { add, wish, toggleWish, user, deliveryLocation } = useStore()

  const [book, setBook] = useState<Book | null>(null)
  const [selectedEdition, setSelectedEdition] = useState<BookEdition | null>(null)
  const [activeImage, setActiveImage] = useState<string>('')
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [added, setAdded] = useState(false)
  const [sampleModalOpen, setSampleModalOpen] = useState(false)

  // Review modal state
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewTitle, setReviewTitle] = useState('')
  const [reviewComment, setReviewComment] = useState('')
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [reviewError, setReviewError] = useState('')

  // Frequently bought together bundle state
  const [includeBundleItem1, setIncludeBundleItem1] = useState(true)
  const [includeBundleItem2, setIncludeBundleItem2] = useState(true)
  const [bundleAdded, setBundleAdded] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    bookApi.get(id).then((b) => {
      if (b) {
        setBook(b)
        // Record view in recently viewed
        bookApi.recordView(b.id).catch(() => {})

        // Default edition
        if (b.editions && b.editions.length > 0) {
          const pb = b.editions.find(e => e.format.toUpperCase().includes('PAPERBACK')) || b.editions[0]
          setSelectedEdition(pb)
        }
        setActiveImage(b.cover_url || '')
      }
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })
  }, [id])

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-wine border-r-transparent" />
        <p className="mt-3 text-xs text-zinc-500">Loading book details...</p>
      </div>
    )
  }

  if (!book) {
    return (
      <div className="mx-auto max-w-4xl py-16 text-center">
        <p className="font-serif text-2xl font-bold text-zinc-900 mb-2">Book Not Found</p>
        <p className="text-xs text-zinc-500 mb-6">The book you are looking for does not exist in our catalogue or has been retired.</p>
        <Link to="/books" className="btn text-xs px-6 py-2">
          Browse All Books
        </Link>
      </div>
    )
  }

  const currentPrice = selectedEdition ? selectedEdition.price : book.price
  const currentMrp = selectedEdition ? selectedEdition.mrp : book.mrp
  const currentStock = selectedEdition ? selectedEdition.stock : book.stock
  const currentIsbn13 = selectedEdition?.isbn13 || book.isbn13
  const currentIsbn10 = selectedEdition?.isbn10 || book.isbn10
  const savingsAmount = currentMrp > currentPrice ? currentMrp - currentPrice : 0
  const discountPercent = currentMrp > currentPrice ? Math.round((savingsAmount / currentMrp) * 100) : 0
  const isWished = wish.includes(book.id)

  const handleAddToCart = async () => {
    const success = await add(book.id, quantity, selectedEdition?.format_label || 'Paperback')
    if (success) {
      setAdded(true)
      setTimeout(() => setAdded(false), 2500)
    }
  }

  const handleBuyNow = async () => {
    await add(book.id, quantity, selectedEdition?.format_label || 'Paperback')
    if (!user) {
      // If the person is not logged in and clicks buy now, automatically open sign in page so they can login
      nav(`/login?redirect=${encodeURIComponent('/checkout')}`)
    } else {
      nav('/checkout')
    }
  }

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      nav('/login')
      return
    }
    setReviewSubmitting(true)
    setReviewError('')
    try {
      await bookApi.submitReview(book.id, {
        rating: reviewRating,
        title: reviewTitle,
        comment: reviewComment,
      })
      // Refresh book data to show new review and updated rating
      const updated = await bookApi.get(book.id)
      if (updated) setBook(updated)
      setReviewModalOpen(false)
      setReviewTitle('')
      setReviewComment('')
    } catch (err: any) {
      setReviewError(err?.message || 'Could not submit review.')
    } finally {
      setReviewSubmitting(false)
    }
  }

  const handleHelpfulVote = async (revId: string) => {
    if (!user) {
      nav('/login')
      return
    }
    try {
      await bookApi.voteReviewHelpful(revId)
      const updated = await bookApi.get(book.id)
      if (updated) setBook(updated)
    } catch {}
  }

  // Companion bundle books from related
  const companion1 = book.related_books?.[0]
  const companion2 = book.related_books?.[1]
  const bundleTotal = currentPrice +
    (includeBundleItem1 && companion1 ? companion1.price : 0) +
    (includeBundleItem2 && companion2 ? companion2.price : 0)

  const handleAddBundle = async () => {
    await add(book.id, 1, selectedEdition?.format_label || 'Paperback')
    if (includeBundleItem1 && companion1) await add(companion1.id, 1, 'Paperback')
    if (includeBundleItem2 && companion2) await add(companion2.id, 1, 'Paperback')
    setBundleAdded(true)
    setTimeout(() => setBundleAdded(false), 2500)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-10 pb-24 md:pb-10">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs text-zinc-500">
        <Link to="/" className="hover:text-wine">Home</Link>
        <span>/</span>
        <Link to="/books" className="hover:text-wine">Books</Link>
        <span>/</span>
        <Link to={`/books?category=${encodeURIComponent(book.genre)}`} className="hover:text-wine">{book.genre}</Link>
        <span>/</span>
        <span className="text-zinc-800 font-medium truncate max-w-xs">{book.title}</span>
      </nav>

      {/* Main 3-Column Product Showcase (Gallery | Information | Buy Box) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* COLUMN 1: Image Gallery (4 cols) */}
        <div className="md:col-span-4 flex flex-col items-center">
          <div className="sticky top-28 w-full max-w-sm">
            <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-stone-100 border border-zinc-200 shadow-md">
              <BookCover
                coverUrl={activeImage || book.cover_url}
                isbn13={currentIsbn13}
                title={book.title}
                author={book.author}
                genre={book.genre}
                className="h-full w-full object-cover transition-transform duration-300 hover:scale-105 cursor-zoom-in"
              />
              {book.is_bestseller && (
                <span className="absolute top-3 left-3 rounded bg-teal-700 px-2.5 py-1 text-xs font-bold tracking-wide text-white shadow-sm">
                  #1 Bestseller in {book.genre}
                </span>
              )}
            </div>

            {/* Read Sample Button */}
            <button
              type="button"
              onClick={() => setSampleModalOpen(true)}
              className="mt-3.5 w-full btn-outline text-xs py-2 flex items-center justify-center gap-2"
            >
              <BookOpen size={15} /> Read Authorized Sample Excerpt
            </button>
          </div>
        </div>

        {/* COLUMN 2: Core Product Information (5 cols) */}
        <div className="md:col-span-5 space-y-4">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-zinc-900 leading-tight">
              {book.title}
            </h1>
            {book.subtitle && (
              <p className="text-sm font-medium text-zinc-600 mt-1">{book.subtitle}</p>
            )}
            <p className="text-sm text-zinc-700 mt-1.5">
              by <Link to={`/books?author=${encodeURIComponent(book.author)}`} className="text-wine font-semibold hover:underline">{book.author}</Link>
              {book.publisher_name && (
                <span className="text-zinc-500"> (Author), <span className="text-zinc-600">{book.publisher_name}</span></span>
              )}
            </p>
          </div>

          {/* Rating summary */}
          <div className="flex items-center gap-3 border-b border-zinc-200 pb-3 text-xs">
            <div className="flex items-center text-amber-500">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={15}
                  className={i < Math.floor(book.rating) ? 'fill-amber-400 text-amber-400' : 'text-zinc-300'}
                />
              ))}
              <span className="ml-1.5 font-bold text-zinc-900 text-sm">{book.rating.toFixed(1)}</span>
            </div>
            <a href="#customer-reviews" className="text-wine hover:underline">
              {book.review_count || 12} customer ratings
            </a>
          </div>

          {/* Format Comparison Cards */}
          <div>
            <p className="text-xs font-bold text-zinc-800 uppercase tracking-wider mb-2">Available Formats & Editions</p>
            <div className="grid grid-cols-3 gap-2.5">
              {book.editions && book.editions.length > 0 ? (
                book.editions.map((ed) => {
                  const isSelected = selectedEdition?.id === ed.id
                  return (
                    <button
                      key={ed.id}
                      type="button"
                      onClick={() => setSelectedEdition(ed)}
                      className={`text-left p-2.5 rounded-lg border transition-all ${
                        isSelected
                          ? 'border-wine bg-wine/5 ring-1 ring-wine'
                          : 'border-zinc-200 hover:border-zinc-300 bg-white'
                      }`}
                    >
                      <p className="text-xs font-bold text-zinc-900">{ed.format_label}</p>
                      <p className="text-sm font-bold text-wine-dark mt-1">₹{ed.price.toFixed(2)}</p>
                      {ed.mrp > ed.price && (
                        <p className="text-[10px] text-zinc-400 line-through">₹{ed.mrp.toFixed(2)}</p>
                      )}
                      <p className="text-[10px] text-emerald-700 font-medium mt-0.5">In Stock</p>
                    </button>
                  )
                })
              ) : (
                <div className="p-2.5 rounded border border-wine bg-wine/5 text-xs font-bold">
                  Paperback: ₹{book.price.toFixed(2)}
                </div>
              )}
            </div>
          </div>

          {/* Mobile Quick Buy Box (< md) */}
          <div className="md:hidden rounded-lg border border-teal-900/15 bg-white p-4 shadow-sm space-y-3">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-2xl font-bold text-zinc-900">₹{currentPrice.toFixed(2)}</span>
                {savingsAmount > 0 && (
                  <span className="text-xs text-zinc-400 line-through ml-2">₹{currentMrp.toFixed(2)}</span>
                )}
              </div>
              {savingsAmount > 0 && (
                <span className="text-xs font-semibold text-emerald-700">
                  Save ₹{savingsAmount.toFixed(2)} ({discountPercent}% off)
                </span>
              )}
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-emerald-700">
                {currentStock > 0 ? 'In Stock' : 'Currently Unavailable'}
              </span>
              <span className="text-[11px] text-zinc-500">FREE delivery on orders over ₹499</span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={currentStock <= 0}
                className={`btn text-xs font-bold py-2.5 rounded shadow-sm ${
                  added ? '!bg-emerald-600 text-white' : '!bg-teal-700 hover:!bg-teal-800 text-white'
                }`}
              >
                {added ? 'Added!' : 'Add to Cart'}
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={currentStock <= 0}
                className="btn !bg-teal-600 hover:!bg-teal-500 text-white font-bold py-2.5 text-xs rounded shadow-sm"
              >
                Buy Now
              </button>
            </div>
          </div>

          {/* Editorial Blurb */}
          <div className="border-t border-zinc-200 pt-3">
            <p className="text-xs font-bold text-zinc-800 uppercase tracking-wider mb-1.5">Editorial Synopsis</p>
            <p className="text-xs leading-relaxed text-zinc-700">{book.blurb}</p>
            {book.description && book.description !== book.blurb && (
              <p className="text-xs leading-relaxed text-zinc-600 mt-2">{book.description}</p>
            )}
          </div>

          {/* Book Specifications Table */}
          <div className="border-t border-zinc-200 pt-3">
            <p className="text-xs font-bold text-zinc-800 uppercase tracking-wider mb-2">Product Specifications</p>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              <div>
                <dt className="text-zinc-500">Publisher</dt>
                <dd className="font-semibold text-zinc-800">{book.publisher_name || 'Timeless Tales Press'}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Publication Year</dt>
                <dd className="font-semibold text-zinc-800">{book.year}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Language</dt>
                <dd className="font-semibold text-zinc-800">{book.language || 'English'}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Print Length</dt>
                <dd className="font-semibold text-zinc-800">{book.page_count || 320} pages</dd>
              </div>
              <div>
                <dt className="text-zinc-500">ISBN-10</dt>
                <dd className="font-mono text-zinc-800">{currentIsbn10 || '0099578514'}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">ISBN-13</dt>
                <dd className="font-mono text-zinc-800">{currentIsbn13 || '9780099578512'}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* COLUMN 3: Persistent Buy Box (3 cols) */}
        <div className="md:col-span-3">
          <div className="rounded-xl border border-zinc-300 bg-white p-5 shadow-sm space-y-4 sticky top-28">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-wine-dark">₹{currentPrice.toFixed(2)}</span>
                {savingsAmount > 0 && (
                  <span className="text-xs text-zinc-400 line-through">₹{currentMrp.toFixed(2)}</span>
                )}
              </div>
              {savingsAmount > 0 && (
                <p className="text-xs font-semibold text-emerald-700 mt-0.5">
                  You Save: ₹{savingsAmount.toFixed(2)} ({discountPercent}% off)
                </p>
              )}
              <p className="text-[11px] text-zinc-500 mt-0.5">Inclusive of all taxes</p>
            </div>

            {/* Delivery estimate with PIN code */}
            <div className="border-t border-zinc-100 pt-3 text-xs space-y-1.5">
              <div className="flex items-start gap-1.5 text-zinc-700">
                <Truck size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-zinc-900">
                    FREE delivery by <span className="text-emerald-700">Wednesday, Nov 12</span>
                  </p>
                  <p className="text-zinc-500 text-[11px]">on orders dispatched over ₹499</p>
                </div>
              </div>
              <p className="text-zinc-600 text-[11px] flex items-center gap-1">
                <MapPin size={12} className="text-zinc-400" />
                {deliveryLocation.label}
              </p>
            </div>

            {/* Stock status */}
            <div>
              {currentStock > 0 ? (
                <p className="text-sm font-bold text-emerald-700">In Stock</p>
              ) : (
                <p className="text-sm font-bold text-rose-700">Currently Unavailable</p>
              )}
              <p className="text-[11px] text-zinc-500">Ships from and sold by Timeless Tales Retail India.</p>
            </div>

            {/* Quantity Selector */}
            {currentStock > 0 && (
              <div className="flex items-center gap-2 text-xs">
                <label htmlFor="quantity-select" className="font-medium text-zinc-700">Quantity:</label>
                <select
                  id="quantity-select"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="rounded border border-zinc-300 bg-zinc-50 px-2 py-1 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-wine"
                >
                  {Array.from({ length: Math.min(10, currentStock) }).map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={currentStock <= 0}
                className={`w-full btn text-xs font-bold py-2.5 flex items-center justify-center gap-2 ${
                  added ? 'bg-emerald-700 hover:bg-emerald-800' : ''
                }`}
              >
                {added ? <><Check size={16} /> Added to Cart</> : <><ShoppingBag size={16} /> Add to Cart</>}
              </button>

              <button
                type="button"
                onClick={handleBuyNow}
                disabled={currentStock <= 0}
                className="w-full btn bg-amber-400 hover:bg-amber-500 text-zinc-900 text-xs font-bold py-2.5 rounded shadow-sm"
              >
                Buy Now
              </button>

              <button
                type="button"
                onClick={() => toggleWish(book.id)}
                className="w-full btn-ghost text-xs py-2 flex items-center justify-center gap-1.5"
              >
                <Heart size={15} className={isWished ? 'fill-wine text-wine' : ''} />
                {isWished ? 'Saved in Wishlist' : 'Add to Wishlist'}
              </button>
            </div>

            {/* Trust Badges */}
            <div className="border-t border-zinc-100 pt-3 text-[11px] text-zinc-500 space-y-1.5">
              <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-zinc-400" />
                <span>Secure payment transaction</span>
              </div>
              <div className="flex items-center gap-2">
                <RotateCcw size={14} className="text-zinc-400" />
                <span>7 days Replacement or Refund</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Frequently Bought Together Bundle */}
      {companion1 && companion2 && (
        <section className="rounded-xl border border-wine/10 bg-white p-6 shadow-sm">
          <h2 className="font-serif text-xl font-bold text-zinc-900 mb-4">Frequently Bought Together</h2>
          <div className="flex flex-col lg:flex-row items-center gap-6">
            <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
              <div className="h-24 w-16 sm:h-28 sm:w-20 shrink-0 overflow-hidden rounded border shadow-sm bg-stone-100">
                <BookCover
                  coverUrl={book.cover_url}
                  isbn13={currentIsbn13}
                  title={book.title}
                  author={book.author}
                  genre={book.genre}
                  className="h-full w-full object-cover"
                />
              </div>
              <span className="text-lg sm:text-xl font-bold text-zinc-400">+</span>
              <div className="h-24 w-16 sm:h-28 sm:w-20 shrink-0 overflow-hidden rounded border shadow-sm bg-stone-100">
                <BookCover
                  coverUrl={companion1.cover_url}
                  isbn13={companion1.isbn13}
                  title={companion1.title}
                  author={companion1.author}
                  genre={companion1.genre}
                  className="h-full w-full object-cover"
                />
              </div>
              <span className="text-lg sm:text-xl font-bold text-zinc-400">+</span>
              <div className="h-24 w-16 sm:h-28 sm:w-20 shrink-0 overflow-hidden rounded border shadow-sm bg-stone-100">
                <BookCover
                  coverUrl={companion2.cover_url}
                  isbn13={companion2.isbn13}
                  title={companion2.title}
                  author={companion2.author}
                  genre={companion2.genre}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

            <div className="flex-1 space-y-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-zinc-900">
                <input type="checkbox" checked disabled className="rounded text-wine" />
                <span>This item: {book.title} — ₹{currentPrice.toFixed(2)}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-zinc-700">
                <input
                  type="checkbox"
                  checked={includeBundleItem1}
                  onChange={(e) => setIncludeBundleItem1(e.target.checked)}
                  className="rounded text-wine"
                />
                <span>{companion1.title} by {companion1.author} — ₹{companion1.price.toFixed(2)}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-zinc-700">
                <input
                  type="checkbox"
                  checked={includeBundleItem2}
                  onChange={(e) => setIncludeBundleItem2(e.target.checked)}
                  className="rounded text-wine"
                />
                <span>{companion2.title} by {companion2.author} — ₹{companion2.price.toFixed(2)}</span>
              </label>
            </div>

            <div className="border-t lg:border-t-0 lg:border-l border-zinc-200 lg:pl-6 pt-4 lg:pt-0 w-full lg:w-auto text-center lg:text-left">
              <p className="text-xs text-zinc-500">Total price for selected items:</p>
              <p className="text-2xl font-bold text-wine-dark mt-0.5">₹{bundleTotal.toFixed(2)}</p>
              <button
                type="button"
                onClick={handleAddBundle}
                className="mt-3 btn bg-amber-400 hover:bg-amber-500 text-zinc-900 font-bold text-xs py-2 px-5 rounded"
              >
                {bundleAdded ? 'All 3 Added to Cart!' : 'Add all 3 to Cart'}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Customers Also Viewed Carousel */}
      {book.related_books && book.related_books.length > 0 && (
        <section className="rounded-xl border border-wine/10 bg-white p-6 shadow-sm">
          <h2 className="font-serif text-xl font-bold text-zinc-900 mb-4">Customers Who Viewed This Item Also Viewed</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {book.related_books.slice(0, 6).map((rel) => (
              <BookCard key={rel.id} book={rel} />
            ))}
          </div>
        </section>
      )}

      {/* Customer Reviews and Ratings */}
      <section id="customer-reviews" className="rounded-xl border border-wine/10 bg-white p-6 shadow-sm scroll-mt-24">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Ratings Distribution Breakdown (4 cols) */}
          <div className="md:col-span-4 border-b md:border-b-0 md:border-r border-zinc-200 pb-6 md:pb-0 md:pr-6 space-y-4">
            <h2 className="font-serif text-2xl font-bold text-zinc-900">Customer Reviews</h2>

            <div className="flex items-center gap-3">
              <div className="flex text-amber-500">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={20}
                    className={i < Math.floor(book.rating) ? 'fill-amber-400 text-amber-400' : 'text-zinc-300'}
                  />
                ))}
              </div>
              <span className="text-xl font-bold text-zinc-900">{book.rating.toFixed(1)} out of 5</span>
            </div>
            <p className="text-xs text-zinc-500">{book.review_count || 12} global ratings</p>

            {/* Star Distribution Bars */}
            <div className="space-y-2 pt-2 text-xs">
              {[5, 4, 3, 2, 1].map((s) => {
                const pct = s === 5 ? 75 : s === 4 ? 18 : s === 3 ? 5 : 2
                return (
                  <div key={s} className="flex items-center gap-2.5">
                    <span className="w-10 text-zinc-600 font-medium">{s} star</span>
                    <div className="flex-1 h-3 rounded-full bg-zinc-100 overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-8 text-right text-zinc-500">{pct}%</span>
                  </div>
                )
              })}
            </div>

            <div className="border-t border-zinc-100 pt-4">
              <p className="font-bold text-zinc-800 text-sm mb-1">Review this book</p>
              <p className="text-xs text-zinc-500 mb-3">Share your thoughts with other readers worldwide</p>
              <button
                type="button"
                onClick={() => setReviewModalOpen(true)}
                className="w-full btn-outline text-xs py-2"
              >
                Write a Customer Review
              </button>
            </div>
          </div>

          {/* Reviews List (8 cols) */}
          <div className="md:col-span-8 space-y-6">
            <h3 className="font-serif text-xl font-bold text-zinc-900">Top Reviews from India</h3>

            {book.reviews && book.reviews.length > 0 ? (
              <div className="space-y-6 divide-y divide-zinc-100">
                {book.reviews.map((rev) => (
                  <div key={rev.id} className="pt-4 first:pt-0 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-zinc-200 flex items-center justify-center text-xs font-bold text-zinc-700">
                        {rev.user_name[0] || 'R'}
                      </div>
                      <span className="text-xs font-semibold text-zinc-900">{rev.user_name}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex text-amber-500">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={13}
                            className={i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-300'}
                          />
                        ))}
                      </div>
                      <p className="font-bold text-xs text-zinc-900">{rev.title}</p>
                    </div>

                    <p className="text-[11px] text-zinc-400">
                      Reviewed on {new Date(rev.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {rev.is_verified_purchase && (
                        <span className="ml-2 font-semibold text-amber-700">Verified Purchase</span>
                      )}
                    </p>

                    <p className="text-xs leading-relaxed text-zinc-700">{rev.comment}</p>

                    <div className="flex items-center gap-4 pt-1">
                      <button
                        type="button"
                        onClick={() => handleHelpfulVote(rev.id)}
                        className="btn-outline text-[11px] py-1 px-3 flex items-center gap-1.5"
                      >
                        <ThumbsUp size={12} /> Helpful ({rev.helpful_votes})
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-zinc-50 rounded-lg text-zinc-500 text-xs">
                No customer reviews yet. Be the first to share your thoughts on this book!
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Review Submission Modal */}
      {reviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setReviewModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-700"
            >
              <X size={20} />
            </button>
            <h3 className="font-serif text-2xl font-bold text-zinc-900 mb-1">Create Customer Review</h3>
            <p className="text-xs text-zinc-500 mb-4">{book.title} by {book.author}</p>

            {reviewError && (
              <div className="mb-4 rounded bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-700">
                {reviewError}
              </div>
            )}

            <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-zinc-800 block mb-1.5">Overall rating</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setReviewRating(s)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        size={24}
                        className={s <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-zinc-300'}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-zinc-800 block mb-1">Add a headline</label>
                <input
                  type="text"
                  required
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  placeholder="What's most important to know?"
                  className="input text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-zinc-800 block mb-1">Add a written review</label>
                <textarea
                  required
                  rows={4}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="What did you like or dislike? How was the writing style or print quality?"
                  className="input text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(false)}
                  className="btn-outline text-xs px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className="btn text-xs px-6 py-2"
                >
                  {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Read Sample Excerpt Modal */}
      {sampleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl rounded-xl bg-ivory p-6 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-wine/10 mb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-wine">Authorized Digital Preview</span>
                <h3 className="font-serif text-xl font-bold text-zinc-900">{book.title}</h3>
                <p className="text-xs text-zinc-600">by {book.author}</p>
              </div>
              <button
                type="button"
                onClick={() => setSampleModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 text-sm leading-relaxed text-zinc-800 font-serif space-y-4">
              <p className="first-letter:text-4xl first-letter:font-bold first-letter:text-wine first-letter:mr-1">
                {book.sample_text || `Chapter One.\n\nIt was a morning that began like any other, but would alter the course of everything that followed. The quiet hum of the city had not yet broken the dawn stillness...`}
              </p>
              <p>
                {book.blurb}
              </p>
              <div className="my-6 p-4 rounded bg-cream/60 border border-wine/10 text-center text-xs font-sans text-zinc-600">
                End of authorized preview. Add this book to your cart to read the complete edition.
              </div>
            </div>

            <div className="pt-4 border-t border-wine/10 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setSampleModalOpen(false)}
                className="btn-outline text-xs px-4 py-2"
              >
                Close Preview
              </button>
              <button
                type="button"
                onClick={() => {
                  setSampleModalOpen(false)
                  handleAddToCart()
                }}
                className="btn text-xs px-5 py-2"
              >
                Add Edition to Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Mobile Buy Box Action Bar (< md) */}
      <div className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-white/95 backdrop-blur-sm border-t border-zinc-200 px-4 py-2.5 flex items-center justify-between gap-3 shadow-2xl">
        <div className="min-w-0">
          <p className="text-base font-bold text-teal-800 leading-tight">₹{currentPrice.toFixed(2)}</p>
          <p className="text-[10px] text-zinc-500 font-medium truncate">{selectedEdition?.format_label || 'Paperback'}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={currentStock <= 0}
            className={`btn !py-2 !px-3 text-xs font-bold flex items-center gap-1.5 ${
              added ? '!bg-emerald-600 text-white' : '!bg-teal-700 hover:!bg-teal-800 text-white'
            }`}
          >
            {added ? <><Check size={14} /> Added</> : <><ShoppingBag size={14} /> Add to Cart</>}
          </button>
          <button
            type="button"
            onClick={handleBuyNow}
            disabled={currentStock <= 0}
            className="btn !bg-teal-600 hover:!bg-teal-700 text-white !py-2 !px-3.5 text-xs font-bold shadow-sm"
          >
            Buy Now
          </button>
        </div>
      </div>
    </div>
  )
}
