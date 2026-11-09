import { useState } from 'react'
import { BookOpen, Sparkles } from 'lucide-react'

interface BookCoverProps {
  coverUrl?: string
  isbn13?: string
  title: string
  author: string
  genre?: string
  className?: string
  alt?: string
}

const GENRE_PALETTES: Record<string, { bg: string; spine: string; border: string; accent: string }> = {
  fiction: {
    bg: 'from-[#0C3B38] via-[#092B28] to-[#041615]',
    spine: 'from-black/60 via-black/20 to-transparent',
    border: 'border-teal-500/30',
    accent: 'text-teal-300',
  },
  mystery: {
    bg: 'from-[#1A2530] via-[#0F171E] to-[#06090D]',
    spine: 'from-black/70 via-black/30 to-transparent',
    border: 'border-slate-500/30',
    accent: 'text-cyan-300',
  },
  growth: {
    bg: 'from-[#0E3E34] via-[#082822] to-[#031310]',
    spine: 'from-black/60 via-black/20 to-transparent',
    border: 'border-emerald-500/30',
    accent: 'text-emerald-300',
  },
  business: {
    bg: 'from-[#162B3D] via-[#0D1C28] to-[#050D14]',
    spine: 'from-black/65 via-black/25 to-transparent',
    border: 'border-blue-500/30',
    accent: 'text-sky-300',
  },
  tech: {
    bg: 'from-[#0B3338] via-[#062024] to-[#021012]',
    spine: 'from-black/60 via-black/20 to-transparent',
    border: 'border-cyan-500/30',
    accent: 'text-teal-200',
  },
  regional: {
    bg: 'from-[#2D1B2D] via-[#1E111E] to-[#0F070F]',
    spine: 'from-black/65 via-black/25 to-transparent',
    border: 'border-rose-400/30',
    accent: 'text-amber-300',
  },
  default: {
    bg: 'from-[#0E3532] via-[#092422] to-[#041312]',
    spine: 'from-black/60 via-black/20 to-transparent',
    border: 'border-teal-500/30',
    accent: 'text-teal-300',
  },
}

function getPalette(genre = '') {
  const g = genre.toLowerCase()
  if (g.includes('myst') || g.includes('thril') || g.includes('crime')) return GENRE_PALETTES.mystery
  if (g.includes('self') || g.includes('psych') || g.includes('habit')) return GENRE_PALETTES.growth
  if (g.includes('busin') || g.includes('econ') || g.includes('money')) return GENRE_PALETTES.business
  if (g.includes('comp') || g.includes('tech') || g.includes('eng')) return GENRE_PALETTES.tech
  if (g.includes('kannada') || g.includes('region')) return GENRE_PALETTES.regional
  if (g.includes('fict') || g.includes('liter')) return GENRE_PALETTES.fiction
  return GENRE_PALETTES.default
}

export default function BookCover({
  coverUrl,
  isbn13,
  title,
  author,
  genre = '',
  className = 'h-full w-full object-cover',
  alt,
}: BookCoverProps) {
  // If coverUrl is not provided or empty, immediately render the custom artistic book cover
  const validCoverUrl = coverUrl && coverUrl.trim().length > 0 ? coverUrl.trim() : null
  const [useFallback, setUseFallback] = useState(!validCoverUrl)

  const handleImageError = () => {
    setUseFallback(true)
  }

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    // Detect Google Books placeholder (128x192 JPEG with "image not available")
    // or Open Library / generic tiny placeholder (<= 10x10)
    const isGooglePlaceholder = img.src.includes('books.google.com') && (
      img.naturalWidth <= 1 ||
      (img.naturalWidth === 128 && img.naturalHeight === 192)
    )
    const isGenericSmall = img.naturalWidth <= 10 || img.naturalHeight <= 10

    if (isGooglePlaceholder || isGenericSmall) {
      setUseFallback(true)
    }
  }

  if (useFallback || !validCoverUrl) {
    const palette = getPalette(genre)
    return (
      <div
        className={`relative h-full w-full overflow-hidden rounded bg-gradient-to-br ${palette.bg} p-3 sm:p-3.5 flex flex-col justify-between text-white shadow-inner select-none transition-all`}
        style={{ minHeight: '140px' }}
      >
        {/* Book spine lighting & 3D shadow on left */}
        <div className={`absolute top-0 bottom-0 left-0 w-3 sm:w-4 bg-gradient-to-r ${palette.spine} pointer-events-none z-10`} />
        
        {/* Subtle cloth/paper grain overlay */}
        <div className="absolute inset-0 bg-white/[0.02] mix-blend-overlay pointer-events-none" />

        {/* Decorative embossed border frame */}
        <div className={`relative border ${palette.border} rounded p-2 sm:p-2.5 h-full flex flex-col justify-between z-10`}>
          <div>
            {/* Header chip: Genre & Icon */}
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[8px] sm:text-[9px] uppercase tracking-wider font-bold ${palette.accent} truncate max-w-[85px]`}>
                {genre || 'Timeless Tales'}
              </span>
              <BookOpen size={11} className={`${palette.accent} shrink-0 opacity-80`} />
            </div>

            {/* Book Title */}
            <h3 className="font-serif font-bold text-xs sm:text-sm md:text-base leading-tight text-white line-clamp-3 tracking-tight">
              {title}
            </h3>

            {/* Decorative divider flourish */}
            <div className="my-1.5 flex items-center gap-1 opacity-40">
              <div className="h-[1px] flex-1 bg-current" />
              <Sparkles size={8} className={palette.accent} />
              <div className="h-[1px] flex-1 bg-current" />
            </div>
          </div>

          {/* Bottom section: Author and Edition seal */}
          <div className="pt-2 border-t border-white/10 mt-auto">
            <p className="text-[10px] sm:text-[11px] text-zinc-200 font-medium truncate">
              {author}
            </p>
            <div className="flex items-center justify-between mt-1 text-[8px] font-mono tracking-widest uppercase">
              <span className={`${palette.accent} font-semibold`}>Timeless Tales</span>
              <span className="text-zinc-400">Classic</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <img
      src={validCoverUrl}
      alt={alt || title}
      loading="lazy"
      onLoad={handleImageLoad}
      onError={handleImageError}
      className={className}
    />
  )
}
