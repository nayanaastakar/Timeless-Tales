import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Send, CheckCircle, HelpCircle, Mail, Phone, MapPin } from 'lucide-react'
import { contentApi } from '../lib/api'
import { useStore } from '../lib/store'

export default function Contact() {
  const { user } = useStore()
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [subject, setSubject] = useState('')
  const [category, setCategory] = useState('Orders & Delivery')
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await contentApi.supportTicket({ name, email, subject, category, message })
      setSubmitted(true)
    } catch (err: any) {
      setError(err?.message || 'Could not send support ticket.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-10">
      <div className="text-center space-y-2 max-w-lg mx-auto">
        <span className="text-xs font-bold uppercase tracking-wider text-wine">Customer Service Hub</span>
        <h1 className="font-serif text-3xl font-bold text-zinc-900">How Can We Help You?</h1>
        <p className="text-xs text-zinc-500">
          Our team is available 7 days a week to assist with order tracking, publisher partnerships, and literary queries.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-xl border border-zinc-200 bg-white p-5 text-center shadow-sm">
          <Mail className="mx-auto h-7 w-7 text-wine mb-2" />
          <h2 className="font-bold text-sm text-zinc-900">Email Care</h2>
          <p className="text-xs text-zinc-500 mt-1">support@timelesstales.com</p>
          <p className="text-[11px] text-zinc-400 mt-0.5">Response within 4 hours</p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5 text-center shadow-sm">
          <Phone className="mx-auto h-7 w-7 text-amber-500 mb-2" />
          <h2 className="font-bold text-sm text-zinc-900">Customer Helpline</h2>
          <p className="text-xs text-zinc-500 mt-1">1800-419-BOOK (Toll Free)</p>
          <p className="text-[11px] text-zinc-400 mt-0.5">9:00 AM – 9:00 PM IST</p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5 text-center shadow-sm">
          <MapPin className="mx-auto h-7 w-7 text-emerald-600 mb-2" />
          <h2 className="font-bold text-sm text-zinc-900">Fulfillment Hub</h2>
          <p className="text-xs text-zinc-500 mt-1">Brigade Road, Bengaluru</p>
          <p className="text-[11px] text-zinc-400 mt-0.5">Karnataka 560025, India</p>
        </div>
      </div>

      {submitted ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-8 text-center space-y-3">
          <CheckCircle className="mx-auto h-12 w-12 text-emerald-600" />
          <h2 className="font-serif text-2xl font-bold text-zinc-900">Support Ticket Created</h2>
          <p className="text-xs text-zinc-600 max-w-sm mx-auto">
            Thank you for contacting us. We have received your query and an agent will reply to <strong>{email}</strong> shortly.
          </p>
          <button
            type="button"
            onClick={() => {
              setSubmitted(false)
              setSubject('')
              setMessage('')
            }}
            className="btn text-xs px-6 py-2"
          >
            Send Another Message
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white p-8 shadow-sm max-w-2xl mx-auto space-y-5">
          <h2 className="font-serif text-xl font-bold text-zinc-900 border-b pb-3">Submit a Support Ticket</h2>

          {error && (
            <div className="rounded bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-zinc-600 mb-1 font-semibold">Your Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input text-xs"
                />
              </div>
              <div>
                <label className="block text-zinc-600 mb-1 font-semibold">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-zinc-600 mb-1 font-semibold">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="input text-xs"
                >
                  <option value="Orders & Delivery">Orders & Delivery</option>
                  <option value="Payments & Invoices">Payments & Invoices</option>
                  <option value="Returns & Replacements">Returns & Replacements</option>
                  <option value="Account & Library">Account & Library</option>
                  <option value="Author & Publisher Inquiries">Author & Publisher Inquiries</option>
                </select>
              </div>
              <div>
                <label className="block text-zinc-600 mb-1 font-semibold">Subject</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Inquiring about delivery tracking"
                  className="input text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-zinc-600 mb-1 font-semibold">Message</label>
              <textarea
                required
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Please describe your question or issue in detail..."
                className="input text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn text-xs px-6 py-2.5 flex items-center justify-center gap-2 font-bold"
            >
              <Send size={14} /> {submitting ? 'Submitting...' : 'Submit Support Ticket'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
