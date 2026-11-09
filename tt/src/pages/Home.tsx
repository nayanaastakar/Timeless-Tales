import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronLeft, ChevronRight, ShieldCheck, Truck, RotateCcw,
  Sparkles, Award, TrendingUp, Flame, ArrowRight, BookOpen, Send
} from 'lucide-react'
import { bookApi, contentApi, type Book, type BlogPost } from '../lib/api'
import BookCard from '../components/BookCard'

const HERO_SLIDES = [
  {
    id: 1,
    tag: 'THE GREAT INDIAN BOOK SALE',
    title: 'Up to 50% Off Bestsellers & Literary Classics',
    subtitle: 'From Salman Rushdie and Arundhati Roy to James Clear and Yuval Noah Harari. Free shipping on orders over ₹499.',
    ctaText: 'Explore Deals',
    ctaLink: '/deals',
    bgGradient: 'from-[#4A0E17] via-[#2D0911] to-[#120306]',
    badge: 'Limited Time Offer',
    accentColor: 'text-amber-400',
  },
  {
    id: 2,
    tag: 'REGIONAL SPOTLIGHT',
    title: 'Celebrate Rich Kannada Literature & Regional Classics',
    subtitle: 'Discover Poornachandra Tejaswi, S.L. Bhyrappa, and Shivaram Karanth with authentic original publications.',
    ctaText: 'Browse Kannada Books',
    ctaLink: '/books?genre=Regional%20Literature%20%26%20Kannada',
    bgGradient: 'from-[#19323C] via-[#0E1E24] to-[#060D10]',
    badge: 'Regional Treasures',
    accentColor: 'text-emerald-400',
  },
  {
    id: 3,
    tag: 'AWARD-WINNING FICTION',
    title: 'The Booker Prize & International Laureate Collection',
    subtitle: 'Captivating stories that have shaped world literature, in premium hardcover and paperback editions.',
    ctaText: 'Discover Winners',
    ctaLink: '/books?genre=Literature%20%26%20Fiction',
    bgGradient: 'from-[#3B1F2B] via-[#221219] to-[#0F080B]',
    badge: 'Curator’s Choice',
    accentColor: 'text-rose-300',
  },
]

