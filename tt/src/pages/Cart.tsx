import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ShoppingBag, Trash2, Bookmark, Heart, ArrowRight,
  ShieldCheck, Check, Sparkles, AlertCircle
} from 'lucide-react'
import { useStore } from '../lib/store'
import { orderApi, bookApi, type Book, type CouponResult } from '../lib/api'
import BookCard from '../components/BookCard'
import BookCover from '../components/BookCover'

export default function Cart() {
  const nav = useNavigate()
  const {
    cartItems,
    savedForLaterItems,
    cartSubtotal,
    cartShippingFee,
    cartTotal,
    freeShippingThreshold,
    amountNeededForFreeShipping,
    setQty,
    saveForLater,
    moveToCartFromSaved,
    moveToWishlist,
    clearCart,
    user,
  } = useStore()

  const [couponCode, setCouponCode] = useState('')
  const [couponResult, setCouponResult] = useState<CouponResult | null>(null)
  const [couponLoading, setCouponLoading] = useState(false)
  const [recommended, setRecommended] = useState<Book[]>([])

  useEffect(() => {
    bookApi.recommendations().then((res) => {
      setRecommended(res.bestsellers?.slice(0, 4) || [])
    }).catch(() => {})
  }, [])

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!couponCode.trim()) return
    setCouponLoading(true)
    try {
      const res = await orderApi.applyCoupon(couponCode.trim())
      setCouponResult(res)
    } catch (err: any) {
      setCouponResult({
        valid: false,
        message: err?.message || 'Invalid or expired coupon code.',
      })
    } finally {
      setCouponLoading(false)
    }
  }

  const discount = couponResult?.valid ? (couponResult.discountAmount || 0) : 0
  const finalTotal = Math.max(0, cartTotal - discount)

  const handleProceedToCheckout = () => {
    if (!user) {
      nav('/login?redirect=/checkout')
    } else {
      nav('/checkout')
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-10">
      {/* Breadcrumb */}
      <nav className="text-xs text-zinc-500">
        <Link to="/" className="hover:text-wine">Home</Link>
        <span> / </span>
        <span className="text-zinc-800 font-medium">Shopping Cart</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 8 Cols: Shopping Cart Items List + Saved For Later */}
        <div className="lg:col-span-8 space-y-8">
          {/* Main Cart Card */}
          <div className="rounded-xl border border-wine/10 bg-white p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
              <div>
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-zinc-900">Shopping Cart</h1>
                <p className="text-xs text-zinc-500">
                  {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your cart
                </p>
              </div>
              {cartItems.length > 0 && (
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-xs text-zinc-500 hover:text-wine hover:underline"
                >
                  Deselect all items
                </button>
              )}
            </div>

            {/* Free Shipping Progress Indicator */}
            {cartItems.length > 0 && (
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-900 flex items-center justify-between">
                <div>
                  {amountNeededForFreeShipping === 0 ? (
                    <p className="font-semibold flex items-center gap-1.5">
                      <Check size={16} className="text-emerald-600" />
                      Your order qualifies for <strong>FREE Standard Delivery</strong>!
                    </p>
                  ) : (
                    <p>
                      Add <strong>₹{amountNeededForFreeShipping.toFixed(2)}</strong> of eligible items to get <strong>FREE Delivery</strong>.
                    </p>
                  )}
                </div>
                <Link to="/books" className="text-emerald-800 font-bold hover:underline flex-shrink-0 ml-3">
                  Shop more
                </Link>
              </div>
            )}

            {/* Cart Items List */}
            {cartItems.length > 0 ? (
              <div className="divide-y divide-zinc-100">
                {cartItems.map((item) => (
                  <div key={item.id} className="py-4 first:pt-0 flex gap-3 sm:gap-4 items-start">
                    <Link to={`/books/${item.book.id}`} className="h-28 w-20 sm:h-32 sm:w-24 shrink-0 overflow-hidden rounded bg-stone-100 border shadow-sm">
                      <BookCover
                        coverUrl={item.book.cover_url}
                        isbn13={item.book.isbn13}
                        title={item.book.title}
                        author={item.book.author}
                        genre={item.book.genre}
                        className="h-full w-full object-cover"
                      />
                    </Link>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <Link to={`/books/${item.book.id}`} className="font-serif text-sm sm:text-base font-bold text-zinc-900 hover:text-teal-700 transition-colors line-clamp-2">
                          {item.book.title}
                        </Link>
                        <span className="font-bold text-sm sm:text-base text-zinc-900 shrink-0">
                          ₹{item.lineTotal.toFixed(2)}
                        </span>
                      </div>

                      <p className="text-xs text-zinc-600 truncate">by {item.book.author}</p>
                      <p className="text-[11px] text-zinc-500">Edition: <span className="font-medium text-zinc-700">{item.selected_format || 'Paperback'}</span></p>
                      <p className="text-xs font-semibold text-emerald-700">In Stock</p>

                      {/* Item Actions */}
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 pt-2 text-xs text-zinc-600">
                        {/* Quantity Selector */}
                        <div className="flex items-center gap-1.5">
                          <label htmlFor={`qty-${item.id}`} className="text-zinc-500 text-[11px]">Qty:</label>
                          <select
                            id={`qty-${item.id}`}
                            value={item.quantity}
                            onChange={(e) => setQty(item.id, Number(e.target.value))}
                            className="rounded border border-zinc-300 bg-zinc-50 px-1.5 py-0.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-teal-600"
                          >
                            {Array.from({ length: 10 }).map((_, i) => (
                              <option key={i + 1} value={i + 1}>
                                {i + 1}
                              </option>
                            ))}
                          </select>
                        </div>

                        <span className="text-zinc-300">|</span>

                        <button
                          type="button"
                          onClick={() => setQty(item.id, 0)}
                          className="hover:text-teal-700 hover:underline text-zinc-500 text-xs"
                        >
                          Delete
                        </button>

                        <span className="text-zinc-300">|</span>

                        <button
                          type="button"
                          onClick={() => saveForLater(item.id)}
                          className="hover:text-teal-700 hover:underline text-zinc-500 text-xs"
                        >
                          Save for later
                        </button>

                        <span className="text-zinc-300">|</span>

                        <button
                          type="button"
                          onClick={() => moveToWishlist(item.id)}
                          className="hover:text-teal-700 hover:underline text-zinc-500 text-xs"
                        >
                          Wishlist
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center space-y-4">
                <ShoppingBag className="mx-auto h-12 w-12 text-zinc-300" />
                <h2 className="font-serif text-2xl font-bold text-zinc-900">Your Timeless Tales Cart is empty</h2>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                  Your shopping cart is currently waiting for your next great read. Explore today's deals or top rated titles.
                </p>
                <Link to="/books" className="btn text-xs px-6 py-2.5 inline-block">
                  Explore Books
                </Link>
              </div>
            )}
          </div>

          {/* Saved For Later Section */}
          {savedForLaterItems.length > 0 && (
            <div className="rounded-xl border border-wine/10 bg-white p-6 shadow-sm space-y-4">
              <h2 className="font-serif text-xl font-bold text-zinc-900 border-b pb-3">
                Saved for Later ({savedForLaterItems.length} {savedForLaterItems.length === 1 ? 'item' : 'items'})
              </h2>
              <div className="divide-y divide-zinc-100">
                {savedForLaterItems.map((item) => (
                  <div key={item.id} className="py-4 flex gap-4 items-center justify-between">
                    <div className="flex gap-3 items-center">
                      <div className="h-20 w-14 shrink-0 overflow-hidden rounded border shadow-sm">
                        <BookCover
                          coverUrl={item.book.cover_url}
                          isbn13={item.book.isbn13}
                          title={item.book.title}
                          author={item.book.author}
                          genre={item.book.genre}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div>
                        <Link to={`/books/${item.book.id}`} className="font-serif font-bold text-sm text-zinc-900 hover:text-wine">
                          {item.book.title}
                        </Link>
                        <p className="text-xs text-zinc-500">by {item.book.author}</p>
                        <p className="text-xs font-bold text-wine-dark mt-1">₹{item.unitPrice.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <button
                        type="button"
                        onClick={() => moveToCartFromSaved(item.id)}
                        className="btn-outline text-xs py-1.5 px-3"
                      >
                        Move to Cart
                      </button>
                      <button
                        type="button"
                        onClick={() => setQty(item.id, 0)}
                        className="text-zinc-400 hover:text-wine"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right 4 Cols: Order Summary & Coupon */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4 sticky top-28">
            <h2 className="font-serif text-xl font-bold text-zinc-900 border-b pb-3">Order Summary</h2>

            <div className="space-y-2.5 text-xs text-zinc-700">
              <div className="flex justify-between">
                <span>Subtotal ({cartItems.reduce((acc, it) => acc + it.quantity, 0)} items):</span>
                <span className="font-semibold text-zinc-900">₹{cartSubtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Delivery:</span>
                <span className="font-semibold text-emerald-700">
                  {cartShippingFee === 0 ? 'FREE' : `₹${cartShippingFee.toFixed(2)}`}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Coupon Discount:</span>
                  <span>-₹{discount.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t pt-3 flex justify-between text-base font-bold text-zinc-900">
                <span>Total Amount:</span>
                <span className="text-wine-dark">₹{finalTotal.toFixed(2)}</span>
              </div>
            </div>

            <button
              type="button"
              disabled={cartItems.length === 0}
              onClick={handleProceedToCheckout}
              className="w-full btn bg-amber-400 hover:bg-amber-500 text-zinc-900 font-bold text-xs py-3 rounded shadow-sm disabled:opacity-50"
            >
              Proceed to Buy
            </button>

            {/* Coupon Code Input */}
            <div className="border-t pt-4">
              <p className="text-xs font-bold text-zinc-800 mb-2 flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-500" /> Apply Promotional Coupon
              </p>
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="e.g. WELCOME10, FESTIVE100"
                  className="flex-1 input text-xs uppercase"
                />
                <button
                  type="submit"
                  disabled={couponLoading || !couponCode.trim()}
                  className="btn-outline text-xs px-3 py-1.5 disabled:opacity-40"
                >
                  {couponLoading ? '...' : 'Apply'}
                </button>
              </form>
              {couponResult && (
                <p className={`text-[11px] mt-1.5 font-medium ${couponResult.valid ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {couponResult.message}
                </p>
              )}
            </div>

            <div className="border-t pt-3 text-[11px] text-zinc-500 space-y-1">
              <p className="flex items-center gap-1">
                <ShieldCheck size={14} className="text-zinc-400" />
                100% Purchase Protection guaranteed
              </p>
              <p>UPI, Cards, Netbanking & Cash on Delivery supported.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recommended Additions Shelf */}
      {recommended.length > 0 && (
        <section className="rounded-xl border border-wine/10 bg-white p-6 shadow-sm">
          <h2 className="font-serif text-xl font-bold text-zinc-900 mb-4">Recommended Additions for Your Shelf</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {recommended.map((b) => (
              <BookCard key={b.id} book={b} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
