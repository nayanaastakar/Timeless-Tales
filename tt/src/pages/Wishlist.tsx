import { Link } from 'react-router-dom'
import { ShoppingBag, Trash2, Heart, ArrowRight } from 'lucide-react'
import BookCard from '../components/BookCard'
import { useStore } from '../lib/store'

export default function Wishlist() {
  const { wishBooks, ready, moveToCart, toggleWish } = useStore()

  if (!ready) {
    return (
      <div className="py-20 text-center text-ink/70">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-wine border-t-transparent" />
        <p className="mt-4 text-sm font-medium">Loading your wishlist…</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-stone-200 pb-4 gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-ink">Your Wishlist</h1>
          <p className="text-sm text-ink/70 mt-1">
            {wishBooks.length} {wishBooks.length === 1 ? 'item' : 'items'} saved for later
          </p>
        </div>
        {wishBooks.length > 0 && (
          <Link
            to="/books"
            className="text-sm font-medium text-wine hover:underline inline-flex items-center gap-1"
          >
            Explore more books <ArrowRight size={14} />
          </Link>
        )}
      </div>

      {/* Items Grid */}
      {wishBooks.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {wishBooks.map((book) => (
            <div
              key={book.id}
              className="group flex flex-col rounded-xl border border-stone-200 bg-white p-3 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex-1">
                <BookCard book={book} />
              </div>
              <div className="mt-3 pt-3 border-t border-stone-100 flex gap-2">
                <button
                  type="button"
                  className="btn flex-1 !py-1.5 !px-2 text-xs font-semibold inline-flex items-center justify-center gap-1.5"
                  disabled={!book.stock}
                  onClick={() => void moveToCart(book.id)}
                >
                  <ShoppingBag size={14} />
                  {book.stock ? 'Move to Cart' : 'Out of Stock'}
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-stone-200 p-1.5 text-stone-500 hover:text-wine hover:border-wine/30 transition-colors"
                  aria-label={`Remove ${book.title} from wishlist`}
                  title="Remove from wishlist"
                  onClick={() => void toggleWish(book.id)}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-cream/50 px-6 py-16 text-center max-w-xl mx-auto my-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-wine/10 text-wine mb-4">
            <Heart size={28} />
          </div>
          <h2 className="text-2xl font-bold font-serif text-ink">Your wishlist is empty</h2>
          <p className="mt-2 text-sm text-ink/70 leading-relaxed">
            Explore our vast catalogue of Indian and world literature, bestseller fiction, non-fiction, engineering textbooks, and regional classics. Tap the heart on any book to save it here for later.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/books" className="btn !py-2.5 !px-6">
              Browse All Books
            </Link>
            <Link to="/deals" className="btn-ghost !py-2.5 !px-6">
              View Today's Deals
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