export default function Home() {
  const [bestsellers, setBestsellers] = useState<Book[]>([])
  const [newReleases, setNewReleases] = useState<Book[]>([])
  const [deals, setDeals] = useState<Book[]>([])
  const [topRated, setTopRated] = useState<Book[]>([])
  const [under299, setUnder299] = useState<Book[]>([])
  const [under499, setUnder499] = useState<Book[]>([])
  const [regional, setRegional] = useState<Book[]>([])
  const [recentlyViewed, setRecentlyViewed] = useState<Book[]>([])
  const [blogs, setBlogs] = useState<BlogPost[]>([])
  const [activeHero, setActiveHero] = useState(0)
  const [priceFilterTab, setPriceFilterTab] = useState<'under299' | 'under499'>('under299')
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [newsletterMsg, setNewsletterMsg] = useState('')

  useEffect(() => {
    // Load recommendations
    bookApi.recommendations().then((data) => {
      setBestsellers(data.bestsellers || [])
      setNewReleases(data.new_releases || [])
      setDeals(data.today_deals || [])
      setTopRated(data.top_rated || [])
      setUnder299(data.under_299 || [])
      setUnder499(data.under_499 || [])
      setRegional(data.regional_spotlight || [])
    }).catch(() => {})

    // Load recently viewed
    bookApi.recentlyViewed().then(setRecentlyViewed).catch(() => {})

    // Load literary blogs
    contentApi.blogs().then((b) => setBlogs(b.slice(0, 3))).catch(() => {})
  }, [])

  // Auto-advance hero carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveHero((prev) => (prev + 1) % HERO_SLIDES.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [])

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newsletterEmail) return
    try {
      const res = await contentApi.subscribeNewsletter(newsletterEmail)
      setNewsletterMsg(res.message)
      setNewsletterEmail('')
    } catch {
      setNewsletterMsg('Thank you for subscribing!')
    }
  }

  // Horizontal carousel scroll helper
  const scrollCarousel = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
    if (ref.current) {
      const scrollAmount = direction === 'left' ? -380 : 380
      ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  const bestsellersRef = useRef<HTMLDivElement>(null)
  const dealsRef = useRef<HTMLDivElement>(null)
  const newReleasesRef = useRef<HTMLDivElement>(null)
  const topRatedRef = useRef<HTMLDivElement>(null)
  const regionalRef = useRef<HTMLDivElement>(null)
  const recentlyViewedRef = useRef<HTMLDivElement>(null)

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Hero Promotional Campaign Banner Carousel */}
      <div className="relative overflow-hidden bg-zinc-950 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="relative min-h-[300px] sm:min-h-[400px] flex items-center px-4 sm:px-12 py-8 sm:py-12">
            {HERO_SLIDES.map((slide, idx) => (
              <div
                key={slide.id}
                className={`absolute inset-0 bg-gradient-to-r ${slide.bgGradient} p-5 sm:p-14 flex flex-col justify-center transition-opacity duration-700 ${
                  activeHero === idx ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                }`}
              >
                <div className="max-w-2xl">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold tracking-wider uppercase mb-2 sm:mb-3 backdrop-blur-sm">
                    <Sparkles size={13} className={slide.accentColor} />
                    <span>{slide.tag}</span>
                  </div>
                  <h1 className="font-serif text-2xl sm:text-4xl md:text-5xl font-bold leading-tight text-white mb-2 sm:mb-3">
                    {slide.title}
                  </h1>
                  <p className="text-xs sm:text-base text-zinc-300 mb-4 sm:mb-6 line-clamp-2">
                    {slide.subtitle}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                    <Link
                      to={slide.ctaLink}
                      className="btn !bg-teal-500 hover:!bg-teal-400 text-zinc-950 font-bold px-5 sm:px-6 py-2 sm:py-2.5 rounded shadow-lg text-xs sm:text-sm"
                    >
                      {slide.ctaText}
                    </Link>
                    <span className="text-xs text-zinc-400 font-mono">
                      {slide.badge}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* Slide Arrows (Desktop only, mobile uses dots) */}
            <button
              type="button"
              onClick={() => setActiveHero((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}
              className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 z-20 rounded-full bg-black/40 hover:bg-black/70 p-2 text-white transition-colors"
              aria-label="Previous slide"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              type="button"
              onClick={() => setActiveHero((prev) => (prev + 1) % HERO_SLIDES.length)}
              className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 z-20 rounded-full bg-black/40 hover:bg-black/70 p-2 text-white transition-colors"
              aria-label="Next slide"
            >
              <ChevronRight size={22} />
            </button>

            {/* Carousel Dot Indicators */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
              {HERO_SLIDES.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveHero(i)}
                  className={`h-2 rounded-full transition-all ${activeHero === i ? 'w-6 bg-amber-400' : 'w-2 bg-white/40'}`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Amazon Value Props Strip */}
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 p-3 sm:p-4 rounded-lg bg-white border border-teal-900/10 shadow-sm">
          <div className="flex items-center gap-2 sm:gap-3 p-1 sm:p-2 min-w-0">
            <Truck className="h-6 w-6 sm:h-8 sm:w-8 text-teal-600 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] sm:text-xs font-bold text-zinc-900 truncate sm:whitespace-normal">Free Delivery</p>
              <p className="text-[10px] sm:text-[11px] text-zinc-500 truncate sm:whitespace-normal">Orders above ₹499</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 p-1 sm:p-2 min-w-0">
            <ShieldCheck className="h-6 w-6 sm:h-8 sm:w-8 text-emerald-600 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] sm:text-xs font-bold text-zinc-900 truncate sm:whitespace-normal">100% Genuine</p>
              <p className="text-[10px] sm:text-[11px] text-zinc-500 truncate sm:whitespace-normal">Verified publishers</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 p-1 sm:p-2 min-w-0">
            <RotateCcw className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] sm:text-xs font-bold text-zinc-900 truncate sm:whitespace-normal">7-Day Returns</p>
              <p className="text-[10px] sm:text-[11px] text-zinc-500 truncate sm:whitespace-normal">Replacement or refund</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 p-1 sm:p-2 min-w-0">
            <Award className="h-6 w-6 sm:h-8 sm:w-8 text-teal-700 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] sm:text-xs font-bold text-zinc-900 truncate sm:whitespace-normal">Indian Literature</p>
              <p className="text-[10px] sm:text-[11px] text-zinc-500 truncate sm:whitespace-normal">Kannada & Hindi</p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Continue Browsing / Recently Viewed Shelf (If viewed) */}
      {recentlyViewed.length > 0 && (
        <section className="mx-auto max-w-7xl px-4">
          <div className="rounded-lg bg-white p-5 border border-wine/10 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-zinc-900">Inspired by Your Browsing History</h2>
                <p className="text-xs text-zinc-500">Pick up where you left off</p>
              </div>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => scrollCarousel(recentlyViewedRef, 'left')}
                  className="rounded border border-zinc-200 p-1.5 hover:bg-zinc-100"
                  aria-label="Scroll left"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => scrollCarousel(recentlyViewedRef, 'right')}
                  className="rounded border border-zinc-200 p-1.5 hover:bg-zinc-100"
                  aria-label="Scroll right"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
            <div ref={recentlyViewedRef} className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 scrollbar-none scroll-smooth">
              {recentlyViewed.map((b) => (
                <div key={b.id} className="w-40 sm:w-52 flex-shrink-0">
                  <BookCard book={b} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4. Bestsellers in Books (Horizontal Amazon Carousel) */}
      <section className="mx-auto max-w-7xl px-4">
        <div className="rounded-lg bg-white p-5 border border-wine/10 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-zinc-100 pb-3">
            <div className="flex items-center gap-2">
              <Flame className="text-amber-500" size={22} />
              <div>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-zinc-900">Bestsellers in Books</h2>
                <p className="text-xs text-zinc-500">The most popular titles bought across India right now</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/books?bestseller=true" className="text-xs font-semibold text-wine hover:underline flex items-center gap-1">
                See more <ChevronRight size={14} />
              </Link>
              <div className="hidden sm:flex gap-1.5">
                <button
                  type="button"
                  onClick={() => scrollCarousel(bestsellersRef, 'left')}
                  className="rounded border border-zinc-200 p-1.5 hover:bg-zinc-100"
                  aria-label="Scroll left"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => scrollCarousel(bestsellersRef, 'right')}
                  className="rounded border border-zinc-200 p-1.5 hover:bg-zinc-100"
                  aria-label="Scroll right"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

          <div ref={bestsellersRef} className="flex gap-3 sm:gap-4 overflow-x-auto pb-3 scrollbar-none scroll-smooth">
            {bestsellers.map((b) => (
              <div key={b.id} className="w-40 sm:w-52 flex-shrink-0">
                <BookCard book={b} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Today's Deals (Up to 50% Off) */}
      <section className="mx-auto max-w-7xl px-4">
        <div className="rounded-lg bg-white p-5 border border-wine/10 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-zinc-100 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="text-wine" size={22} />
              <div>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-zinc-900">Today's Deals — Up to 50% Off</h2>
                <p className="text-xs text-zinc-500">Verified discounted editions on reader favorites</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/deals" className="text-xs font-semibold text-wine hover:underline flex items-center gap-1">
                All Deals <ChevronRight size={14} />
              </Link>
              <div className="hidden sm:flex gap-1.5">
                <button
                  type="button"
                  onClick={() => scrollCarousel(dealsRef, 'left')}
                  className="rounded border border-zinc-200 p-1.5 hover:bg-zinc-100"
                  aria-label="Scroll left"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => scrollCarousel(dealsRef, 'right')}
                  className="rounded border border-zinc-200 p-1.5 hover:bg-zinc-100"
                  aria-label="Scroll right"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

          <div ref={dealsRef} className="flex gap-3 sm:gap-4 overflow-x-auto pb-3 scrollbar-none scroll-smooth">
            {deals.map((b) => (
              <div key={b.id} className="w-40 sm:w-52 flex-shrink-0">
                <BookCard book={b} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Popular Categories Visual Grid */}
      <section className="mx-auto max-w-7xl px-4">
        <h2 className="font-serif text-2xl font-bold text-zinc-900 mb-4">Shop Books by Category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {[
            { name: 'Literature & Fiction', img: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80', count: '120+ titles' },
            { name: 'Mystery & Thriller', img: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=400&q=80', count: '85+ titles' },
            { name: 'Science Fiction & Fantasy', img: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=80', count: '90+ titles' },
            { name: 'Self-Help & Growth', img: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=400&q=80', count: '75+ titles' },
            { name: 'Computers & Technology', img: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=400&q=80', count: '60+ titles' },
            { name: 'Kannada & Regional', img: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=400&q=80', count: '50+ titles' },
          ].map((cat) => (
            <Link
              key={cat.name}
              to={`/books?category=${encodeURIComponent(cat.name)}`}
              className="group relative overflow-hidden rounded-lg bg-zinc-900 aspect-[4/5] shadow-sm hover:shadow-md transition-all"
            >
              <img
                src={cat.img}
                alt={cat.name}
                className="h-full w-full object-cover opacity-60 transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-4 flex flex-col justify-end">
                <p className="font-serif font-bold text-white text-base leading-tight group-hover:text-amber-400 transition-colors">
                  {cat.name}
                </p>
                <p className="text-[11px] text-zinc-300 mt-1">{cat.count}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 7. New Releases Shelf */}
      <section className="mx-auto max-w-7xl px-4">
        <div className="rounded-lg bg-white p-5 border border-wine/10 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-zinc-100 pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="text-emerald-700" size={22} />
              <div>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-zinc-900">Hot New Releases</h2>
                <p className="text-xs text-zinc-500">Newly added publications and fresh prints</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/books?new_release=true" className="text-xs font-semibold text-wine hover:underline flex items-center gap-1">
                View all <ChevronRight size={14} />
              </Link>
              <div className="hidden sm:flex gap-1.5">
                <button
                  type="button"
                  onClick={() => scrollCarousel(newReleasesRef, 'left')}
                  className="rounded border border-zinc-200 p-1.5 hover:bg-zinc-100"
                  aria-label="Scroll left"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => scrollCarousel(newReleasesRef, 'right')}
                  className="rounded border border-zinc-200 p-1.5 hover:bg-zinc-100"
                  aria-label="Scroll right"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

          <div ref={newReleasesRef} className="flex gap-3 sm:gap-4 overflow-x-auto pb-3 scrollbar-none scroll-smooth">
            {newReleases.map((b) => (
              <div key={b.id} className="w-40 sm:w-52 flex-shrink-0">
                <BookCard book={b} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Price Point Shelves (Books Under ₹299 / Under ₹499) */}
      <section className="mx-auto max-w-7xl px-4">
        <div className="rounded-lg bg-white p-5 border border-wine/10 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4 border-b border-zinc-100 pb-3">
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-zinc-900">Budget Reading Corner</h2>
              <p className="text-xs text-zinc-500">High-rating titles at friendly price points</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPriceFilterTab('under299')}
                className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${
                  priceFilterTab === 'under299'
                    ? 'bg-wine text-white border-wine'
                    : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                }`}
              >
                Books Under ₹299
              </button>
              <button
                type="button"
                onClick={() => setPriceFilterTab('under499')}
                className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${
                  priceFilterTab === 'under499'
                    ? 'bg-wine text-white border-wine'
                    : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                }`}
              >
                Books Under ₹499
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {(priceFilterTab === 'under299' ? under299 : under499).slice(0, 5).map((b) => (
              <BookCard key={b.id} book={b} />
            ))}
          </div>
        </div>
      </section>

      {/* 9. Kannada & Regional Literature Spotlight */}
      <section className="mx-auto max-w-7xl px-4">
        <div className="rounded-lg bg-[#FAF6F0] p-6 border border-amber-900/10 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-amber-900/10 pb-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900">Regional Heritage</span>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-wine-dark">Kannada Literature & South Indian Classics</h2>
              <p className="text-xs text-zinc-600">Poornachandra Tejaswi, S.L. Bhyrappa, and Jnanpith awardees</p>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/books?genre=Regional%20Literature%20%26%20Kannada" className="text-xs font-semibold text-wine hover:underline flex items-center gap-1">
                View all <ChevronRight size={14} />
              </Link>
              <div className="hidden sm:flex gap-1.5">
                <button
                  type="button"
                  onClick={() => scrollCarousel(regionalRef, 'left')}
                  className="rounded border border-amber-900/20 p-1.5 hover:bg-amber-100"
                  aria-label="Scroll left"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => scrollCarousel(regionalRef, 'right')}
                  className="rounded border border-amber-900/20 p-1.5 hover:bg-amber-100"
                  aria-label="Scroll right"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

          <div ref={regionalRef} className="flex gap-3 sm:gap-4 overflow-x-auto pb-3 scrollbar-none scroll-smooth">
            {regional.map((b) => (
              <div key={b.id} className="w-40 sm:w-52 flex-shrink-0">
                <BookCard book={b} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 10. Literary Magazine & Blog Previews */}
      {blogs.length > 0 && (
        <section className="mx-auto max-w-7xl px-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-serif text-2xl font-bold text-zinc-900">From the Literary Desk</h2>
              <p className="text-xs text-zinc-500">Author interviews, reading reflections, and genre guides</p>
            </div>
            <Link to="/blogs" className="text-xs font-semibold text-wine hover:underline flex items-center gap-1">
              Read Magazine <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {blogs.map((post) => (
              <article key={post.id} className="group rounded-lg border border-wine/10 bg-white overflow-hidden shadow-sm hover:shadow-md transition-all">
                <Link to={`/blogs/${post.slug}`} className="block aspect-[16/9] overflow-hidden bg-zinc-100">
                  <img
                    src={post.cover_image_url || 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80'}
                    alt={post.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </Link>
                <div className="p-4">
                  <div className="flex items-center gap-2 text-[11px] text-zinc-500 mb-2">
                    <span className="font-semibold text-wine">{post.category}</span>
                    <span>•</span>
                    <span>{post.reading_time_minutes} min read</span>
                  </div>
                  <Link to={`/blogs/${post.slug}`} className="font-serif font-bold text-lg text-zinc-900 group-hover:text-wine line-clamp-2 transition-colors">
                    {post.title}
                  </Link>
                  <p className="text-xs text-zinc-600 mt-2 line-clamp-2">{post.summary}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* 11. Newsletter Subscription Card */}
      <section className="mx-auto max-w-7xl px-4">
        <div className="rounded-xl bg-gradient-to-r from-wine-dark to-wine p-8 sm:p-12 text-white shadow-md">
          <div className="max-w-xl mx-auto text-center">
            <BookOpen className="h-10 w-10 text-amber-400 mx-auto mb-3" />
            <h2 className="font-serif text-3xl font-bold">Join the Timeless Tales Reading Circle</h2>
            <p className="text-sm text-zinc-200 mt-2">
              Receive exclusive book deals, literary insights, author spotlights, and first notice on limited hardcover runs.
            </p>

            <form onSubmit={handleNewsletter} className="mt-6 flex flex-col sm:flex-row gap-2.5 max-w-md mx-auto">
              <input
                type="email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                className="flex-1 rounded px-4 py-2.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
              />
              <button
                type="submit"
                className="btn bg-amber-400 hover:bg-amber-500 text-zinc-900 font-bold py-2.5 px-6 rounded text-sm flex items-center justify-center gap-2"
              >
                <Send size={15} /> Subscribe
              </button>
            </form>
            {newsletterMsg && (
              <p className="mt-3 text-xs text-amber-200 font-medium">{newsletterMsg}</p>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
