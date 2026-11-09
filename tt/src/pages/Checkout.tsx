import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  CheckCircle, MapPin, Truck, CreditCard, ShieldCheck,
  Sparkles, AlertCircle, ArrowLeft, Plus, ChevronRight
} from 'lucide-react'
import { useStore } from '../lib/store'
import { addressApi, orderApi, type Address, type CouponResult } from '../lib/api'
import BookCover from '../components/BookCover'

const INDIAN_STATES = [
  'Karnataka', 'Maharashtra', 'Delhi', 'Tamil Nadu', 'Telangana',
  'Kerala', 'Gujarat', 'Uttar Pradesh', 'West Bengal', 'Rajasthan',
  'Andhra Pradesh', 'Madhya Pradesh', 'Punjab', 'Haryana', 'Bihar'
]

export default function Checkout() {
  const nav = useNavigate()
  const {
    cartItems,
    cartSubtotal,
    cartShippingFee,
    cartTotal,
    addresses,
    refreshUserData,
    clearCart,
    user,
  } = useStore()

  // Checkout Step: 1 (Address) -> 2 (Delivery Speed) -> 3 (Payment) -> 4 (Review)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1)

  // Address selection
  const [selectedAddressId, setSelectedAddressId] = useState<string>('')
  const [showNewAddressForm, setShowNewAddressForm] = useState(false)
  const [newAddress, setNewAddress] = useState<Omit<Address, 'id'>>({
    full_name: user?.name || '',
    phone: user?.phone || '',
    street_address: '',
    landmark: '',
    city: 'Bengaluru',
    state: 'Karnataka',
    postal_code: '560025',
    country: 'India',
    is_default: true,
  })

  // Delivery Speed
  const [deliverySpeed, setDeliverySpeed] = useState<'Standard' | 'Express'>('Standard')

  // Payment Method
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'NETBANKING' | 'COD'>('UPI')
  const [upiId, setUpiId] = useState('reader@okaxis')
  const [cardNumber, setCardNumber] = useState('4111 2222 3333 4444')
  const [cardExpiry, setCardExpiry] = useState('12/28')
  const [cardCvv, setCardCvv] = useState('123')

  // Coupon
  const [couponCode, setCouponCode] = useState('')
  const [couponResult, setCouponResult] = useState<CouponResult | null>(null)
  const [placingOrder, setPlacingOrder] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (addresses.length > 0) {
      const def = addresses.find(a => a.is_default) || addresses[0]
      setSelectedAddressId(def.id)
    } else {
      setShowNewAddressForm(true)
    }
  }, [addresses])

  if (cartItems.length === 0 && !placingOrder) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center space-y-4">
        <h1 className="font-serif text-2xl font-bold">Your cart is empty</h1>
        <p className="text-xs text-zinc-500">Add books to your shopping cart to proceed through checkout.</p>
        <Link to="/books" className="btn text-xs px-6 py-2 inline-block">
          Explore Catalogue
        </Link>
      </div>
    )
  }

  const handleCreateNewAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const created = await addressApi.create(newAddress)
      await refreshUserData()
      setSelectedAddressId(created.id)
      setShowNewAddressForm(false)
    } catch (err: any) {
      setError(err?.message || 'Could not save address.')
    }
  }

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!couponCode.trim()) return
    try {
      const res = await orderApi.applyCoupon(couponCode.trim())
      setCouponResult(res)
    } catch (err: any) {
      setCouponResult({ valid: false, message: err?.message || 'Invalid coupon.' })
    }
  }

  const selectedAddrObj = addresses.find(a => a.id === selectedAddressId) || addresses[0] || newAddress
  const shippingFee = deliverySpeed === 'Express' ? 89 : cartShippingFee
  const discountAmount = couponResult?.valid ? (couponResult.discountAmount || 0) : 0
  const orderFinalTotal = Math.max(0, cartSubtotal + shippingFee - discountAmount)

  const handlePlaceOrder = async () => {
    setPlacingOrder(true)
    setError('')
    try {
      const order = await orderApi.checkout({
        address: selectedAddrObj,
        deliverySpeed,
        paymentMethod,
        couponCode: couponResult?.valid ? couponResult.code : undefined,
      })
      await refreshUserData()
      nav(`/order-confirmation/${order.id}`)
    } catch (err: any) {
      setError(err?.message || 'Failed to place order. Please review your details and try again.')
      setPlacingOrder(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">
      {/* Checkout Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
        <div className="flex items-center gap-3">
          <Link to="/cart" className="text-zinc-500 hover:text-zinc-800">
            <ArrowLeft size={18} />
          </Link>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-zinc-900">Checkout</h1>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
          <ShieldCheck size={16} className="text-emerald-600" />
          <span>SSL 256-bit Encrypted Checkout</span>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle size={16} className="flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 8 Cols: 4 Step Accordion */}
        <div className="lg:col-span-8 space-y-6">
          {/* STEP 1: Delivery Address */}
          <div className={`rounded-xl border bg-white p-6 shadow-sm transition-all ${currentStep === 1 ? 'border-wine ring-1 ring-wine' : 'border-zinc-200'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="h-6 w-6 rounded-full bg-zinc-900 text-white text-xs font-bold flex items-center justify-center">1</span>
                <h2 className="font-serif text-lg font-bold text-zinc-900">Select Delivery Address</h2>
              </div>
              {currentStep > 1 && (
                <button type="button" onClick={() => setCurrentStep(1)} className="text-xs font-semibold text-wine hover:underline">
                  Change
                </button>
              )}
            </div>

            {currentStep === 1 ? (
              <div className="space-y-4">
                {addresses.length > 0 && !showNewAddressForm && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {addresses.map((addr) => {
                      const isSel = selectedAddressId === addr.id
                      return (
                        <div
                          key={addr.id}
                          onClick={() => setSelectedAddressId(addr.id)}
                          className={`p-3.5 rounded-lg border cursor-pointer text-xs transition-all ${
                            isSel ? 'border-amber-500 bg-amber-50/40 ring-1 ring-amber-500' : 'border-zinc-200 hover:border-zinc-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-zinc-900">{addr.full_name}</span>
                            {addr.is_default && (
                              <span className="text-[10px] bg-zinc-200 px-1.5 py-0.5 rounded font-medium">Default</span>
                            )}
                          </div>
                          <p className="text-zinc-600 line-clamp-2">{addr.street_address}, {addr.landmark ? `${addr.landmark}, ` : ''}{addr.city}, {addr.state} - {addr.postal_code}</p>
                          <p className="text-zinc-500 mt-2 font-mono">Ph: {addr.phone}</p>
                        </div>
                      )
                    })}
                  </div>
                )}

                {showNewAddressForm ? (
                  <form onSubmit={handleCreateNewAddress} className="space-y-3 border-t pt-4 text-xs">
                    <p className="font-bold text-zinc-800">Add a New Indian Delivery Address</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-zinc-600 mb-1">Full Name</label>
                        <input
                          type="text"
                          required
                          value={newAddress.full_name}
                          onChange={(e) => setNewAddress({ ...newAddress, full_name: e.target.value })}
                          className="input text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-zinc-600 mb-1">Mobile Number (10 digits)</label>
                        <input
                          type="tel"
                          required
                          value={newAddress.phone}
                          onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                          className="input text-xs"
                          placeholder="+91 98765 43210"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-zinc-600 mb-1">Flat, House no., Building, Apartment</label>
                      <input
                        type="text"
                        required
                        value={newAddress.street_address}
                        onChange={(e) => setNewAddress({ ...newAddress, street_address: e.target.value })}
                        className="input text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-zinc-600 mb-1">Town / City</label>
                        <input
                          type="text"
                          required
                          value={newAddress.city}
                          onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                          className="input text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-zinc-600 mb-1">State</label>
                        <select
                          value={newAddress.state}
                          onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                          className="input text-xs"
                        >
                          {INDIAN_STATES.map((st) => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-zinc-600 mb-1">6-digit PIN Code</label>
                        <input
                          type="text"
                          maxLength={6}
                          required
                          value={newAddress.postal_code}
                          onChange={(e) => setNewAddress({ ...newAddress, postal_code: e.target.value })}
                          className="input text-xs"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button type="submit" className="btn text-xs px-5 py-2">
                        Use this address
                      </button>
                      {addresses.length > 0 && (
                        <button type="button" onClick={() => setShowNewAddressForm(false)} className="btn-outline text-xs px-4 py-2">
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowNewAddressForm(true)}
                    className="text-xs text-wine font-semibold hover:underline flex items-center gap-1 mt-2"
                  >
                    <Plus size={14} /> Add a new delivery address
                  </button>
                )}

                {!showNewAddressForm && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="w-full sm:w-auto btn text-xs px-6 py-2.5 font-bold"
                    >
                      Use Selected Address & Continue
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-zinc-600">
                Deliver to: <strong>{selectedAddrObj.full_name}</strong> — {selectedAddrObj.street_address}, {selectedAddrObj.city} ({selectedAddrObj.postal_code})
              </p>
            )}
          </div>

          {/* STEP 2: Delivery Speed */}
          <div className={`rounded-xl border bg-white p-6 shadow-sm transition-all ${currentStep === 2 ? 'border-wine ring-1 ring-wine' : 'border-zinc-200'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="h-6 w-6 rounded-full bg-zinc-900 text-white text-xs font-bold flex items-center justify-center">2</span>
                <h2 className="font-serif text-lg font-bold text-zinc-900">Select Delivery Speed</h2>
              </div>
              {currentStep > 2 && (
                <button type="button" onClick={() => setCurrentStep(2)} className="text-xs font-semibold text-wine hover:underline">
                  Change
                </button>
              )}
            </div>

            {currentStep === 2 ? (
              <div className="space-y-4 text-xs">
                <div className="space-y-2.5">
                  <label className={`flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition-all ${
                    deliverySpeed === 'Standard' ? 'border-amber-500 bg-amber-50/40 ring-1 ring-amber-500' : 'border-zinc-200'
                  }`}>
                    <input
                      type="radio"
                      name="deliverySpeed"
                      checked={deliverySpeed === 'Standard'}
                      onChange={() => setDeliverySpeed('Standard')}
                      className="mt-0.5 text-wine"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-zinc-900">Standard Delivery — FREE</span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 rounded font-medium">Recommended</span>
                      </div>
                      <p className="text-zinc-600 mt-0.5">Estimated delivery in 3 to 4 business days.</p>
                    </div>
                  </label>

                  <label className={`flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition-all ${
                    deliverySpeed === 'Express' ? 'border-amber-500 bg-amber-50/40 ring-1 ring-amber-500' : 'border-zinc-200'
                  }`}>
                    <input
                      type="radio"
                      name="deliverySpeed"
                      checked={deliverySpeed === 'Express'}
                      onChange={() => setDeliverySpeed('Express')}
                      className="mt-0.5 text-wine"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-zinc-900">Express Delivery — ₹89.00</span>
                      </div>
                      <p className="text-zinc-600 mt-0.5">Priority express dispatch with delivery in 1 to 2 business days.</p>
                    </div>
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="w-full sm:w-auto btn text-xs px-6 py-2.5 font-bold"
                >
                  Continue to Payment
                </button>
              </div>
            ) : (
              <p className="text-xs text-zinc-600">
                Selected speed: <strong>{deliverySpeed === 'Standard' ? 'Standard Delivery (FREE)' : 'Express Priority (₹89.00)'}</strong>
              </p>
            )}
          </div>

          {/* STEP 3: Payment Method */}
          <div className={`rounded-xl border bg-white p-6 shadow-sm transition-all ${currentStep === 3 ? 'border-wine ring-1 ring-wine' : 'border-zinc-200'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="h-6 w-6 rounded-full bg-zinc-900 text-white text-xs font-bold flex items-center justify-center">3</span>
                <h2 className="font-serif text-lg font-bold text-zinc-900">Select Payment Method</h2>
              </div>
              {currentStep > 3 && (
                <button type="button" onClick={() => setCurrentStep(3)} className="text-xs font-semibold text-wine hover:underline">
                  Change
                </button>
              )}
            </div>

            {currentStep === 3 ? (
              <div className="space-y-4 text-xs">
                <div className="space-y-3">
                  {/* UPI */}
                  <label className={`block p-3.5 rounded-lg border cursor-pointer ${
                    paymentMethod === 'UPI' ? 'border-amber-500 bg-amber-50/40 ring-1 ring-amber-500' : 'border-zinc-200'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="payMethod"
                        checked={paymentMethod === 'UPI'}
                        onChange={() => setPaymentMethod('UPI')}
                        className="text-wine"
                      />
                      <span className="font-bold text-zinc-900">UPI / QR (Google Pay, PhonePe, Paytm, BHIM)</span>
                    </div>
                    {paymentMethod === 'UPI' && (
                      <div className="mt-3 pl-6">
                        <label className="block text-[11px] text-zinc-600 mb-1">Enter your UPI ID / VPA</label>
                        <input
                          type="text"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          placeholder="username@okhdfcbank"
                          className="input text-xs max-w-xs"
                        />
                      </div>
                    )}
                  </label>

                  {/* Credit / Debit Card */}
                  <label className={`block p-3.5 rounded-lg border cursor-pointer ${
                    paymentMethod === 'CARD' ? 'border-amber-500 bg-amber-50/40 ring-1 ring-amber-500' : 'border-zinc-200'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="payMethod"
                        checked={paymentMethod === 'CARD'}
                        onChange={() => setPaymentMethod('CARD')}
                        className="text-wine"
                      />
                      <span className="font-bold text-zinc-900">Credit or Debit Card (Visa, MasterCard, RuPay)</span>
                    </div>
                    {paymentMethod === 'CARD' && (
                      <div className="mt-3 pl-6 grid grid-cols-1 sm:grid-cols-3 gap-2.5 max-w-md">
                        <div className="sm:col-span-3">
                          <label className="block text-[11px] text-zinc-600 mb-1">Card Number</label>
                          <input
                            type="text"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            className="input text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-zinc-600 mb-1">Expires (MM/YY)</label>
                          <input
                            type="text"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            className="input text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-zinc-600 mb-1">CVV</label>
                          <input
                            type="password"
                            maxLength={4}
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value)}
                            className="input text-xs"
                          />
                        </div>
                      </div>
                    )}
                  </label>

                  {/* Netbanking */}
                  <label className={`block p-3.5 rounded-lg border cursor-pointer ${
                    paymentMethod === 'NETBANKING' ? 'border-amber-500 bg-amber-50/40 ring-1 ring-amber-500' : 'border-zinc-200'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="payMethod"
                        checked={paymentMethod === 'NETBANKING'}
                        onChange={() => setPaymentMethod('NETBANKING')}
                        className="text-wine"
                      />
                      <span className="font-bold text-zinc-900">Net Banking (All Indian Banks Supported)</span>
                    </div>
                  </label>

                  {/* Cash on Delivery */}
                  <label className={`block p-3.5 rounded-lg border cursor-pointer ${
                    paymentMethod === 'COD' ? 'border-amber-500 bg-amber-50/40 ring-1 ring-amber-500' : 'border-zinc-200'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="payMethod"
                        checked={paymentMethod === 'COD'}
                        onChange={() => setPaymentMethod('COD')}
                        className="text-wine"
                      />
                      <div>
                        <span className="font-bold text-zinc-900">Cash on Delivery (COD)</span>
                        <p className="text-[11px] text-zinc-500">Pay cash or scan QR when courier delivers to your door.</p>
                      </div>
                    </div>
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="btn text-xs px-6 py-2.5 font-bold"
                >
                  Review Order Items & Finalize
                </button>
              </div>
            ) : (
              <p className="text-xs text-zinc-600">
                Payment mode: <strong>{paymentMethod}</strong>
              </p>
            )}
          </div>

          {/* STEP 4: Review Items & Delivery */}
          {currentStep === 4 && (
            <div className="rounded-xl border border-wine ring-1 ring-wine bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="h-6 w-6 rounded-full bg-zinc-900 text-white text-xs font-bold flex items-center justify-center">4</span>
                <h2 className="font-serif text-lg font-bold text-zinc-900">Review Items and Delivery Details</h2>
              </div>

              <div className="divide-y divide-zinc-100 max-h-64 overflow-y-auto pr-2">
                {cartItems.map((it) => (
                  <div key={it.id} className="py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="h-14 w-10 shrink-0 overflow-hidden rounded border shadow-sm">
                        <BookCover
                          coverUrl={it.book.cover_url}
                          isbn13={it.book.isbn13}
                          title={it.book.title}
                          author={it.book.author}
                          genre={it.book.genre}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-bold text-zinc-900">{it.book.title}</p>
                        <p className="text-zinc-500">Qty: {it.quantity} • {it.selected_format || 'Paperback'}</p>
                      </div>
                    </div>
                    <span className="font-bold text-zinc-900">₹{it.lineTotal.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right 4 Cols: Order Summary & Place Order Button */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4 sticky top-28">
            <h2 className="font-serif text-xl font-bold text-zinc-900 border-b pb-3">Payment Summary</h2>

            <div className="space-y-2.5 text-xs text-zinc-700">
              <div className="flex justify-between">
                <span>Items Subtotal:</span>
                <span className="font-semibold text-zinc-900">₹{cartSubtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Charges:</span>
                <span className="font-semibold text-emerald-700">
                  {shippingFee === 0 ? 'FREE' : `₹${shippingFee.toFixed(2)}`}
                </span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Coupon ({couponResult?.code}):</span>
                  <span>-₹{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t pt-3 flex justify-between text-lg font-bold text-zinc-900">
                <span>Order Total:</span>
                <span className="text-wine-dark">₹{orderFinalTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Promotional coupon input in checkout */}
            <div className="border-t pt-3">
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Coupon code"
                  className="flex-1 input text-xs uppercase"
                />
                <button type="submit" className="btn-outline text-xs px-3 py-1.5">
                  Apply
                </button>
              </form>
              {couponResult && (
                <p className={`text-[11px] mt-1 font-medium ${couponResult.valid ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {couponResult.message}
                </p>
              )}
            </div>

            <button
              type="button"
              disabled={placingOrder}
              onClick={handlePlaceOrder}
              className="w-full btn bg-amber-400 hover:bg-amber-500 text-zinc-900 font-bold text-sm py-3 rounded shadow-md disabled:opacity-50"
            >
              {placingOrder ? 'Processing Order...' : 'Place Your Order'}
            </button>

            <p className="text-[10px] text-zinc-500 text-center leading-tight">
              By placing your order, you agree to Timeless Tales' Privacy Notice and Conditions of Use.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
