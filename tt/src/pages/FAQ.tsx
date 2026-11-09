import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { HelpCircle, ChevronDown, ChevronUp, Search } from 'lucide-react'
import { contentApi, type FAQItem } from '../lib/api'

export default function FAQ() {
  const [faqs, setFaqs] = useState<FAQItem[]>([])
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    contentApi.faqs().then((data) => {
      setFaqs(data)
      // Open the first two by default
      if (data.length > 0) {
        setOpenIds({ [data[0].id]: true, [data[1]?.id]: true })
      }
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })
  }, [])

  const toggle = (id: string) => {
    setOpenIds((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const filtered = faqs.filter((f) =>
    f.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.answer.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const categories = Array.from(new Set(filtered.map((f) => f.category)))

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-8">
      <div className="text-center space-y-2 max-w-lg mx-auto">
        <span className="text-xs font-bold uppercase tracking-wider text-wine">Help Centre</span>
        <h1 className="font-serif text-3xl font-bold text-zinc-900">Frequently Asked Questions</h1>
        <p className="text-xs text-zinc-500">
          Find answers about ordering, Indian PIN code delivery, returns, and your personal library.
        </p>

        <div className="relative pt-3">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search questions (e.g. refund, delivery time, COD)..."
            className="input pl-9 text-xs"
          />
          <Search size={15} className="absolute left-3 top-6 text-zinc-400" />
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-wine border-r-transparent" />
        </div>
      ) : categories.length > 0 ? (
        <div className="space-y-6">
          {categories.map((cat) => (
            <div key={cat} className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm space-y-3">
              <h2 className="font-serif text-xl font-bold text-zinc-900 border-b pb-2">{cat}</h2>
              <div className="divide-y divide-zinc-100">
                {filtered.filter((f) => f.category === cat).map((item) => {
                  const isOpen = Boolean(openIds[item.id])
                  return (
                    <div key={item.id} className="py-3">
                      <button
                        type="button"
                        onClick={() => toggle(item.id)}
                        className="w-full flex items-center justify-between text-left text-xs font-bold text-zinc-800 hover:text-wine py-1"
                      >
                        <span>{item.question}</span>
                        {isOpen ? <ChevronUp size={16} className="text-zinc-400" /> : <ChevronDown size={16} className="text-zinc-400" />}
                      </button>
                      {isOpen && (
                        <p className="text-xs text-zinc-600 mt-2 leading-relaxed pl-1">
                          {item.answer}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center text-xs text-zinc-500">
          No matching answers found. Try a different search keyword or contact customer support.
        </div>
      )}
    </div>
  )
}
