import { Link } from 'react-router-dom'
import { BookOpen, ShieldCheck, Heart, Award, Users } from 'lucide-react'

export default function About() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-12">
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-widest text-wine">Our Story & Mission</span>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-zinc-900">
          Where Every Book Opens a New World
        </h1>
        <p className="text-sm text-zinc-600 leading-relaxed">
          Founded in Bengaluru, Timeless Tales was born with a singular conviction: that a great online bookstore should combine the technological discovery and logistical depth of a commercial powerhouse with the soul, curatorial warmth, and regional reverence of a master literary salon.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm text-center space-y-2">
          <BookOpen className="mx-auto h-8 w-8 text-amber-500" />
          <h2 className="font-serif font-bold text-lg text-zinc-900">100% Genuine Curation</h2>
          <p className="text-xs text-zinc-600 leading-relaxed">
            Every title in our catalogue is sourced from verified publishers with standardized ISBNs, authentic typography, and quality bindings.
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm text-center space-y-2">
          <Award className="mx-auto h-8 w-8 text-wine" />
          <h2 className="font-serif font-bold text-lg text-zinc-900">Regional Literature First</h2>
          <p className="text-xs text-zinc-600 leading-relaxed">
            We champion Indian regional writing—from Kannada classics by Poornachandra Tejaswi and S.L. Bhyrappa to translated masterpieces.
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm text-center space-y-2">
          <ShieldCheck className="mx-auto h-8 w-8 text-emerald-600" />
          <h2 className="font-serif font-bold text-lg text-zinc-900">Fast Pan-India Delivery</h2>
          <p className="text-xs text-zinc-600 leading-relaxed">
            Partnered with premier express fulfillment networks delivering to all 28 states and union territories with 7-day easy returns.
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-ivory border border-wine/15 p-8 sm:p-12 space-y-4 font-serif text-zinc-800 leading-relaxed">
        <h2 className="text-2xl font-bold text-zinc-900">The Timeless Tales Philosophy</h2>
        <p>
          In an era of fleeting social feeds and automated algorithms, deep reading remains the quintessential human superpower. A physical book is not merely printed paper; it is a direct line into another consciousness across oceans and centuries.
        </p>
        <p>
          Whether you are an engineering student preparing for competitive examinations, a curious soul rediscovering Marcus Aurelius, or a collector seeking rare editions of Salman Rushdie and Poornachandra Tejaswi, Timeless Tales is built to serve your reading journey.
        </p>
        <div className="pt-4 flex gap-4">
          <Link to="/books" className="btn text-xs px-6 py-2.5 font-sans font-bold">
            Explore the Bookstore
          </Link>
          <Link to="/contact" className="btn-outline text-xs px-6 py-2.5 font-sans font-bold">
            Get in Touch
          </Link>
        </div>
      </div>
    </div>
  )
}
