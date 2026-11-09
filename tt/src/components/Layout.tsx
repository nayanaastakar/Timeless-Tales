import { useState, useEffect, useRef, type FormEvent } from 'react'
import { Link, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  BookOpen, ChevronDown, ChevronLeft, ChevronRight, Heart, LogOut,
  MapPin, Menu, Search, ShoppingBag, User, X, Check,
  BookMarked, Tag, HelpCircle, Package, ShieldCheck
} from 'lucide-react'
import { useStore } from '../lib/store'
import { bookApi, type Department, type SearchAutocompleteResult } from '../lib/api'
import BookCover from './BookCover'

const DEPARTMENTS_LIST = [
  'All Departments',
  'Literature & Fiction',
  'Mystery, Thriller & Suspense',
  'Science Fiction & Fantasy',
  'Self-Help & Personal Growth',
  'Business & Economics',
  'Computers & Technology',
  'History & Biographies',
  'Children & Young Adult',
  'Regional Literature & Kannada',
  'Competitive Exam Preparation',
]

export default function Layout() {
  const {
    count,
    wish,
    user,
    cartSubtotal,
    addresses,
    deliveryLocation,
    setDeliveryLocation,
    error,
    logout,
    clearError,
  } = useStore()

  const [megaMenuOpen, setMegaMenuOpen] = useState(false)
  const [locationModalOpen, setLocationModalOpen] = useState(false)
  const [departments, setDepartments] = useState<Department[]>([])
  const [selectedDept, setSelectedDept] = useState('All Departments')
  const [searchQuery, setSearchQuery] = useState('')
  const [autocomplete, setAutocomplete] = useState<SearchAutocompleteResult | null>(null)
  const [showAutocomplete, setShowAutocomplete] = useState(false)
  const [customPincode, setCustomPincode] = useState('')
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false)

  const nav = useNavigate()
  const location = useLocation()
  const searchContainerRef = useRef<HTMLDivElement>(null)
  const accountRef = useRef<HTMLDivElement>(null)
  const subnavRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const checkSubnavScroll = () => {
    if (subnavRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = subnavRef.current
      setCanScrollLeft(scrollLeft > 6)
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 6)
    }
  }

  useEffect(() => {
    checkSubnavScroll()
    const timer = setTimeout(checkSubnavScroll, 200)
    window.addEventListener('resize', checkSubnavScroll)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', checkSubnavScroll)
    }
  }, [location.pathname])

  const scrollSubnav = (direction: 'left' | 'right') => {
    if (subnavRef.current) {
      const offset = direction === 'left' ? -280 : 280
      subnavRef.current.scrollBy({ left: offset, behavior: 'smooth' })
      setTimeout(checkSubnavScroll, 320)
    }
  }

  // Fetch departments for mega menu
  useEffect(() => {
    bookApi.departments().then(setDepartments).catch(() => {})
  }, [])

  // Close overlays on route change
  useEffect(() => {
    setMegaMenuOpen(false)
    setShowAutocomplete(false)
    setAccountDropdownOpen(false)
  }, [location.pathname])

  // Autocomplete debounce
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      const timer = setTimeout(() => {
        bookApi.autocomplete(searchQuery, selectedDept).then(setAutocomplete).catch(() => {})
      }, 250)
      return () => clearTimeout(timer)
    } else {
      setAutocomplete(null)
    }
  }, [searchQuery, selectedDept])

  // Click outside listener for search autocomplete and account dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowAutocomplete(false)
      }
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = (e: FormEvent) => {
    e.preventDefault()
    setShowAutocomplete(false)
    const params = new URLSearchParams()
    if (searchQuery.trim()) params.set('q', searchQuery.trim())
    if (selectedDept && selectedDept !== 'All Departments') params.set('category', selectedDept)
    nav(`/books?${params.toString()}`)
  }

  const handleSelectAutocomplete = (term: string) => {
    setSearchQuery(term)
    setShowAutocomplete(false)
    const params = new URLSearchParams()
    params.set('q', term)
    if (selectedDept && selectedDept !== 'All Departments') params.set('category', selectedDept)
    nav(`/books?${params.toString()}`)
  }

  const handleApplyPincode = (e: FormEvent) => {
    e.preventDefault()
    if (/^\d{6}$/.test(customPincode.trim())) {
      setDeliveryLocation({
        city: 'India',
        postalCode: customPincode.trim(),
        label: `Deliver to ${customPincode.trim()}`,
      })
      setLocationModalOpen(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F8F9FA] text-ink font-sans overflow-x-hidden w-full max-w-full">
      {/* Top Persistent Amazon-Style Header */}
      <header className="sticky top-0 z-40 bg-[#131921] text-white shadow-md">
        {/* MOBILE & TABLET HEADER (< lg) */}
        <div className="lg:hidden">
          {/* Mobile Row 1: Hamburger Menu, Logo, Account, Wishlist, Cart */}
          <div className="flex items-center justify-between px-3 py-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMegaMenuOpen(true)}
                className="p-1.5 text-white hover:text-teal-400 focus:outline-none"
                aria-label="Open categories menu"
              >
                <Menu size={22} />
              </button>
              <Link to="/" className="flex items-center gap-1.5 py-0.5">
                <BookOpen className="text-teal-400 h-5 w-5" />
                <span className="font-serif text-lg font-bold tracking-tight text-white leading-none">
                  Timeless<span className="text-teal-400 font-sans font-light text-xs ml-0.5">.in</span>
                </span>
              </Link>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to={user ? "/account" : "/login"}
                className="flex items-center gap-1 py-1 px-1.5 text-zinc-300 hover:text-white"
                aria-label="Your Account"
              >
                <User size={18} />
                <span className="text-xs font-medium max-w-[70px] truncate">
                  {user ? user.name.split(' ')[0] : 'Sign In'}
                </span>
              </Link>

              <Link
                to="/wishlist"
                className="relative p-1.5 text-white hover:text-teal-400"
                aria-label="Wishlist"
              >
                <Heart size={20} />
                {wish.length > 0 && (
                  <span className="absolute top-0 right-0 rounded-full bg-teal-500 px-1 text-[9px] font-bold text-white shadow-sm">
                    {wish.length}
                  </span>
                )}
              </Link>

              <Link
                to="/cart"
                className="relative flex items-center p-1.5 text-white"
                aria-label="Shopping Cart"
              >
                <ShoppingBag size={22} className="text-teal-400" />
                <span className="absolute top-0 left-2.5 rounded-full bg-teal-600 text-white font-bold text-[10px] px-1 min-w-[17px] text-center shadow-sm">
                  {count}
                </span>
              </Link>
            </div>
          </div>

          {/* Mobile Row 2: Full-Width Search Bar */}
          <div className="px-3 pb-2">
            <div className="relative w-full">
              <form onSubmit={handleSearch} className="flex h-9 w-full rounded-md overflow-hidden bg-white shadow-sm focus-within:ring-2 focus-within:ring-teal-500">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setShowAutocomplete(true)
                  }}
                  onFocus={() => setShowAutocomplete(true)}
                  placeholder="Search books, authors, ISBNs..."
                  className="flex-1 px-3 text-xs text-zinc-900 placeholder-zinc-500 focus:outline-none"
                />
                <button
                  type="submit"
                  aria-label="Search"
                  className="bg-teal-600 hover:bg-teal-500 text-white px-4 flex items-center justify-center transition-colors"
                >
                  <Search size={16} />
                </button>
              </form>

              {/* Mobile Autocomplete Dropdown */}
              {showAutocomplete && autocomplete && (autocomplete.suggestions.length > 0 || autocomplete.books.length > 0) && (
                <div className="absolute left-0 right-0 top-10 z-50 rounded-b-md border border-zinc-200 bg-white text-zinc-900 shadow-xl overflow-hidden max-h-[60vh] overflow-y-auto">
                  {autocomplete.suggestions.length > 0 && (
                    <div className="border-b border-zinc-100 py-1">
                      {autocomplete.suggestions.map((sug) => (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => handleSelectAutocomplete(sug)}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-zinc-100 flex items-center gap-2"
                        >
                          <Search size={13} className="text-zinc-400" />
                          <span className="font-medium text-zinc-800">{sug}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {autocomplete.books.length > 0 && (
                    <div className="p-2 bg-zinc-50">
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider px-1 mb-1">Book Matches</p>
                      <div className="space-y-1.5">
                        {autocomplete.books.slice(0, 3).map((b) => (
                          <Link
                            key={b.id}
                            to={`/books/${b.id}`}
                            onClick={() => setShowAutocomplete(false)}
                            className="flex items-center gap-2 p-1.5 rounded hover:bg-white border border-transparent hover:border-zinc-200"
                          >
                            <div className="h-10 w-7 shrink-0 overflow-hidden rounded bg-stone-100">
                              <BookCover
                                coverUrl={b.cover_url}
                                title={b.title}
                                author={b.author}
                                genre={b.genre}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div className="overflow-hidden">
                              <p className="text-xs font-semibold text-zinc-900 truncate">{b.title}</p>
                              <p className="text-[10px] text-zinc-500 truncate">by {b.author}</p>
                              <p className="text-xs font-bold text-teal-700">₹{b.price.toFixed(2)}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Mobile Row 3: Deliver to Strip */}
          <button
            type="button"
            onClick={() => setLocationModalOpen(true)}
            className="w-full flex items-center gap-2 px-3 py-1.5 bg-[#17202A] text-xs text-zinc-300 border-t border-zinc-800 active:bg-zinc-800 transition-colors"
          >
            <MapPin size={13} className="text-teal-400 flex-shrink-0" />
            <span className="text-[11px] truncate">
              Deliver to <span className="font-semibold text-white">{user ? user.name.split(' ')[0] : 'Bengaluru'}</span> - {deliveryLocation.postalCode || '560025'}
            </span>
            <span className="text-[10px] text-teal-300 ml-auto flex-shrink-0 font-semibold hover:underline">Update</span>
          </button>
        </div>

        {/* DESKTOP HEADER (>= lg) */}
        <div className="hidden lg:flex mx-auto max-w-7xl items-center gap-3 px-3 py-2 text-sm">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 py-1 px-2 hover:outline hover:outline-1 hover:outline-white/40 rounded transition-all shrink-0">
            <BookOpen className="text-teal-400 h-6 w-6" />
            <div className="flex flex-col">
              <span className="font-serif text-xl font-bold tracking-tight text-white leading-none">
                Timeless<span className="text-teal-400 font-sans font-light text-xs ml-1">.in</span>
              </span>
              <span className="text-[10px] text-teal-300 tracking-widest uppercase font-mono">Books</span>
            </div>
          </Link>

          {/* Delivery Location Selector */}
          <button
            type="button"
            onClick={() => setLocationModalOpen(true)}
            className="flex items-center gap-1.5 py-1.5 px-2 hover:outline hover:outline-1 hover:outline-white/40 rounded text-left transition-all max-w-[155px] shrink-0"
          >
            <MapPin size={17} className="text-amber-400 flex-shrink-0" />
            <div className="leading-tight overflow-hidden">
              <p className="text-[11px] text-zinc-400 truncate">Deliver to {user ? user.name.split(' ')[0] : 'Bengaluru'}</p>
              <p className="text-xs font-bold text-white truncate">{deliveryLocation.postalCode || '560025'}</p>
            </div>
          </button>

          {/* Large Search Bar with Department Selector & Autocomplete */}
          <div ref={searchContainerRef} className="relative flex-1 mx-1 min-w-[200px]">
            <form onSubmit={handleSearch} className="flex h-10 w-full rounded-md overflow-hidden bg-white shadow-sm focus-within:ring-2 focus-within:ring-teal-500">
              {/* Department Dropdown */}
              <div className="relative bg-zinc-100 border-r border-zinc-300 flex items-center max-w-[145px] shrink-0">
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="h-full w-full bg-transparent pl-3 pr-7 text-xs text-zinc-800 cursor-pointer focus:outline-none appearance-none truncate"
                >
                  {DEPARTMENTS_LIST.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
                <ChevronDown size={13} className="absolute right-2 text-zinc-500 pointer-events-none" />
              </div>

              {/* Search Input */}
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setShowAutocomplete(true)
                }}
                onFocus={() => setShowAutocomplete(true)}
                placeholder="Search Timeless Tales Books by title, author, or ISBN..."
                className="flex-1 px-3.5 text-sm text-zinc-900 placeholder-zinc-500 focus:outline-none"
              />

              {/* Search Submit Button */}
              <button
                type="submit"
                aria-label="Search"
                className="bg-teal-600 hover:bg-teal-500 text-white px-5 flex items-center justify-center transition-colors"
              >
                <Search size={18} />
              </button>
            </form>

            {/* Live Autocomplete Dropdown */}
            {showAutocomplete && autocomplete && (autocomplete.suggestions.length > 0 || autocomplete.books.length > 0) && (
              <div className="absolute left-0 right-0 top-11 z-50 rounded-b-md border border-zinc-200 bg-white text-zinc-900 shadow-xl overflow-hidden">
                {autocomplete.suggestions.length > 0 && (
                  <div className="border-b border-zinc-100 py-1">
                    {autocomplete.suggestions.map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => handleSelectAutocomplete(sug)}
                        className="w-full text-left px-4 py-1.5 text-xs hover:bg-zinc-100 flex items-center gap-2"
                      >
                        <Search size={13} className="text-zinc-400" />
                        <span className="font-medium text-zinc-800">{sug}</span>
                      </button>
                    ))}
                  </div>
                )}
                {autocomplete.books.length > 0 && (
                  <div className="p-2 bg-zinc-50">
                    <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider px-2 mb-1.5">Direct Book Matches</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {autocomplete.books.slice(0, 4).map((b) => (
                        <Link
                          key={b.id}
                          to={`/books/${b.id}`}
                          onClick={() => setShowAutocomplete(false)}
                          className="flex items-center gap-2.5 p-1.5 rounded hover:bg-white border border-transparent hover:border-zinc-200 transition-all"
                        >
                          <div className="h-12 w-8 shrink-0 overflow-hidden rounded shadow-sm bg-stone-100">
                            <BookCover
                              coverUrl={b.cover_url}
                              title={b.title}
                              author={b.author}
                              genre={b.genre}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="overflow-hidden">
                            <p className="text-xs font-semibold text-zinc-900 truncate">{b.title}</p>
                            <p className="text-[11px] text-zinc-500 truncate">by {b.author}</p>
                            <p className="text-xs font-bold text-teal-700 mt-0.5">₹{b.price.toFixed(2)}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Region / Currency */}
          <div className="hidden xl:flex items-center gap-1 py-1.5 px-2 hover:outline hover:outline-1 hover:outline-white/40 rounded cursor-pointer">
            <span className="text-base">🇮🇳</span>
            <span className="text-xs font-bold uppercase">EN</span>
          </div>

          {/* Account & Lists Dropdown */}
          <div ref={accountRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
              className="flex flex-col text-left py-1 px-2 hover:outline hover:outline-1 hover:outline-white/40 rounded transition-all leading-tight shrink-0"
            >
              <span className="text-[11px] text-zinc-300">
                Hello, {user ? user.name.split(' ')[0] : 'sign in'}
              </span>
              <span className="text-xs font-bold flex items-center gap-1">
                Account & Lists <ChevronDown size={11} className="text-zinc-400" />
              </span>
            </button>

            {accountDropdownOpen && (
              <div className="absolute right-0 top-11 z-50 w-72 rounded-md border border-zinc-200 bg-white p-4 text-zinc-900 shadow-2xl">
                {!user ? (
                  <div className="text-center pb-3 border-b border-zinc-200">
                    <Link
                      to="/login"
                      className="w-full btn !bg-teal-600 hover:!bg-teal-700 text-white text-xs font-bold py-2 rounded shadow-sm inline-block"
                    >
                      Sign in
                    </Link>
                    <p className="text-xs text-zinc-600 mt-2">
                      New customer? <Link to="/register" className="text-teal-700 font-semibold hover:underline">Start here.</Link>
                    </p>
                  </div>
                ) : (
                  <div className="pb-3 border-b border-zinc-200 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-zinc-500">Signed in as</p>
                      <p className="text-sm font-bold text-zinc-900 truncate max-w-[170px]">{user.name}</p>
                    </div>
                    {user.role === 'ADMIN' && (
                      <span className="text-[10px] font-bold bg-teal-100 text-teal-900 px-2 py-0.5 rounded">
                        Admin
                      </span>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-3 text-xs">
                  <div>
                    <p className="font-bold text-zinc-800 mb-2 border-b pb-1">Your Lists</p>
                    <div className="flex flex-col gap-1.5 text-zinc-600">
                      <Link to="/wishlist" className="hover:text-teal-700 hover:underline">Your Wishlist</Link>
                      <Link to="/saved-for-later" className="hover:text-teal-700 hover:underline">Saved for Later</Link>
                      <Link to="/recently-viewed" className="hover:text-teal-700 hover:underline">Recently Viewed</Link>
                    </div>
                  </div>
                  <div>
                    <p className="font-bold text-zinc-800 mb-2 border-b pb-1">Your Account</p>
                    <div className="flex flex-col gap-1.5 text-zinc-600">
                      <Link to="/account" className="hover:text-teal-700 hover:underline">Your Account</Link>
                      <Link to="/orders" className="hover:text-teal-700 hover:underline">Your Orders</Link>
                      <Link to="/library" className="hover:text-teal-700 hover:underline">Your Library</Link>
                      {user?.role === 'ADMIN' && (
                        <Link to="/admin-panel" className="text-teal-700 font-bold hover:underline">Store Admin</Link>
                      )}
                      {user && (
                        <button
                          type="button"
                          onClick={() => {
                            logout()
                            setAccountDropdownOpen(false)
                          }}
                          className="text-left text-zinc-600 hover:text-teal-700 flex items-center gap-1 mt-2 pt-2 border-t"
                        >
                          <LogOut size={12} /> Sign Out
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Returns & Orders */}
          <Link
            to={user ? "/orders" : "/login"}
            className="flex flex-col text-left py-1 px-2 hover:outline hover:outline-1 hover:outline-white/40 rounded transition-all leading-tight shrink-0"
          >
            <span className="text-[11px] text-zinc-300">Returns</span>
            <span className="text-xs font-bold">& Orders</span>
          </Link>

          {/* Wishlist Button */}
          <Link
            to="/wishlist"
            className="relative flex items-center py-1.5 px-2 hover:outline hover:outline-1 hover:outline-white/40 rounded transition-all shrink-0"
            aria-label="Wishlist"
          >
            <Heart size={22} className="text-white hover:text-teal-400" />
            {wish.length > 0 && (
              <span className="absolute -top-1 right-0 rounded-full bg-teal-500 px-1.5 text-[10px] font-bold text-white shadow-sm">
                {wish.length}
              </span>
            )}
          </Link>

          {/* Cart with Live Badge & Subtotal */}
          <Link
            to="/cart"
            className="flex items-center gap-2 py-1 px-2 hover:outline hover:outline-1 hover:outline-white/40 rounded transition-all shrink-0"
            aria-label="Shopping Cart"
          >
            <div className="relative">
              <ShoppingBag size={26} className="text-teal-400" />
              <span className="absolute -top-1.5 left-2.5 rounded-full bg-teal-600 text-white font-bold text-[11px] px-1.5 min-w-[20px] text-center shadow-sm">
                {count}
              </span>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-[11px] text-zinc-400">Cart</span>
              <span className="text-xs font-bold text-teal-400">₹{cartSubtotal.toFixed(2)}</span>
            </div>
          </Link>
        </div>

        {/* ROW 2: Amazon Books Secondary Navigation Bar (Fully Responsive with smooth scrolling) */}
        <div className="relative bg-[#232F3E] text-white text-xs border-t border-zinc-700/80 shadow-inner">
          <div className="mx-auto max-w-7xl relative flex items-center">
            {/* Scroll Left Button */}
            {canScrollLeft && (
              <button
                type="button"
                onClick={() => scrollSubnav('left')}
                className="absolute left-0 top-0 bottom-0 z-20 flex items-center justify-center px-1.5 bg-gradient-to-r from-[#232F3E] via-[#232F3E]/95 to-transparent text-white hover:text-teal-400 focus:outline-none transition-colors"
                aria-label="Scroll categories left"
              >
                <div className="rounded-full bg-black/50 hover:bg-black/75 p-1 shadow">
                  <ChevronLeft size={14} />
                </div>
              </button>
            )}

            {/* Scrollable list of categories */}
            <div
              ref={subnavRef}
              onScroll={checkSubnavScroll}
              className="flex-1 flex items-center gap-1 overflow-x-auto whitespace-nowrap scrollbar-none px-3 py-1.5 scroll-smooth select-none"
            >
              {/* All Mega Menu Toggle Button */}
              <button
                type="button"
                onClick={() => setMegaMenuOpen(true)}
                className="flex items-center gap-1.5 font-bold py-1 px-2.5 rounded hover:bg-white/10 text-white transition-colors flex-shrink-0"
              >
                <Menu size={15} className="text-teal-400" />
                <span>All Categories</span>
              </button>

              <NavLink
                to="/deals"
                className={({ isActive }) => `py-1 px-2.5 rounded transition-all flex-shrink-0 ${
                  isActive ? 'bg-teal-700/70 text-teal-200 font-bold border border-teal-500/40' : 'text-zinc-200 hover:text-white hover:bg-white/10'
                }`}
              >
                Today's Deals
              </NavLink>
              <NavLink
                to="/books?bestseller=true"
                className={({ isActive }) => `py-1 px-2.5 rounded transition-all flex-shrink-0 ${
                  isActive ? 'bg-teal-700/70 text-teal-200 font-bold border border-teal-500/40' : 'text-zinc-200 hover:text-white hover:bg-white/10'
                }`}
              >
                Bestsellers
              </NavLink>
              <NavLink
                to="/books?new_release=true"
                className={({ isActive }) => `py-1 px-2.5 rounded transition-all flex-shrink-0 ${
                  isActive ? 'bg-teal-700/70 text-teal-200 font-bold border border-teal-500/40' : 'text-zinc-200 hover:text-white hover:bg-white/10'
                }`}
              >
                New Releases
              </NavLink>
              <NavLink
                to="/books"
                className={({ isActive }) => `py-1 px-2.5 rounded transition-all flex-shrink-0 ${
                  isActive ? 'bg-teal-700/70 text-teal-200 font-bold border border-teal-500/40' : 'text-zinc-200 hover:text-white hover:bg-white/10'
                }`}
              >
                All Books
              </NavLink>
              <NavLink
                to="/books?genre=Children%20%26%20Young%20Adult"
                className={({ isActive }) => `py-1 px-2.5 rounded transition-all flex-shrink-0 ${
                  isActive ? 'bg-teal-700/70 text-teal-200 font-bold border border-teal-500/40' : 'text-zinc-200 hover:text-white hover:bg-white/10'
                }`}
              >
                Children's Books
              </NavLink>
              <NavLink
                to="/books?genre=Competitive%20Exam%20Preparation"
                className={({ isActive }) => `py-1 px-2.5 rounded transition-all flex-shrink-0 ${
                  isActive ? 'bg-teal-700/70 text-teal-200 font-bold border border-teal-500/40' : 'text-zinc-200 hover:text-white hover:bg-white/10'
                }`}
              >
                Textbooks & Exams
              </NavLink>
              <NavLink
                to="/books?format=EBOOK"
                className={({ isActive }) => `py-1 px-2.5 rounded transition-all flex-shrink-0 ${
                  isActive ? 'bg-teal-700/70 text-teal-200 font-bold border border-teal-500/40' : 'text-zinc-200 hover:text-white hover:bg-white/10'
                }`}
              >
                Kindle / eBooks
              </NavLink>
              <NavLink
                to="/books?genre=Regional%20Literature%20%26%20Kannada"
                className={({ isActive }) => `py-1 px-2.5 rounded transition-all flex-shrink-0 ${
                  isActive ? 'bg-teal-700/70 text-teal-200 font-bold border border-teal-500/40' : 'text-zinc-200 hover:text-white hover:bg-white/10'
                }`}
              >
                Kannada & Regional
              </NavLink>
              <NavLink
                to="/blogs"
                className={({ isActive }) => `py-1 px-2.5 rounded transition-all flex-shrink-0 ${
                  isActive ? 'bg-teal-700/70 text-teal-200 font-bold border border-teal-500/40' : 'text-zinc-200 hover:text-white hover:bg-white/10'
                }`}
              >
                Literary Magazine
              </NavLink>
              <NavLink
                to="/library"
                className={({ isActive }) => `py-1 px-2.5 rounded transition-all flex-shrink-0 ${
                  isActive ? 'bg-teal-700/70 text-teal-200 font-bold border border-teal-500/40' : 'text-zinc-200 hover:text-white hover:bg-white/10'
                }`}
              >
                Your Library
              </NavLink>
              {user?.role === 'ADMIN' && (
                <NavLink
                  to="/admin-panel"
                  className="py-1 px-2.5 bg-teal-500/20 text-teal-300 font-bold rounded border border-teal-500/40 hover:bg-teal-500/30 transition-colors flex-shrink-0 ml-auto"
                >
                  Admin Dashboard
                </NavLink>
              )}
            </div>

            {/* Scroll Right Button */}
            {canScrollRight && (
              <button
                type="button"
                onClick={() => scrollSubnav('right')}
                className="absolute right-0 top-0 bottom-0 z-20 flex items-center justify-center px-1.5 bg-gradient-to-l from-[#232F3E] via-[#232F3E]/95 to-transparent text-white hover:text-teal-400 focus:outline-none transition-colors"
                aria-label="Scroll categories right"
              >
                <div className="rounded-full bg-black/50 hover:bg-black/75 p-1 shadow">
                  <ChevronRight size={14} />
                </div>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mega Menu Slide-Over Drawer */}
      {megaMenuOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setMegaMenuOpen(false)} />
          <div className="relative flex w-full max-w-sm flex-col bg-white shadow-2xl z-10 overflow-y-auto">
            {/* Mega menu header */}
            <div className="bg-[#232F3E] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="bg-amber-400 text-zinc-900 rounded-full p-2">
                  <User size={18} />
                </div>
                <span className="font-serif text-lg font-bold">
                  Hello, {user ? user.name : 'Sign in'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMegaMenuOpen(false)}
                className="text-zinc-300 hover:text-white p-1"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            {/* Departments list */}
            <div className="p-4 space-y-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Shop by Category</p>
                <div className="flex flex-col divide-y divide-zinc-100">
                  {departments.map((dept) => (
                    <div key={dept.id} className="py-2.5">
                      <Link
                        to={`/books?category=${encodeURIComponent(dept.name)}`}
                        onClick={() => setMegaMenuOpen(false)}
                        className="font-medium text-zinc-900 hover:text-wine flex items-center justify-between text-sm"
                      >
                        <span>{dept.name}</span>
                        <ChevronRight size={15} className="text-zinc-400" />
                      </Link>
                      {dept.subcategories && dept.subcategories.length > 0 && (
                        <div className="pl-3 mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
                          {dept.subcategories.slice(0, 4).map((sub) => (
                            <Link
                              key={sub.id}
                              to={`/books?genre=${encodeURIComponent(sub.name)}`}
                              onClick={() => setMegaMenuOpen(false)}
                              className="text-xs text-zinc-500 hover:text-wine hover:underline"
                            >
                              {sub.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Programs & Features</p>
                <div className="flex flex-col gap-2.5 text-sm">
                  <Link to="/deals" onClick={() => setMegaMenuOpen(false)} className="text-zinc-800 hover:text-wine flex items-center gap-2">
                    <Tag size={16} className="text-amber-600" /> Today's Deals
                  </Link>
                  <Link to="/blogs" onClick={() => setMegaMenuOpen(false)} className="text-zinc-800 hover:text-wine flex items-center gap-2">
                    <BookMarked size={16} className="text-wine" /> Timeless Literary Magazine
                  </Link>
                  <Link to="/library" onClick={() => setMegaMenuOpen(false)} className="text-zinc-800 hover:text-wine flex items-center gap-2">
                    <Package size={16} className="text-emerald-700" /> Your Digital Library
                  </Link>
                  <Link to="/faq" onClick={() => setMegaMenuOpen(false)} className="text-zinc-800 hover:text-wine flex items-center gap-2">
                    <HelpCircle size={16} className="text-blue-600" /> Help & Customer Service
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delivery Location Modal */}
      {locationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setLocationModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-700"
            >
              <X size={20} />
            </button>
            <h3 className="font-serif text-xl font-bold text-zinc-900 mb-1">Choose your location</h3>
            <p className="text-xs text-zinc-600 mb-4">
              Delivery options and speeds may vary based on your location.
            </p>

            {user && addresses.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-bold text-zinc-700 mb-2">Your Saved Addresses</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {addresses.map((addr) => (
                    <button
                      key={addr.id}
                      type="button"
                      onClick={() => {
                        setDeliveryLocation({
                          city: addr.city,
                          postalCode: addr.postal_code,
                          label: `Deliver to ${addr.city} ${addr.postal_code}`,
                        })
                        setLocationModalOpen(false)
                      }}
                      className="w-full text-left p-2.5 rounded border border-zinc-200 hover:border-amber-500 hover:bg-amber-50/50 text-xs transition-colors"
                    >
                      <p className="font-bold text-zinc-900">{addr.full_name}</p>
                      <p className="text-zinc-600 truncate">{addr.street_address}, {addr.city} {addr.postal_code}</p>
                    </button>
                  ))}
                </div>
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-200" /></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-zinc-400">or enter an Indian pincode</span></div>
                </div>
              </div>
            )}

            <form onSubmit={handleApplyPincode} className="flex gap-2">
              <input
                type="text"
                maxLength={6}
                value={customPincode}
                onChange={(e) => setCustomPincode(e.target.value)}
                placeholder="Enter 6-digit PIN code (e.g. 560025)"
                className="flex-1 input text-sm"
              />
              <button type="submit" className="btn text-xs px-4">
                Apply
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Global Error Banner */}
      {error && (
        <div className="bg-wine-dark text-white px-4 py-2.5 text-xs flex items-center justify-between shadow-inner">
          <p className="mx-auto font-medium">{error}</p>
          <button type="button" onClick={clearError} className="text-white/80 hover:text-white font-bold text-sm">
            ×
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Amazon-Style Structured Footer */}
      <footer className="mt-12 bg-[#232F3E] text-white">
        {/* Back to top button */}
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="w-full bg-[#37475A] hover:bg-[#485769] py-3 text-center text-xs font-semibold tracking-wide text-zinc-200 transition-colors"
        >
          Back to top
        </button>

        {/* 4-column structured directory */}
        <div className="mx-auto max-w-7xl px-4 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 text-xs text-zinc-300">
            <div>
              <p className="font-bold text-white text-sm mb-3">Get to Know Us</p>
              <ul className="space-y-2">
                <li><Link to="/about" className="hover:underline">About Timeless Tales</Link></li>
                <li><Link to="/blogs" className="hover:underline">Literary Magazine</Link></li>
                <li><Link to="/about" className="hover:underline">Press & Literary Awards</Link></li>
                <li><Link to="/about" className="hover:underline">Curation Philosophy</Link></li>
              </ul>
            </div>

            <div>
              <p className="font-bold text-white text-sm mb-3">Connect with Us</p>
              <ul className="space-y-2">
                <li><a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:underline">Instagram</a></li>
                <li><a href="https://twitter.com" target="_blank" rel="noreferrer" className="hover:underline">Twitter / X</a></li>
                <li><a href="https://goodreads.com" target="_blank" rel="noreferrer" className="hover:underline">Goodreads Club</a></li>
                <li><a href="https://facebook.com" target="_blank" rel="noreferrer" className="hover:underline">Facebook Community</a></li>
              </ul>
            </div>

            <div>
              <p className="font-bold text-white text-sm mb-3">Make Money with Us</p>
              <ul className="space-y-2">
                <li><Link to="/contact" className="hover:underline">Sell on Timeless Tales</Link></li>
                <li><Link to="/contact" className="hover:underline">Author Central</Link></li>
                <li><Link to="/contact" className="hover:underline">Publisher Distribution Hub</Link></li>
                <li><Link to="/contact" className="hover:underline">Affiliate & Literary Partners</Link></li>
              </ul>
            </div>

            <div>
              <p className="font-bold text-white text-sm mb-3">Let Us Help You</p>
              <ul className="space-y-2">
                <li><Link to="/account" className="hover:underline">Your Account</Link></li>
                <li><Link to="/orders" className="hover:underline">Returns & Replacements</Link></li>
                <li><Link to="/faq" className="hover:underline">100% Purchase Protection</Link></li>
                <li><Link to="/faq" className="hover:underline">Help & FAQs</Link></li>
                <li><Link to="/contact" className="hover:underline">Customer Support</Link></li>
              </ul>
            </div>
          </div>

          {/* Regional & Trust Badge Strip */}
          <div className="mt-10 pt-6 border-t border-zinc-700 flex flex-wrap items-center justify-between gap-4 text-xs text-zinc-400">
            <div className="flex items-center gap-3">
              <Link to="/" className="font-serif text-lg font-bold text-white flex items-center gap-1.5">
                <BookOpen size={18} className="text-amber-400" /> Timeless Tales India
              </Link>
              <span className="border border-zinc-600 rounded px-2 py-0.5 text-zinc-300">
                ₹ INR - Indian Rupee
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 sm:gap-6">
              <span className="flex items-center gap-1 text-zinc-300">
                <ShieldCheck size={14} className="text-emerald-400" /> 100% Verified Editions
              </span>
              <span>Fast Pan-India Delivery</span>
              <span>Secure Razorpay / UPI Sandbox</span>
            </div>
          </div>
        </div>

        {/* Bottom copyright line */}
        <div className="bg-[#131A22] py-4 text-center text-[11px] text-zinc-500 border-t border-zinc-800">
          <p>© 2026 Timeless Tales Private Limited. All rights reserved.</p>
          <p className="mt-1 text-[10px] text-zinc-600">
            Inspired by Amazon Books architecture. Built with Django REST Framework, PostgreSQL, and React.
          </p>
        </div>
      </footer>
    </div>
  )
}
