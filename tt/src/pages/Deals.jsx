import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Percent,
  Copy,
  Check,
  Flame,
  ArrowRight
} from "lucide-react";
import { bookApi } from "../lib/api";
import BookCard from "../components/BookCard";
const PROMOTIONAL_COUPONS = [
  { code: "WELCOME10", discount: "10% OFF", desc: "On orders above \u20B9499 for first time readers", min: 499 },
  { code: "READ50", discount: "Flat \u20B9150 OFF", desc: "Exclusive savings on orders above \u20B9299", min: 299 },
  { code: "FESTIVE100", discount: "20% OFF", desc: "Festive literary festival discount on orders over \u20B9899", min: 899 },
  { code: "BOOKLOVER20", discount: "20% OFF", desc: "Special collector discount on orders above \u20B91,000", min: 1e3 }
];
export default function Deals() {
  const [deals, setDeals] = useState([]);
  const [under199, setUnder199] = useState([]);
  const [under299, setUnder299] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(null);
  useEffect(() => {
    Promise.all([
      bookApi.list({ deals: true, size: 12 }),
      bookApi.list({ maxPrice: 199, size: 6 }),
      bookApi.list({ maxPrice: 299, minPrice: 200, size: 6 })
    ]).then(([d, u1, u2]) => {
      setDeals(d.content || []);
      setUnder199(u1.content || []);
      setUnder299(u2.content || []);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, []);
  const copyCoupon = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2e3);
  };
  return <div className="mx-auto max-w-7xl px-4 py-8 space-y-10">
      {
    /* Deals Header Banner */
  }
      <div className="rounded-2xl bg-gradient-to-r from-[#6D1A2E] via-[#4E1121] to-[#2B0912] p-8 sm:p-12 text-white shadow-lg relative overflow-hidden">
        <div className="max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-400/20 px-3 py-1 text-xs font-bold text-amber-300 uppercase tracking-wider mb-3">
            <Flame size={14} /> Today's Exclusive Book Fair
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold leading-tight">
            Today's Deals & Limited-Time Book Offers
          </h1>
          <p className="text-sm sm:text-base text-zinc-200 mt-2">
            Save up to 50% on verified hardcovers, paperbacks, and digital editions with free delivery on orders over ₹499.
          </p>
        </div>
      </div>

      {
    /* Promotional Coupon Vouchers Grid */
  }
      <section className="space-y-4">
        <h2 className="font-serif text-2xl font-bold text-zinc-900 flex items-center gap-2">
          <Percent size={20} className="text-wine" /> Active Discount Coupons
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {PROMOTIONAL_COUPONS.map((cp) => <div key={cp.code} className="rounded-xl border border-dashed border-wine/30 bg-white p-4 shadow-sm flex flex-col justify-between space-y-3">
              <div>
                <span className="font-mono font-bold text-base text-wine-dark bg-wine/10 px-2.5 py-1 rounded inline-block">
                  {cp.code}
                </span>
                <p className="font-serif font-bold text-lg text-zinc-900 mt-2">{cp.discount}</p>
                <p className="text-xs text-zinc-500 mt-1">{cp.desc}</p>
              </div>
              <button
    type="button"
    onClick={() => copyCoupon(cp.code)}
    className="w-full btn-outline text-xs py-1.5 flex items-center justify-center gap-1.5"
  >
                {copiedCode === cp.code ? <><Check size={13} className="text-emerald-600" /> Copied!</> : <><Copy size={13} /> Copy Code</>}
              </button>
            </div>)}
        </div>
      </section>

      {
    /* Today's Featured Deals Grid */
  }
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <h2 className="font-serif text-2xl font-bold text-zinc-900">Featured Deals of the Day</h2>
            <p className="text-xs text-zinc-500">Hand-curated bestselling discounts across all genres</p>
          </div>
        </div>

        {loading ? <div className="py-20 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-wine border-r-transparent" />
          </div> : deals.length > 0 ? <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {deals.map((b) => <BookCard key={b.id} book={b} />)}
          </div> : <p className="text-xs text-zinc-500">All deals claimed for today. Check back tomorrow!</p>}
      </section>

      {
    /* Books Under ₹199 */
  }
      {under199.length > 0 && <section className="space-y-4 rounded-xl border border-wine/10 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h2 className="font-serif text-2xl font-bold text-zinc-900">Pocket Reads: Books Under ₹199</h2>
              <p className="text-xs text-zinc-500">Great literature for the price of a coffee</p>
            </div>
            <Link to="/books?maxPrice=199" className="text-xs font-semibold text-wine hover:underline flex items-center gap-1">
              View all under ₹199 <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {under199.map((b) => <BookCard key={b.id} book={b} />)}
          </div>
        </section>}

      {
    /* Books Under ₹299 */
  }
      {under299.length > 0 && <section className="space-y-4 rounded-xl border border-wine/10 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h2 className="font-serif text-2xl font-bold text-zinc-900">Best Values: Books Under ₹299</h2>
              <p className="text-xs text-zinc-500">Unbeatable prices on bestselling fiction & non-fiction</p>
            </div>
            <Link to="/books?maxPrice=299&minPrice=200" className="text-xs font-semibold text-wine hover:underline flex items-center gap-1">
              View all under ₹299 <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {under299.map((b) => <BookCard key={b.id} book={b} />)}
          </div>
        </section>}
    </div>;
}
