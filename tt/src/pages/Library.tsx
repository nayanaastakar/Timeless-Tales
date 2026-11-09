import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BookOpen, CheckCircle, Clock, BookMarked,
  Filter, Sparkles, X, ChevronRight
} from 'lucide-react'
import { libraryApi, type LibraryItem } from '../lib/api'
import BookCover from '../components/BookCover'

export default function Library() {
  const [items, setItems] = useState<LibraryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'ALL' | 'UNREAD' | 'READING' | 'FINISHED'>('ALL')
  const [readingSampleBook, setReadingSampleBook] = useState<LibraryItem | null>(null)

  const loadLibrary = async () => {
    setLoading(true)
    try {
      const data = await libraryApi.list()
      setItems(data)
    } catch {}
    setLoading(false)
  }

  useEffect(() => {
    loadLibrary()
  }, [])

  const handleUpdateStatus = async (item: LibraryItem, newStatus: string) => {
    try {
      await libraryApi.update(item.id, { reading_status: newStatus })
      await loadLibrary()
    } catch {}
  }

  const filteredItems = items.filter((it) => {
    if (activeTab === 'ALL') return true
    return it.reading_status === activeTab
  })

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <nav className="text-xs text-zinc-500 mb-2">
          <Link to="/" className="hover:text-wine">Home</Link>
          <span> / </span>
          <Link to="/account" className="hover:text-wine">Your Account</Link>
          <span> / </span>
          <span className="text-zinc-800 font-medium">Your Library</span>
        </nav>
        <h1 className="font-serif text-3xl font-bold text-zinc-900">Your Books & Reading Library</h1>
        <p className="text-xs text-zinc-500 mt-1">
          Your personal bookshelf tracking all physical purchases, digital editions, and reading goals
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-zinc-200 pb-3 text-xs">
        {[
          { label: 'All Titles', val: 'ALL', count: items.length },
          { label: 'Currently Reading', val: 'READING', count: items.filter(i => i.reading_status === 'READING').length },
          { label: 'Want to Read', val: 'UNREAD', count: items.filter(i => i.reading_status === 'UNREAD').length },
          { label: 'Finished', val: 'FINISHED', count: items.filter(i => i.reading_status === 'FINISHED').length },
        ].map((tab) => (
          <button
            key={tab.val}
            type="button"
            onClick={() => setActiveTab(tab.val as any)}
            className={`px-4 py-1.5 rounded-full font-medium transition-colors ${
              activeTab === tab.val ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-wine border-r-transparent" />
          <p className="mt-3 text-xs text-zinc-500">Loading your library...</p>
        </div>
      ) : filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredItems.map((item) => (
            <div key={item.id} className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm flex flex-col justify-between space-y-3">
              <div>
                <div className="relative aspect-[2/3] w-full overflow-hidden rounded bg-cream/40 mb-3 border shadow-sm">
                  <BookCover
                    coverUrl={item.book.cover_url}
                    isbn13={item.book.isbn13}
                    title={item.book.title}
                    author={item.book.author}
                    genre={item.book.genre}
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute top-2 left-2 rounded bg-zinc-900/80 px-2 py-0.5 text-[10px] font-bold text-white uppercase backdrop-blur-sm">
                    {item.format}
                  </span>
                </div>

                <Link to={`/books/${item.book.id}`} className="font-serif font-bold text-base text-zinc-900 hover:text-wine line-clamp-1">
                  {item.book.title}
                </Link>
                <p className="text-xs text-zinc-500">by {item.book.author}</p>

                {/* Reading Status Selector */}
                <div className="mt-3 text-xs">
                  <label className="text-[11px] text-zinc-400 block mb-1">Status:</label>
                  <select
                    value={item.reading_status}
                    onChange={(e) => handleUpdateStatus(item, e.target.value)}
                    className="w-full rounded border border-zinc-200 bg-zinc-50 p-1.5 text-xs text-zinc-800"
                  >
                    <option value="UNREAD">Want to Read</option>
                    <option value="READING">Currently Reading</option>
                    <option value="FINISHED">Finished</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 border-t flex gap-2">
                <button
                  type="button"
                  onClick={() => setReadingSampleBook(item)}
                  className="w-full btn text-xs py-1.5 flex items-center justify-center gap-1.5"
                >
                  <BookOpen size={13} /> Read Sample
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center space-y-4">
          <BookMarked className="mx-auto h-12 w-12 text-zinc-300" />
          <h2 className="font-serif text-2xl font-bold text-zinc-900">No books in this shelf yet</h2>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Books purchased from Timeless Tales automatically appear here in your personal digital bookshelf.
          </p>
          <Link to="/books" className="btn text-xs px-6 py-2.5 inline-block">
            Browse Bookstore
          </Link>
        </div>
      )}

      {/* Digital Sample Excerpt Modal */}
      {readingSampleBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl rounded-xl bg-ivory p-6 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-wine/10 mb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-wine">Timeless Tales Reader</span>
                <h3 className="font-serif text-xl font-bold text-zinc-900">{readingSampleBook.book.title}</h3>
                <p className="text-xs text-zinc-600">by {readingSampleBook.book.author}</p>
              </div>
              <button
                type="button"
                onClick={() => setReadingSampleBook(null)}
                className="text-zinc-400 hover:text-zinc-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 text-sm leading-relaxed text-zinc-800 font-serif space-y-4">
              <p className="first-letter:text-4xl first-letter:font-bold first-letter:text-wine first-letter:mr-1">
                {readingSampleBook.book.sample_text || `Chapter One.\n\nIt was a morning that began like any other, but would alter the course of everything that followed...`}
              </p>
              <p>{readingSampleBook.book.blurb}</p>
            </div>

            <div className="pt-4 border-t border-wine/10 flex justify-end">
              <button
                type="button"
                onClick={() => setReadingSampleBook(null)}
                className="btn text-xs px-5 py-2"
              >
                Done Reading
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
