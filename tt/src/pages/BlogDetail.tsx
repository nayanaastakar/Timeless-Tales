import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Clock, User, ArrowLeft, Share2, BookOpen, Check } from 'lucide-react'
import { contentApi, type BlogPost } from '../lib/api'

export default function BlogDetail() {
  const { slug } = useParams<{ slug: string }>()
  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!slug) return
    contentApi.blog(slug).then((data) => {
      setPost(data)
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })
  }, [slug])

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-wine border-r-transparent" />
      </div>
    )
  }

  if (!post) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center space-y-4">
        <h1 className="font-serif text-2xl font-bold">Article Not Found</h1>
        <Link to="/blogs" className="btn text-xs px-6 py-2 inline-block">
          Back to Magazine
        </Link>
      </div>
    )
  }

  return (
    <article className="mx-auto max-w-3xl px-4 py-8 space-y-8">
      {/* Back button */}
      <Link to="/blogs" className="text-xs text-zinc-500 hover:text-wine flex items-center gap-1.5 font-medium">
        <ArrowLeft size={14} /> Back to Literary Magazine
      </Link>

      {/* Header */}
      <div className="space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-wine">{post.category}</span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-zinc-900 leading-tight">
          {post.title}
        </h1>
        <div className="flex flex-wrap items-center justify-between gap-4 border-y border-zinc-200 py-3 text-xs text-zinc-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-semibold text-zinc-800">
              <User size={14} className="text-zinc-400" /> {post.author_name}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock size={14} /> {post.reading_time_minutes} min read
            </span>
            <span>•</span>
            <span>{new Date(post.published_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
          <button
            type="button"
            onClick={handleShare}
            className="btn-outline text-xs py-1 px-3 flex items-center gap-1.5"
          >
            {copied ? <><Check size={13} className="text-emerald-600" /> Link Copied</> : <><Share2 size={13} /> Share</>}
          </button>
        </div>
      </div>

      {/* Featured Cover Image */}
      {post.cover_image_url && (
        <div className="aspect-[16/9] w-full overflow-hidden rounded-xl bg-zinc-100 shadow-sm">
          <img
            src={post.cover_image_url}
            alt={post.title}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      {/* Article Content */}
      <div className="font-serif text-base sm:text-lg text-zinc-800 leading-relaxed space-y-5 whitespace-pre-line">
        <p className="font-sans font-medium text-zinc-600 text-sm leading-relaxed italic border-l-2 border-wine pl-4">
          {post.summary}
        </p>
        <p>{post.content}</p>
      </div>

      {/* Bottom author card & recommendations */}
      <div className="rounded-xl border border-wine/10 bg-cream/40 p-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-wine">Written by</p>
          <p className="font-serif font-bold text-lg text-zinc-900">{post.author_name}</p>
          <p className="text-xs text-zinc-600 mt-1">Timeless Tales Senior Literary Correspondent</p>
        </div>
        <Link to="/books" className="btn text-xs px-5 py-2.5 flex-shrink-0">
          Explore Books
        </Link>
      </div>
    </article>
  )
}
