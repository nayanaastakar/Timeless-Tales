import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useStore } from '../lib/store'

export default function Auth({ mode }: { mode: 'login' | 'register' }) {
  const isRegister = mode === 'register'
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [searchParams] = useSearchParams()
  const redirectTarget = searchParams.get('redirect') || '/account'
  const { login, register } = useStore()
  const navigate = useNavigate()

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    const form = new FormData(event.currentTarget)
    const name = String(form.get('name') || '').trim()
    const email = String(form.get('email') || '').trim()
    const password = String(form.get('password') || '')
    const confirmPassword = String(form.get('confirmPassword') || '')
    if (isRegister && name.length < 2) return setError('Name must contain at least 2 characters.')
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Enter a valid email address.')
    if (password.length < 8 || password.length > 72) return setError('Password must be between 8 and 72 characters.')
    if (isRegister && password !== confirmPassword) return setError('The passwords do not match.')

    setBusy(true)
    try {
      if (isRegister) await register(name, email, password)
      else await login(email, password)
      navigate(redirectTarget, { replace: true })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not complete your request.')
    } finally {
      setBusy(false)
    }
  }

  return <form onSubmit={submit} className="mx-auto max-w-md space-y-4 rounded-2xl bg-cream p-6 sm:p-8 shadow-sm border border-stone-200">
    <div>
      <p className="text-xs uppercase tracking-wider font-semibold text-gold">Timeless Tales Account</p>
      <h1 className="mt-1 text-2xl sm:text-3xl font-bold font-serif text-ink">{isRegister ? 'Create your account' : 'Sign in to Timeless Tales'}</h1>
      <p className="mt-2 text-sm text-ink/70">{isRegister ? 'Save your wishlist, track orders, and build your personal library.' : 'Sign in to sync your cart, wishlist, and delivery addresses.'}</p>
    </div>
    {redirectTarget.includes('checkout') && (
      <div className="rounded-lg bg-teal-50 border border-teal-300 p-3 text-xs text-teal-900 font-medium shadow-sm">
        Please sign in or create an account to complete your purchase. Your item is saved in your cart and will be ready for instant checkout.
      </div>
    )}
    {isRegister && <label className="block text-sm font-medium">Your Name
      <input name="name" className="input mt-1" autoComplete="name" required minLength={2} maxLength={120} placeholder="First and last name" />
    </label>}
    <label className="block text-sm font-medium">Email Address
      <input name="email" type="email" className="input mt-1" autoComplete="email" required maxLength={254} placeholder="name@example.com" />
    </label>
    <label className="block text-sm font-medium">Password
      <span className="relative mt-1 block">
        <input name="password" type={showPassword ? 'text' : 'password'} className="input pr-12" autoComplete={isRegister ? 'new-password' : 'current-password'} required minLength={8} maxLength={72} placeholder="At least 8 characters" />
        <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-2 text-ink/60 hover:text-ink" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(value => !value)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
      </span>
    </label>
    {isRegister && <label className="block text-sm font-medium">Confirm Password
      <input name="confirmPassword" type={showPassword ? 'text' : 'password'} className="input mt-1" autoComplete="new-password" required minLength={8} maxLength={72} placeholder="Re-enter password" />
    </label>}
    {error && <p role="alert" className="rounded-lg border border-wine/20 bg-wine/5 p-3 text-sm text-wine font-medium">{error}</p>}
    <button className="btn w-full !py-2.5 shadow-sm" disabled={busy}>{busy ? 'Please wait…' : isRegister ? 'Create your Timeless Tales account' : 'Sign In'}</button>
    
    <div className="pt-2 text-center text-xs text-ink/60">
      By continuing, you agree to Timeless Tales' <Link to="/about" className="text-wine underline">Terms of Use</Link> and <Link to="/about" className="text-wine underline">Privacy Notice</Link>.
    </div>

    <div className="relative my-4 text-center">
      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-stone-200"></div></div>
      <span className="relative bg-cream px-3 text-xs text-ink/50 uppercase tracking-wider">{isRegister ? 'Existing customer?' : 'New to Timeless Tales?'}</span>
    </div>

    <p className="text-center text-sm">
      {isRegister ? (
        <>Already have an account? <Link to={redirectTarget !== '/account' ? `/login?redirect=${encodeURIComponent(redirectTarget)}` : '/login'} className="text-wine font-semibold hover:underline">Sign in</Link></>
      ) : (
        <Link to={redirectTarget !== '/account' ? `/register?redirect=${encodeURIComponent(redirectTarget)}` : '/register'} className="btn-ghost block w-full text-center">Create your Timeless Tales account</Link>
      )}
    </p>
  </form>
}
