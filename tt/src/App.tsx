import { Navigate, Route, Routes, Link, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import Layout from './components/Layout'
import Home from './pages/Home'
import Catalogue from './pages/Catalogue'
import BookDetail from './pages/BookDetail'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import OrderConfirmation from './pages/OrderConfirmation'
import Wishlist from './pages/Wishlist'
import Orders from './pages/Orders'
import Account from './pages/Account'
import Library from './pages/Library'
import Deals from './pages/Deals'
import Blogs from './pages/Blogs'
import BlogDetail from './pages/BlogDetail'
import Contact from './pages/Contact'
import FAQ from './pages/FAQ'
import About from './pages/About'
import AdminDashboard from './pages/AdminDashboard'
import Auth from './pages/Auth'
import { useStore } from './lib/store'

function Protected({ children }: { children: ReactNode }) {
  const { user, ready } = useStore()
  const location = useLocation()

  if (!ready) {
    return (
      <div className="py-20 text-center text-ink/70">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-wine border-t-transparent" />
        <p className="mt-4 text-sm font-medium">Checking your account…</p>
      </div>
    )
  }

  return user ? (
    <>{children}</>
  ) : (
    <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />
  )
}

function AdminProtected({ children }: { children: ReactNode }) {
  const { user, ready } = useStore()
  const location = useLocation()

  if (!ready) {
    return (
      <div className="py-20 text-center text-ink/70">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-wine border-t-transparent" />
        <p className="mt-4 text-sm font-medium">Checking permissions…</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />
  }

  if (!user.is_staff) {
    return (
      <div className="rounded-2xl bg-cream p-12 text-center max-w-lg mx-auto my-12 border border-stone-200 shadow-sm">
        <h2 className="text-2xl font-bold font-serif text-ink">Administrator Access Required</h2>
        <p className="mt-2 text-sm text-ink/70">
          This portal is restricted to Timeless Tales store administrators and catalog editors.
        </p>
        <Link to="/" className="btn mt-6 inline-block">
          Return to Storefront
        </Link>
      </div>
    )
  }

  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Public Storefront */}
        <Route index element={<Home />} />
        <Route path="books" element={<Catalogue />} />
        <Route path="books/:id" element={<BookDetail />} />
        <Route path="deals" element={<Deals />} />
        <Route path="cart" element={<Cart />} />
        <Route path="wishlist" element={<Wishlist />} />

        {/* Content & Support */}
        <Route path="blogs" element={<Blogs />} />
        <Route path="blogs/:slug" element={<BlogDetail />} />
        <Route path="about" element={<About />} />
        <Route path="faq" element={<FAQ />} />
        <Route path="contact" element={<Contact />} />

        {/* Authentication */}
        <Route path="login" element={<Auth mode="login" />} />
        <Route path="register" element={<Auth mode="register" />} />

        {/* Authenticated Customer Experience */}
        <Route
          path="checkout"
          element={
            <Protected>
              <Checkout />
            </Protected>
          }
        />
        <Route
          path="order-confirmation/:id"
          element={
            <Protected>
              <OrderConfirmation />
            </Protected>
          }
        />
        <Route
          path="orders"
          element={
            <Protected>
              <Orders />
            </Protected>
          }
        />
        <Route
          path="account"
          element={
            <Protected>
              <Account />
            </Protected>
          }
        />
        <Route
          path="library"
          element={
            <Protected>
              <Library />
            </Protected>
          }
        />

        {/* Store Administration */}
        <Route
          path="admin-panel"
          element={
            <AdminProtected>
              <AdminDashboard />
            </AdminProtected>
          }
        />

        {/* 404 Catch-All */}
        <Route
          path="*"
          element={
            <div className="py-24 text-center max-w-md mx-auto">
              <h1 className="text-6xl font-bold font-serif text-wine">404</h1>
              <h2 className="mt-4 text-2xl font-bold font-serif text-ink">Page Not Found</h2>
              <p className="mt-2 text-sm text-ink/70">
                The shelf you're looking for might have been moved or doesn't exist.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <Link to="/" className="btn">
                  Back to Homepage
                </Link>
                <Link to="/books" className="btn-ghost">
                  Browse Books
                </Link>
              </div>
            </div>
          }
        />
      </Route>
    </Routes>
  )
}
