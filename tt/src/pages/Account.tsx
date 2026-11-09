import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Package, MapPin, Heart, BookOpen, ShieldCheck,
  User, Plus, Trash2, Edit3, Key, Check, AlertCircle
} from 'lucide-react'
import { useStore } from '../lib/store'
import { addressApi, authApi, type Address } from '../lib/api'

export default function Account() {
  const { user, addresses, refreshUserData } = useStore()

  const [activeTab, setActiveTab] = useState<'overview' | 'addresses' | 'security'>('overview')
  const [editingName, setEditingName] = useState(user?.name || '')
  const [editingPhone, setEditingPhone] = useState(user?.phone || '')
  const [newPassword, setNewPassword] = useState('')
  const [profileSuccess, setProfileSuccess] = useState('')

  // New Address modal state
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [newAddr, setNewAddr] = useState<Omit<Address, 'id'>>({
    full_name: user?.name || '',
    phone: user?.phone || '',
    street_address: '',
    landmark: '',
    city: 'Bengaluru',
    state: 'Karnataka',
    postal_code: '560025',
    country: 'India',
    is_default: false,
  })

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileSuccess('')
    try {
      await authApi.updateProfile({
        name: editingName,
        phone: editingPhone,
        password: newPassword || undefined,
      })
      await refreshUserData()
      setProfileSuccess('Profile details updated successfully.')
      setNewPassword('')
    } catch (err: any) {
      alert(err?.message || 'Could not update profile.')
    }
  }

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await addressApi.create(newAddr)
      await refreshUserData()
      setShowAddressForm(false)
      setNewAddr({
        full_name: user?.name || '',
        phone: user?.phone || '',
        street_address: '',
        landmark: '',
        city: 'Bengaluru',
        state: 'Karnataka',
        postal_code: '560025',
        country: 'India',
        is_default: false,
      })
    } catch (err: any) {
      alert(err?.message || 'Could not add address.')
    }
  }

  const handleDeleteAddress = async (id: string) => {
    if (confirm('Delete this address?')) {
      await addressApi.delete(id)
      await refreshUserData()
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-8">
      <div>
        <nav className="text-xs text-zinc-500 mb-2">
          <Link to="/" className="hover:text-wine">Home</Link>
          <span> / </span>
          <span className="text-zinc-800 font-medium">Your Account</span>
        </nav>
        <h1 className="font-serif text-3xl font-bold text-zinc-900">Your Account</h1>
        <p className="text-xs text-zinc-500 mt-1">Manage orders, delivery addresses, security, and personal digital library</p>
      </div>

      {profileSuccess && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 flex items-center gap-2">
          <Check size={16} /> {profileSuccess}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-3 border-b border-zinc-200 pb-3 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-1.5 rounded-full font-medium transition-colors ${
            activeTab === 'overview' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'
          }`}
        >
          Account Overview
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('addresses')}
          className={`px-4 py-1.5 rounded-full font-medium transition-colors ${
            activeTab === 'addresses' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'
          }`}
        >
          Your Addresses ({addresses.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`px-4 py-1.5 rounded-full font-medium transition-colors ${
            activeTab === 'security' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'
          }`}
        >
          Login & Security
        </button>
      </div>

      {/* TAB 1: Overview Cards */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <Link to="/orders" className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm hover:border-wine hover:shadow-md transition-all flex gap-4 items-start">
            <div className="rounded-lg bg-amber-100 p-3 text-amber-800">
              <Package size={24} />
            </div>
            <div>
              <h2 className="font-serif font-bold text-base text-zinc-900">Your Orders</h2>
              <p className="text-xs text-zinc-500 mt-1">Track packages, cancel orders, or request returns</p>
            </div>
          </Link>

          <Link to="/library" className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm hover:border-wine hover:shadow-md transition-all flex gap-4 items-start">
            <div className="rounded-lg bg-emerald-100 p-3 text-emerald-800">
              <BookOpen size={24} />
            </div>
            <div>
              <h2 className="font-serif font-bold text-base text-zinc-900">Your Digital Library</h2>
              <p className="text-xs text-zinc-500 mt-1">Your bookshelf of purchased titles & sample reader</p>
            </div>
          </Link>

          <Link to="/wishlist" className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm hover:border-wine hover:shadow-md transition-all flex gap-4 items-start">
            <div className="rounded-lg bg-rose-100 p-3 text-rose-800">
              <Heart size={24} />
            </div>
            <div>
              <h2 className="font-serif font-bold text-base text-zinc-900">Your Wishlist</h2>
              <p className="text-xs text-zinc-500 mt-1">View saved titles & move to cart anytime</p>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setActiveTab('addresses')}
            className="text-left rounded-xl border border-zinc-200 bg-white p-5 shadow-sm hover:border-wine hover:shadow-md transition-all flex gap-4 items-start"
          >
            <div className="rounded-lg bg-blue-100 p-3 text-blue-800">
              <MapPin size={24} />
            </div>
            <div>
              <h2 className="font-serif font-bold text-base text-zinc-900">Your Addresses</h2>
              <p className="text-xs text-zinc-500 mt-1">Edit addresses for orders and gift deliveries</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className="text-left rounded-xl border border-zinc-200 bg-white p-5 shadow-sm hover:border-wine hover:shadow-md transition-all flex gap-4 items-start"
          >
            <div className="rounded-lg bg-purple-100 p-3 text-purple-800">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h2 className="font-serif font-bold text-base text-zinc-900">Login & Security</h2>
              <p className="text-xs text-zinc-500 mt-1">Edit name, mobile number, and password</p>
            </div>
          </button>

          <Link to="/faq" className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm hover:border-wine hover:shadow-md transition-all flex gap-4 items-start">
            <div className="rounded-lg bg-zinc-100 p-3 text-zinc-800">
              <User size={24} />
            </div>
            <div>
              <h2 className="font-serif font-bold text-base text-zinc-900">Customer Support</h2>
              <p className="text-xs text-zinc-500 mt-1">Submit support tickets, FAQs & return policies</p>
            </div>
          </Link>
        </div>
      )}

      {/* TAB 2: Addresses */}
      {activeTab === 'addresses' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-bold text-zinc-900">Your Delivery Addresses</h2>
            <button
              type="button"
              onClick={() => setShowAddressForm(!showAddressForm)}
              className="btn text-xs px-4 py-2 flex items-center gap-1.5"
            >
              <Plus size={14} /> Add New Address
            </button>
          </div>

          {showAddressForm && (
            <form onSubmit={handleCreateAddress} className="rounded-xl border border-wine/20 bg-white p-6 shadow-sm space-y-4 text-xs">
              <h3 className="font-bold text-zinc-900 text-sm">Add New Address</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-600 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={newAddr.full_name}
                    onChange={(e) => setNewAddr({ ...newAddr, full_name: e.target.value })}
                    className="input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-zinc-600 mb-1">Mobile Number</label>
                  <input
                    type="tel"
                    required
                    value={newAddr.phone}
                    onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })}
                    className="input text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-600 mb-1">Street Address</label>
                <input
                  type="text"
                  required
                  value={newAddr.street_address}
                  onChange={(e) => setNewAddr({ ...newAddr, street_address: e.target.value })}
                  className="input text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-zinc-600 mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={newAddr.city}
                    onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                    className="input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-zinc-600 mb-1">State</label>
                  <input
                    type="text"
                    required
                    value={newAddr.state}
                    onChange={(e) => setNewAddr({ ...newAddr, state: e.target.value })}
                    className="input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-zinc-600 mb-1">PIN Code</label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={newAddr.postal_code}
                    onChange={(e) => setNewAddr({ ...newAddr, postal_code: e.target.value })}
                    className="input text-xs"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="submit" className="btn text-xs px-5 py-2">
                  Save Address
                </button>
                <button type="button" onClick={() => setShowAddressForm(false)} className="btn-outline text-xs px-4 py-2">
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {addresses.map((addr) => (
              <div key={addr.id} className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm text-xs space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-zinc-900 text-sm">{addr.full_name}</span>
                    {addr.is_default && (
                      <span className="text-[10px] bg-zinc-200 px-2 py-0.5 rounded font-medium">Default</span>
                    )}
                  </div>
                  <p className="text-zinc-600">{addr.street_address}</p>
                  <p className="text-zinc-600">{addr.city}, {addr.state} - {addr.postal_code}</p>
                  <p className="text-zinc-500 font-mono mt-2">Phone: {addr.phone}</p>
                </div>
                <div className="pt-3 border-t flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => handleDeleteAddress(addr.id)}
                    className="text-rose-700 hover:underline flex items-center gap-1"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Login & Security */}
      {activeTab === 'security' && (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm max-w-lg space-y-5 text-xs">
          <h2 className="font-serif text-xl font-bold text-zinc-900 border-b pb-3">Personal & Security Settings</h2>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-zinc-600 mb-1 font-semibold">Name</label>
              <input
                type="text"
                required
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                className="input text-xs"
              />
            </div>

            <div>
              <label className="block text-zinc-600 mb-1 font-semibold">Email Address</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="input text-xs bg-zinc-100 cursor-not-allowed text-zinc-500"
              />
              <span className="text-[10px] text-zinc-400">Email cannot be changed directly for security.</span>
            </div>

            <div>
              <label className="block text-zinc-600 mb-1 font-semibold">Mobile Number</label>
              <input
                type="tel"
                value={editingPhone}
                onChange={(e) => setEditingPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="input text-xs"
              />
            </div>

            <div>
              <label className="block text-zinc-600 mb-1 font-semibold">New Password (leave blank to keep current)</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="input text-xs"
              />
            </div>

            <button type="submit" className="btn text-xs px-6 py-2.5 font-bold">
              Save Changes
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
