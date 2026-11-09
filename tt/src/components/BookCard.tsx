import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, ShoppingBag, Star, Check } from 'lucide-react'
import type { Book } from '../lib/api'
import { useStore } from '../lib/store'
import BookCover from './BookCover'

interface BookCardProps {
  book: Book
  layout?: 'grid' | 'list'
}

export default function BookCard({ book, layout = 'grid' }: BookCardProps) {
  const { add, wish, toggleWish } = useStore()
  const [added, setAdded] = useState(false)
  const isWished = wish.includes(book.id)

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const success = await add(book.id, 1, book.format || 'Paperback')
    if (success) {
      setAdded(true)
      setTimeout(() => setAdded(false), 2000)
    }
  }

  const handleToggleWish = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggleWish(book.id)
  }

  const discountPct = book.deal_discount || (book.mrp > book.price ? Math.round(((book.mrp - book.price) / book.mrp) * 100) : 0)

  if (layout === 'list') {
    return (
      <div className="group relative flex flex-col sm:flex-row gap-5 rounded-lg border border-teal-900/10 bg-white p-4 transition-all hover:shadow-md hover:border-teal-600/30">
        <Link to={`/books/${book.id}`} className="relative h-52 w-36 flex-shrink-0 mx-auto sm:mx-0 overflow-hidden rounded shadow-sm bg-stone-100">
          <BookCover
            coverUrl={book.cover_url}
            isbn13={book.isbn13}
            title={book.title}
            author={book.author}
            genre={book.genre}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {book.is_bestseller && (
            <span className="absolute top-2 left-2 rounded bg-teal-700 px-2 py-0.5 text-[11px] font-bold tracking-wide text-white shadow-sm">
              #1 Bestseller
            </span>
          )}
        </Link>

        <div className="flex flex-1 flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2">
              <Link to={`/books/${book.id}`}>
                <h3 className="font-serif text-lg font-bold text-zinc-900 group-hover:text-teal-700 transition-colors line-clamp-2">
                  {book.title}
                </h3>
              </Link>
              <button
                type="button"
                onClick={handleToggleWish}
                className={`p-1.5 rounded-full transition-colors ${isWished ? 'text-teal-700' : 'text-zinc-400 hover:text-teal-700'}`}
                aria-label="Save to Wishlist"
              >
                <Heart size={18} className={isWished ? 'fill-teal-700 text-teal-700' : ''} />
              </button>
            </div>

            <p className="mt-1 text-xs text-zinc-600">
              by <span className="font-medium text-zinc-800">{book.author}</span>
            </p>

            {/* Ratings */}
            <div className="mt-2 flex items-center gap-1.5 text-xs text-zinc-600">
              <div className="flex items-center text-teal-600">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={13}
                    className={i < Math.floor(book.rating) ? 'fill-teal-500 text-teal-500' : 'text-zinc-300'}
                  />
                ))}
              </div>
              <span className="font-semibold text-zinc-800">{book.rating.toFixed(1)}</span>
              <span className="text-zinc-400">({book.review_count || 120})</span>
            </div>

            {/* Formats snippet */}
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <span className="rounded bg-teal-50 px-2 py-0.5 font-medium text-teal-800 border border-teal-200">
                {book.format || 'Paperback'}
              </span>
              {book.editions && book.editions.length > 1 && (
                <span className="text-zinc-500 self-center">+{book.editions.length - 1} other formats</span>
              )}
            </div>

            <p className="mt-2 text-xs text-zinc-600 line-clamp-2">
              {book.blurb || book.description}
            </p>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-zinc-900">₹{book.price.toFixed(2)}</span>
              {book.mrp > book.price && (
                <>
                  <span className="text-xs text-zinc-400 line-through">₹{book.mrp.toFixed(2)}</span>
                  <span className="text-xs font-bold text-teal-700">({discountPct}% off)</span>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!book.stock}
              className={`btn !py-2 !px-4 text-xs font-semibold ${
                added ? '!bg-emerald-600 text-white' : '!bg-teal-700 hover:!bg-teal-800 text-white'
              }`}
            >
              {added ? <><Check size={14} /> Added to Cart</> : <><ShoppingBag size={14} /> Add to Cart</>}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Grid layout (default)
  return (
    <div className="group relative flex flex-col justify-between rounded-lg border border-teal-900/10 bg-white p-2.5 sm:p-3.5 transition-all hover:shadow-md hover:border-teal-600/30 h-full">
      <div>
        <div className="relative aspect-[2/3] w-full overflow-hidden rounded bg-stone-100 mb-3 shadow-sm">
          <Link to={`/books/${book.id}`} className="block h-full w-full">
            <BookCover
              coverUrl={book.cover_url}
              isbn13={book.isbn13}
              title={book.title}
              author={book.author}
              genre={book.genre}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </Link>

          {book.is_bestseller && (
            <span className="absolute top-2 left-2 rounded bg-teal-700 px-2 py-0.5 text-[10px] font-bold tracking-wide text-white shadow-sm">
              Bestseller
            </span>
          )}
          {discountPct >= 20 && !book.is_bestseller && (
            <span className="absolute top-2 left-2 rounded bg-teal-600 px-2 py-0.5 text-[10px] font-bold tracking-wide text-white shadow-sm">
              {discountPct}% OFF
            </span>
          )}

          <button
            type="button"
            onClick={handleToggleWish}
            className={`absolute top-2 right-2 rounded-full bg-white/95 p-1.5 shadow-sm transition-transform active:scale-90 ${
              isWished ? 'text-teal-700' : 'text-zinc-400 hover:text-teal-700'
            }`}
            aria-label="Wishlist"
          >
            <Heart size={15} className={isWished ? 'fill-teal-700 text-teal-700' : ''} />
          </button>
        </div>

        <Link to={`/books/${book.id}`} className="block">
          <h3 className="font-serif text-sm font-bold text-zinc-900 group-hover:text-teal-700 transition-colors line-clamp-2 leading-tight">
            {book.title}
          </h3>
        </Link>
        <p className="mt-1 text-xs text-zinc-600 truncate">
          by <span className="font-medium text-zinc-800">{book.author}</span>
        </p>

        {/* Rating */}
        <div className="mt-1.5 flex items-center gap-1 text-[11px] text-zinc-600">
          <div className="flex items-center text-teal-600">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={11}
                className={i < Math.floor(book.rating) ? 'fill-teal-500 text-teal-500' : 'text-zinc-300'}
              />
            ))}
          </div>
          <span className="font-semibold text-zinc-800">{book.rating.toFixed(1)}</span>
          <span className="text-zinc-400">({book.review_count || 48})</span>
        </div>

        <div className="mt-1 text-[11px] text-zinc-500">
          {book.format || 'Paperback'}
        </div>
      </div>

      <div className="mt-3 pt-2.5 border-t border-zinc-100">
        <div className="flex items-baseline gap-1.5">
          <span className="text-base font-bold text-zinc-900">₹{book.price.toFixed(2)}</span>
          {book.mrp > book.price && (
            <span className="text-[11px] text-zinc-400 line-through">₹{book.mrp.toFixed(2)}</span>
          )}
        </div>

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!book.stock}
          className={`mt-2.5 w-full btn !py-1.5 !px-2 text-xs font-semibold ${
            added ? '!bg-emerald-600 text-white' : '!bg-teal-700 hover:!bg-teal-800 text-white'
          }`}
        >
          {added ? <><Check size={13} /> Added</> : <><ShoppingBag size={13} /> Add to Cart</>}
        </button>
      </div>
    </div>
  )
}
