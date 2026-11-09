import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  TrendingUp, Package, Users, BookOpen, AlertTriangle,
  RotateCcw, Search, Plus, Check, Edit, Trash2, ArrowRight,
  ShieldCheck, Sparkles, Filter, Download, UploadCloud
} from 'lucide-react'
import { adminApi, bookApi, orderApi, type AdminAnalytics, type Book, type Order } from '../lib/api'

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'inventory' | 'importer'>('overview')
  const [loading, setLoading] = useState(true)

  // Live Importer state
  const [importQuery, setImportQuery] = useState('')
  const [importResults, setImportResults] = useState<any[]>([])
  const [importSearching, setImportSearching] = useState(false)
  const [importFeedback, setImportFeedback] = useState('')
  const [importingIndex, setImportingIndex] = useState<number | null>(null)

  // Order status update state
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)
  const [statusFeedback, setStatusFeedback] = useState('')

  const loadData = async () => {
    setLoading(true)
    try {
      const [an, ords] = await Promise.all([
        adminApi.analytics(),
        adminApi.orders().catch(() => []),
      ])
      setAnalytics(an)
      setOrders(ords)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSearchImport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!importQuery.trim()) return
    setImportSearching(true)
    setImportFeedback('')
    try {
      const res = await adminApi.searchImport(importQuery.trim())
      setImportResults(res.results || [])
    } catch {
      setImportFeedback('Search failed. Please try another keyword.')
    } finally {
      setImportSearching(false)
    }
  }

  const handleImportBook = async (metadata: any, index: number) => {
    setImportingIndex(index)
    setImportFeedback('')
    try {
      await adminApi.importBook(metadata, {
        genre: metadata.genre || 'Literature & Fiction',
        is_bestseller: false,
        is_featured: false,
        deal_discount: 10,
      })
      setImportFeedback(`Successfully imported "${metadata.title}" into Timeless Tales!`)
      await loadData()
    } catch (err: any) {
      setImportFeedback(err?.message || 'Could not import book.')
    } finally {
      setImportingIndex(null)
    }
  }

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingOrderId(orderId)
    setStatusFeedback('')
    try {
      await adminApi.updateOrderStatus(orderId, newStatus)
      setStatusFeedback('Order status updated successfully.')
      await loadData()
    } catch (err: any) {
      alert(err?.message || 'Failed to update order status.')
    } finally {
      setUpdatingOrderId(null)
    }
  }

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-wine border-r-transparent" />
        <p className="mt-3 text-xs text-zinc-500">Loading store administration data...</p>
      </div>
    )
  }

  const metrics = analytics?.metrics || {
    totalRevenue: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalCustomers: 0,
    totalBooks: 0,
    returnRequests: 0,
    lowStockCount: 0,
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-8">
      {/* Admin Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-wine">Store Administration</span>
          <h1 className="font-serif text-3xl font-bold text-zinc-900">Operations & Catalogue Control</h1>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="http://localhost:8080/admin/"
            target="_blank"
            rel="noreferrer"
            className="btn-outline text-xs px-4 py-2"
          >
            Open Django Admin
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-zinc-200 pb-3 text-xs overflow-x-auto">
        {[
          { label: 'Overview Metrics', val: 'overview' },
          { label: `Orders (${orders.length})`, val: 'orders' },
          { label: `Low Stock Alerts (${metrics.lowStockCount})`, val: 'inventory' },
          { label: 'Live Book Importer', val: 'importer' },
        ].map((tab) => (
          <button
            key={tab.val}
            type="button"
            onClick={() => setActiveTab(tab.val as any)}
            className={`px-4 py-1.5 rounded-full font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.val ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: Overview Metrics */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Top Key Metric Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
              <span className="text-[11px] font-bold text-zinc-500 uppercase">Total Revenue</span>
              <p className="font-bold text-2xl text-wine-dark mt-1">₹{metrics.totalRevenue.toFixed(2)}</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
              <span className="text-[11px] font-bold text-zinc-500 uppercase">Total Orders</span>
              <p className="font-bold text-2xl text-zinc-900 mt-1">{metrics.totalOrders}</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
              <span className="text-[11px] font-bold text-zinc-500 uppercase">Pending Orders</span>
              <p className="font-bold text-2xl text-amber-600 mt-1">{metrics.pendingOrders}</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
              <span className="text-[11px] font-bold text-zinc-500 uppercase">Active Books</span>
              <p className="font-bold text-2xl text-zinc-900 mt-1">{metrics.totalBooks}</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
              <span className="text-[11px] font-bold text-zinc-500 uppercase">Registered Readers</span>
              <p className="font-bold text-2xl text-zinc-900 mt-1">{metrics.totalCustomers}</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
              <span className="text-[11px] font-bold text-zinc-500 uppercase">Return Requests</span>
              <p className="font-bold text-2xl text-rose-600 mt-1">{metrics.returnRequests}</p>
            </div>
          </div>

          {/* Breakdown: Category Distribution & Top Selling Books */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
              <h2 className="font-serif text-lg font-bold text-zinc-900 border-b pb-2">Top Selling Titles</h2>
              {analytics?.topSellers && analytics.topSellers.length > 0 ? (
                <div className="divide-y divide-zinc-100 text-xs">
                  {analytics.topSellers.map((ts, i) => (
                    <div key={i} className="py-2.5 flex items-center justify-between">
                      <div className="truncate max-w-xs">
                        <p className="font-bold text-zinc-900 truncate">{ts.title}</p>
                        <p className="text-[11px] text-zinc-500">{ts.units_sold} units sold</p>
                      </div>
                      <span className="font-bold text-wine-dark">₹{(ts.revenue || 0).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-500">No sales recorded yet.</p>
              )}
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
              <h2 className="font-serif text-lg font-bold text-zinc-900 border-b pb-2">Catalogue Category Breakdown</h2>
              {analytics?.categoryBreakdown && analytics.categoryBreakdown.length > 0 ? (
                <div className="space-y-2.5 text-xs">
                  {analytics.categoryBreakdown.map((cat, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-zinc-700 font-medium">{cat.genre}</span>
                      <span className="font-bold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded text-[11px]">
                        {cat.count} books
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-500">Categories being synced.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Order Management & Status Updates */}
      {activeTab === 'orders' && (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h2 className="font-serif text-xl font-bold text-zinc-900">Manage Store Orders</h2>
            {statusFeedback && <span className="text-xs font-semibold text-emerald-700">{statusFeedback}</span>}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-700">
              <thead className="bg-zinc-50 text-zinc-500 uppercase text-[10px] font-bold border-b">
                <tr>
                  <th className="py-2.5 px-3">Order Number</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Items</th>
                  <th className="py-2.5 px-3">Total Amount</th>
                  <th className="py-2.5 px-3">Payment</th>
                  <th className="py-2.5 px-3">Current Status</th>
                  <th className="py-2.5 px-3">Update Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-zinc-50/50">
                    <td className="py-3 px-3 font-mono font-bold text-zinc-900">{ord.orderNumber}</td>
                    <td className="py-3 px-3 text-zinc-500">
                      {new Date(ord.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </td>
                    <td className="py-3 px-3">{ord.items.length} titles</td>
                    <td className="py-3 px-3 font-bold text-zinc-900">₹{ord.total.toFixed(2)}</td>
                    <td className="py-3 px-3">{ord.paymentMethod}</td>
                    <td className="py-3 px-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        ord.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-800' :
                        ord.status === 'CANCELLED' ? 'bg-rose-100 text-rose-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {ord.status}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <select
                        value={ord.status}
                        onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value)}
                        disabled={updatingOrderId === ord.id}
                        className="rounded border border-zinc-200 bg-white p-1 text-xs text-zinc-800"
                      >
                        <option value="CONFIRMED">CONFIRMED</option>
                        <option value="PROCESSING">PROCESSING</option>
                        <option value="PACKED">PACKED</option>
                        <option value="SHIPPED">SHIPPED</option>
                        <option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY</option>
                        <option value="DELIVERED">DELIVERED</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Low Stock Alerts */}
      {activeTab === 'inventory' && (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b pb-3">
            <AlertTriangle className="text-amber-500" size={20} />
            <h2 className="font-serif text-xl font-bold text-zinc-900">Low Stock Product Alerts</h2>
          </div>

          {analytics?.lowStockBooks && analytics.lowStockBooks.length > 0 ? (
            <div className="divide-y divide-zinc-100 text-xs">
              {analytics.lowStockBooks.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between">
                  <div>
                    <Link to={`/books/${item.id}`} className="font-bold text-zinc-900 hover:text-wine">
                      {item.title}
                    </Link>
                    <p className="text-zinc-500">ID: {item.id}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded">
                      Only {item.stock} left in stock
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-zinc-500 py-6 text-center">
              All inventory levels are healthy. No items under 5 units.
            </p>
          )}
        </div>
      )}

      {/* TAB 4: Live Open Library / Google Books Importer */}
      {activeTab === 'importer' && (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm space-y-6">
          <div>
            <h2 className="font-serif text-2xl font-bold text-zinc-900">Live Catalogue Importer</h2>
            <p className="text-xs text-zinc-500 mt-1">
              Search Open Library or Google Books API by title, author, or ISBN to import verified metadata and covers into PostgreSQL / SQLite.
            </p>
          </div>

          <form onSubmit={handleSearchImport} className="flex gap-2 max-w-xl">
            <input
              type="text"
              value={importQuery}
              onChange={(e) => setImportQuery(e.target.value)}
              placeholder="e.g. Sapiens, Yuval Noah Harari, 9780062316097"
              className="input text-xs flex-1"
            />
            <button
              type="submit"
              disabled={importSearching || !importQuery.trim()}
              className="btn text-xs px-5 py-2 flex items-center gap-1.5"
            >
              <Search size={14} /> {importSearching ? 'Searching...' : 'Search API'}
            </button>
          </form>

          {importFeedback && (
            <div className="rounded bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800">
              {importFeedback}
            </div>
          )}

          {importResults.length > 0 && (
            <div className="space-y-4">
              <p className="text-xs font-bold text-zinc-700 uppercase">Found {importResults.length} Verified Records</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {importResults.map((res, idx) => (
                  <div key={idx} className="rounded-lg border border-zinc-200 p-4 flex gap-3 text-xs justify-between items-start">
                    {res.cover_url && (
                      <img src={res.cover_url} alt={res.title} className="h-20 w-14 object-cover rounded border" />
                    )}
                    <div className="flex-1 space-y-1">
                      <p className="font-bold text-zinc-900 line-clamp-1">{res.title}</p>
                      <p className="text-zinc-500">by {res.author}</p>
                      <p className="text-[11px] text-zinc-400">Published: {res.year} • {res.publisher}</p>
                      {res.isbn13 && <p className="font-mono text-[10px] text-zinc-500">ISBN-13: {res.isbn13}</p>}
                    </div>
                    <button
                      type="button"
                      disabled={importingIndex === idx}
                      onClick={() => handleImportBook(res, idx)}
                      className="btn-outline text-[11px] py-1.5 px-3 flex-shrink-0"
                    >
                      {importingIndex === idx ? 'Importing...' : 'Import to Store'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
