import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Package, Truck, RotateCcw, AlertCircle, CheckCircle,
  Clock, XCircle, Printer, X
} from 'lucide-react'
import { orderApi, type Order } from '../lib/api'
import BookCover from '../components/BookCover'

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('ALL')

  // Return request modal
  const [returnModalOrderId, setReturnModalOrderId] = useState<string | null>(null)
  const [returnReason, setReturnReason] = useState('')
  const [returnSubmitting, setReturnSubmitting] = useState(false)
  const [feedbackMsg, setFeedbackMsg] = useState('')

  const loadOrders = async () => {
    setLoading(true)
    try {
      const data = await orderApi.list()
      setOrders(data)
    } catch {}
    setLoading(false)
  }

  useEffect(() => {
    loadOrders()
  }, [])

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm('Are you sure you want to cancel this order? Stock will be restored and any payment refunded.')) {
      return
    }
    try {
      await orderApi.cancel(orderId)
      setFeedbackMsg('Order cancelled successfully.')
      await loadOrders()
    } catch (err: any) {
      alert(err?.message || 'Could not cancel order.')
    }
  }

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!returnModalOrderId || !returnReason.trim()) return
    setReturnSubmitting(true)
    try {
      await orderApi.returnItem(returnModalOrderId, returnReason.trim())
      setFeedbackMsg('Return request submitted. Our team will review and approve pickup within 24 hours.')
      setReturnModalOrderId(null)
      setReturnReason('')
      await loadOrders()
    } catch (err: any) {
      alert(err?.message || 'Could not submit return.')
    } finally {
      setReturnSubmitting(false)
    }
  }

  const filteredOrders = orders.filter((ord) => {
    if (statusFilter === 'ALL') return true
    if (statusFilter === 'ACTIVE') return ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY'].includes(ord.status)
    if (statusFilter === 'DELIVERED') return ord.status === 'DELIVERED'
    if (statusFilter === 'CANCELLED') return ['CANCELLED', 'RETURNED', 'REFUNDED', 'RETURN_REQUESTED'].includes(ord.status)
    return true
  })

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-8">
      {/* Page Title & Breadcrumb */}
      <div>
        <nav className="text-xs text-zinc-500 mb-2">
          <Link to="/" className="hover:text-wine">Home</Link>
          <span> / </span>
          <Link to="/account" className="hover:text-wine">Your Account</Link>
          <span> / </span>
          <span className="text-zinc-800 font-medium">Your Orders</span>
        </nav>
        <h1 className="font-serif text-3xl font-bold text-zinc-900">Your Orders</h1>
      </div>

      {feedbackMsg && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 flex items-center justify-between">
          <p>{feedbackMsg}</p>
          <button type="button" onClick={() => setFeedbackMsg('')} className="font-bold">×</button>
        </div>
      )}

      {/* Status Filter Tabs */}
      <div className="flex gap-2 border-b border-zinc-200 pb-3 text-xs">
        {[
          { label: 'All Orders', val: 'ALL' },
          { label: 'In Progress', val: 'ACTIVE' },
          { label: 'Delivered', val: 'DELIVERED' },
          { label: 'Cancelled & Returned', val: 'CANCELLED' },
        ].map((tab) => (
          <button
            key={tab.val}
            type="button"
            onClick={() => setStatusFilter(tab.val)}
            className={`px-4 py-1.5 rounded-full font-medium transition-colors ${
              statusFilter === tab.val
                ? 'bg-zinc-900 text-white'
                : 'text-zinc-600 hover:bg-zinc-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-wine border-r-transparent" />
          <p className="mt-3 text-xs text-zinc-500">Loading orders...</p>
        </div>
      ) : filteredOrders.length > 0 ? (
        <div className="space-y-6">
          {filteredOrders.map((ord) => {
            const isCancellable = ['CONFIRMED', 'PROCESSING'].includes(ord.status)
            const isReturnable = ord.status === 'DELIVERED' && !ord.returns?.length
            const isReturned = ord.status === 'RETURN_REQUESTED' || ord.status === 'RETURNED' || ord.status === 'REFUNDED'
            const shippingAddr: any = ord.shippingAddress || {}

            return (
              <div key={ord.id} className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
                {/* Order Top Bar */}
                <div className="bg-zinc-50 border-b border-zinc-200 p-4 text-xs text-zinc-600 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-6">
                    <div>
                      <p className="text-zinc-400 uppercase text-[10px] font-bold">Order Placed</p>
                      <p className="font-medium text-zinc-800">
                        {new Date(ord.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div>
                      <p className="text-zinc-400 uppercase text-[10px] font-bold">Total</p>
                      <p className="font-bold text-zinc-900">₹{ord.total.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-zinc-400 uppercase text-[10px] font-bold">Ship To</p>
                      <p className="font-medium text-zinc-800">{shippingAddr.full_name || 'Customer'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-zinc-400 uppercase text-[10px] font-bold text-right">Order ID</p>
                      <p className="font-mono text-zinc-800 font-semibold">{ord.orderNumber}</p>
                    </div>
                    <Link
                      to={`/order-confirmation/${ord.id}`}
                      className="btn-outline text-[11px] py-1 px-2.5 flex items-center gap-1"
                    >
                      <Printer size={12} /> Invoice
                    </Link>
                  </div>
                </div>

                {/* Order Body */}
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${
                        ord.status === 'DELIVERED' ? 'bg-emerald-500' :
                        ord.status === 'CANCELLED' ? 'bg-rose-500' :
                        isReturned ? 'bg-amber-500' : 'bg-blue-500'
                      }`} />
                      <span className="font-bold text-sm text-zinc-900">
                        Status: {ord.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      {isCancellable && (
                        <button
                          type="button"
                          onClick={() => handleCancelOrder(ord.id)}
                          className="text-rose-700 hover:underline font-semibold"
                        >
                          Cancel Order
                        </button>
                      )}
                      {isReturnable && (
                        <button
                          type="button"
                          onClick={() => setReturnModalOrderId(ord.id)}
                          className="btn-outline text-[11px] py-1 px-3"
                        >
                          Return or Replace
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="divide-y divide-zinc-100">
                    {ord.items.map((item) => (
                      <div key={item.id} className="py-3 first:pt-0 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <div className="h-16 w-11 shrink-0 overflow-hidden rounded border shadow-sm">
                            <BookCover
                              coverUrl={item.cover_url}
                              title={item.title}
                              author={item.author}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-bold text-zinc-900">{item.title}</p>
                            <p className="text-zinc-500">by {item.author}</p>
                            <p className="text-[11px] text-zinc-400">Qty: {item.quantity} • {item.format}</p>
                          </div>
                        </div>
                        <span className="font-bold text-zinc-900">₹{item.lineTotal.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Return details if requested */}
                  {ord.returns && ord.returns.length > 0 && (
                    <div className="rounded bg-amber-50/70 border border-amber-200 p-3 text-xs text-amber-900">
                      <p className="font-bold">Return Request: {ord.returns[0].status}</p>
                      <p className="text-amber-800 mt-0.5">Reason: {ord.returns[0].reason}</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center space-y-4">
          <Package className="mx-auto h-12 w-12 text-zinc-300" />
          <h2 className="font-serif text-xl font-bold text-zinc-900">No orders found in this view</h2>
          <p className="text-xs text-zinc-500">Check another status filter or start exploring the catalogue.</p>
          <Link to="/books" className="btn text-xs px-6 py-2.5 inline-block">
            Start Shopping
          </Link>
        </div>
      )}

      {/* Return Request Modal */}
      {returnModalOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setReturnModalOrderId(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-700"
            >
              <X size={20} />
            </button>
            <h3 className="font-serif text-2xl font-bold text-zinc-900 mb-1">Return or Replacement</h3>
            <p className="text-xs text-zinc-500 mb-4">Timeless Tales 7-day easy return policy</p>

            <form onSubmit={handleReturnSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-zinc-800 block mb-1">Why are you returning this item?</label>
                <select
                  required
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="input text-xs"
                >
                  <option value="">Select reason...</option>
                  <option value="Damaged cover or torn binding">Damaged cover or torn binding</option>
                  <option value="Missing pages or misprinted text">Missing pages or misprinted text</option>
                  <option value="Wrong book edition received">Wrong book edition received</option>
                  <option value="Arrived too late">Arrived too late</option>
                  <option value="No longer needed">No longer needed</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReturnModalOrderId(null)}
                  className="btn-outline text-xs px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={returnSubmitting || !returnReason}
                  className="btn text-xs px-5 py-2 disabled:opacity-50"
                >
                  {returnSubmitting ? 'Submitting...' : 'Confirm Return Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
