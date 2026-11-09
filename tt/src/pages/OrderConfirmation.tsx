import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  CheckCircle, Package, Truck, Printer, ArrowRight,
  ShieldCheck, MapPin, Clock
} from 'lucide-react'
import { orderApi, type Order } from '../lib/api'
import BookCover from '../components/BookCover'

export default function OrderConfirmation() {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    orderApi.get(id).then((ord) => {
      setOrder(ord)
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })
  }, [id])

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-wine border-r-transparent" />
        <p className="mt-3 text-xs text-zinc-500">Retrieving order confirmation...</p>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center space-y-4">
        <h1 className="font-serif text-2xl font-bold">Order Not Found</h1>
        <p className="text-xs text-zinc-500">We could not locate this order record.</p>
        <Link to="/orders" className="btn text-xs px-6 py-2 inline-block">
          View Your Orders
        </Link>
      </div>
    )
  }

  const shippingAddr: any = order.shippingAddress || {}

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-8">
      {/* Success Banner */}
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-6 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left shadow-sm">
        <div className="rounded-full bg-emerald-100 p-3 text-emerald-600 flex-shrink-0">
          <CheckCircle size={32} />
        </div>
        <div className="flex-1">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Order Placed Successfully</span>
          <h1 className="font-serif text-2xl font-bold text-zinc-900 mt-0.5">Thank you, your order is confirmed!</h1>
          <p className="text-xs text-zinc-600 mt-1">
            An order confirmation and delivery update has been sent to your registered email.
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="btn-outline text-xs px-4 py-2 flex items-center gap-1.5 flex-shrink-0 bg-white"
        >
          <Printer size={14} /> Print Invoice
        </button>
      </div>

      {/* Order Status & Progress Timeline */}
      <div className="rounded-xl border border-wine/10 bg-white p-6 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-100 pb-4 text-xs">
          <div>
            <p className="text-zinc-500">Order Number</p>
            <p className="font-mono font-bold text-sm text-zinc-900">{order.orderNumber}</p>
          </div>
          <div>
            <p className="text-zinc-500">Order Date</p>
            <p className="font-semibold text-zinc-800">
              {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
          <div>
            <p className="text-zinc-500">Estimated Delivery</p>
            <p className="font-bold text-emerald-700">{order.estimatedDelivery || 'Wednesday, Nov 12'}</p>
          </div>
          <div>
            <p className="text-zinc-500">Total Paid</p>
            <p className="font-bold text-base text-wine-dark">₹{order.total.toFixed(2)}</p>
          </div>
        </div>

        {/* Visual Tracking Timeline */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-zinc-800 uppercase tracking-wider">Order Status Timeline</p>
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            {[
              { label: 'Confirmed', done: true },
              { label: 'Processing', done: true },
              { label: 'Shipped', done: order.status === 'SHIPPED' || order.status === 'OUT_FOR_DELIVERY' || order.status === 'DELIVERED' },
              { label: 'Delivered', done: order.status === 'DELIVERED' },
            ].map((step, idx) => (
              <div key={step.label} className="flex flex-col items-center">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs mb-1.5 ${
                  step.done ? 'bg-emerald-600 text-white' : 'bg-zinc-200 text-zinc-500'
                }`}>
                  {idx + 1}
                </div>
                <span className={`font-medium ${step.done ? 'text-zinc-900 font-bold' : 'text-zinc-400'}`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
          <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
            <div className={`h-full bg-emerald-600 transition-all ${
              order.status === 'DELIVERED' ? 'w-full' : order.status === 'SHIPPED' ? 'w-3/4' : 'w-1/2'
            }`} />
          </div>
        </div>

        {/* Address and Payment Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 border-t border-zinc-100 text-xs">
          <div>
            <p className="font-bold text-zinc-900 mb-1 flex items-center gap-1.5">
              <MapPin size={14} className="text-zinc-500" /> Shipping Address
            </p>
            <p className="text-zinc-700 font-medium">{shippingAddr.full_name || 'Aarav Sharma'}</p>
            <p className="text-zinc-500">{shippingAddr.street_address}, {shippingAddr.city} - {shippingAddr.postal_code}</p>
            <p className="text-zinc-500 font-mono mt-0.5">Phone: {shippingAddr.phone || '+91 98765 43210'}</p>
          </div>
          <div>
            <p className="font-bold text-zinc-900 mb-1 flex items-center gap-1.5">
              <Truck size={14} className="text-zinc-500" /> Payment & Delivery Speed
            </p>
            <p className="text-zinc-700">Method: <strong>{order.paymentMethod}</strong> ({order.paymentStatus})</p>
            <p className="text-zinc-500">Speed: {order.deliverySpeed}</p>
            {order.trackingNumber && (
              <p className="text-zinc-500 font-mono mt-0.5">Tracking ID: {order.trackingNumber}</p>
            )}
          </div>
        </div>

        {/* Order Items Table */}
        <div className="border-t border-zinc-100 pt-4 space-y-3">
          <p className="text-xs font-bold text-zinc-900 uppercase tracking-wider">Ordered Books ({order.items.length})</p>
          <div className="divide-y divide-zinc-100">
            {order.items.map((it) => (
              <div key={it.id} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="h-16 w-11 shrink-0 overflow-hidden rounded border shadow-sm">
                    <BookCover
                      coverUrl={it.cover_url}
                      title={it.title}
                      author={it.author}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-bold text-zinc-900">{it.title}</p>
                    <p className="text-zinc-500">by {it.author}</p>
                    <p className="text-[11px] text-zinc-400">Qty: {it.quantity} • {it.format}</p>
                  </div>
                </div>
                <span className="font-bold text-zinc-900 text-sm">₹{it.lineTotal.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
        <Link to="/orders" className="btn-outline text-xs px-5 py-2.5">
          View All Your Orders
        </Link>
        <Link to="/books" className="btn text-xs px-6 py-2.5 flex items-center gap-2">
          Continue Shopping <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  )
}
