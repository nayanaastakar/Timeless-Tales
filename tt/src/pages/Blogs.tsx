import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookMarked, Clock, ArrowRight, User, Search } from 'lucide-react'
import { contentApi, type BlogPost } from '../lib/api'

export default function Blogs() {
  const [blogs, setBlogs] = useState<BlogPost[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    contentApi.blogs(selectedCategory !== 'ALL' ? selectedCategory : undefined).then((data) => {
      setBlogs(data)
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })
  }, [selectedCategory])

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-10">
      {/* Magazine Hero */}
      <div className="rounded-2xl bg-[#1A1A1A] p-8 sm:p-12 text-white text-center space-y-3 relative overflow-hidden">
        <span className="text-xs font-bold uppercase tracking-widest text-amber-400">Timeless Tales Literary Review</span>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold">The Literary Magazine</h1>
        <p className="text-sm text-zinc-300 max-w-xl mx-auto">
          Thoughtful reflections, author profiles, reading guides, and deep-dives into Indian and world literature.
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 border-b border-zinc-200 pb-3 text-xs overflow-x-auto">
        {['ALL', 'Literary Guides', 'Reading Reflections', 'Regional Spotlight'].map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-1.5 rounded-full font-medium whitespace-nowrap transition-colors ${
              selectedCategory === cat ? 'bg-wine text-white' : 'text-zinc-600 hover:bg-zinc-100'
            }`}
          >
            {cat === 'ALL' ? 'All Articles' : cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-wine border-r-transparent" />
        </div>
      ) : blogs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {blogs.map((b) => (
            <article key={b.id} className="group rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <Link to={`/blogs/${b.slug}`} className="block aspect-[16/10] overflow-hidden bg-zinc-100">
                  <img
                    src={b.cover_image_url || 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80'}
                    alt={b.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </Link>
                <div className="p-5 space-y-2">
                  <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                    <span className="font-bold text-wine">{b.category}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> {b.reading_time_minutes} min read
                    </span>
                  </div>
                  <Link to={`/blogs/${b.slug}`} className="font-serif font-bold text-lg text-zinc-900 group-hover:text-wine line-clamp-2 transition-colors">
                    {b.title}
                  </Link>
                  <p className="text-xs text-zinc-600 line-clamp-3 leading-relaxed">{b.summary}</p>
                </div>
              </div>

              <div className="p-5 pt-0 border-t border-zinc-100 mt-4 flex items-center justify-between text-xs text-zinc-500">
                <span className="flex items-center gap-1.5 font-medium">
                  <User size={13} className="text-zinc-400" /> {b.author_name}
                </span>
                <Link to={`/blogs/${b.slug}`} className="text-wine font-bold hover:underline flex items-center gap-1">
                  Read <ArrowRight size={13} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center text-zinc-500 text-xs">
          No articles found in this category.
        </div>
      )}
    </div>
  )
}
