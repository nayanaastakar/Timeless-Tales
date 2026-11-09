import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  addressApi,
  authApi,
  bookApi,
  cartApi,
  getAccessToken,
  setAccessToken,
  wishlistApi,
  type Address,
  type Book,
  type CartItem,
  type CartResponse,
  type User,
} from './api'

interface DeliveryLocation {
  city: string
  postalCode: string
  label: string
}

interface Store {
  cart: Record<string, number>
  cartItems: CartItem[]
  savedForLaterItems: CartItem[]
  cartSubtotal: number
  cartShippingFee: number
  cartTotal: number
  freeShippingThreshold: number
  amountNeededForFreeShipping: number
  wish: string[]
  wishBooks: Book[]
  user: User | null
  addresses: Address[]
  deliveryLocation: DeliveryLocation
  setDeliveryLocation: (loc: DeliveryLocation) => void
  error: string
  ready: boolean
  count: number
  add: (id: string, quantity?: number, format?: string) => Promise<boolean>
  setQty: (itemId: string, quantity: number) => Promise<void>
  saveForLater: (itemId: string) => Promise<void>
  moveToCartFromSaved: (itemId: string) => Promise<void>
  moveToWishlist: (itemId: string) => Promise<void>
  moveToCart: (bookId: string) => Promise<void>
  clearCart: () => Promise<void>
  toggleWish: (id: string) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string, phone?: string) => Promise<void>
  logout: () => void
  refreshUserData: () => Promise<void>
  clearError: () => void
}

const Ctx = createContext<Store | null>(null)

function readLocal<T>(key: string, fallback: T): T {
  try {
    const val = localStorage.getItem(key)
    return val ? (JSON.parse(val) as T) : fallback
  } catch {
    return fallback
  }
}

function computeGuestCart(items: CartItem[]): CartResponse {
  const activeItems = items.filter(it => !it.saved_for_later)
  const savedItems = items.filter(it => it.saved_for_later)
  const subtotal = activeItems.reduce((acc, it) => acc + it.lineTotal, 0)
  const freeThreshold = 499
  const shippingFee = subtotal >= freeThreshold || subtotal === 0 ? 0 : 40
  const total = subtotal + shippingFee
  const amountNeeded = Math.max(0, freeThreshold - subtotal)

  return {
    items: activeItems,
    savedForLater: savedItems,
    subtotal,
    shippingFee,
    freeShippingThreshold: freeThreshold,
    amountNeededForFreeShipping: amountNeeded,
    total,
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [savedForLaterItems, setSavedForLaterItems] = useState<CartItem[]>([])
  const [cartSubtotal, setCartSubtotal] = useState(0)
  const [cartShippingFee, setCartShippingFee] = useState(0)
  const [cartTotal, setCartTotal] = useState(0)
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(499)
  const [amountNeededForFreeShipping, setAmountNeededForFreeShipping] = useState(499)
  const [wish, setWish] = useState<string[]>(() => readLocal('tt.wish', []))
  const [wishBooks, setWishBooks] = useState<Book[]>([])
  const [user, setUser] = useState<User | null>(() => readLocal('tt.user', null))
  const [addresses, setAddresses] = useState<Address[]>([])
  const [deliveryLocation, setDeliveryLocation] = useState<DeliveryLocation>(() =>
    readLocal('tt.location', { city: 'Bengaluru', postalCode: '560025', label: 'Deliver to Bengaluru 560025' })
  )
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)

  const applyCart = (res: CartResponse) => {
    setCartItems(res.items || [])
    setSavedForLaterItems(res.savedForLater || [])
    setCartSubtotal(res.subtotal || 0)
    setCartShippingFee(res.shippingFee || 0)
    setCartTotal(res.total || 0)
    setFreeShippingThreshold(res.freeShippingThreshold || 499)
    setAmountNeededForFreeShipping(res.amountNeededForFreeShipping || 0)
  }

  const loadUserData = async () => {
    try {
      const [u, c, w, addrs] = await Promise.all([
        authApi.me(),
        cartApi.get().catch(() => null),
        wishlistApi.get().catch(() => []),
        addressApi.list().catch(() => []),
      ])
      setUser(u)
      localStorage.setItem('tt.user', JSON.stringify(u))
      if (c) applyCart(c)
      setWishBooks(w)
      setWish(w.map(b => b.id))
      setAddresses(addrs)

      const defAddr = addrs.find(a => a.is_default) || addrs[0]
      if (defAddr) {
        const loc = {
          city: defAddr.city,
          postalCode: defAddr.postal_code,
          label: `Deliver to ${defAddr.city} ${defAddr.postal_code}`,
        }
        setDeliveryLocation(loc)
        localStorage.setItem('tt.location', JSON.stringify(loc))
      }
    } catch {
      setAccessToken(null)
      setUser(null)
      localStorage.removeItem('tt.user')
    }
  }

  useEffect(() => {
    const init = async () => {
      const token = getAccessToken()
      if (token) {
        await loadUserData()
      } else {
        // Guest mode - restore local guest cart if any
        const guestItems = readLocal<CartItem[]>('tt.guest_cart', [])
        if (guestItems.length > 0) {
          applyCart(computeGuestCart(guestItems))
        }
      }
      setReady(true)
    }
    init()
  }, [])

  const count = cartItems.reduce((acc, it) => acc + it.quantity, 0)
  const cartQtyMap: Record<string, number> = Object.fromEntries(
    cartItems.map(it => [it.book.id, it.quantity])
  )

  const add = async (id: string, quantity = 1, format = 'Paperback'): Promise<boolean> => {
    try {
      setError('')
      const token = getAccessToken()
      if (token) {
        const updated = await cartApi.add(id, quantity, format)
        applyCart(updated)
        return true
      }

      // Guest cart mode (supports offline & unauthenticated users)
      const book = await bookApi.get(id)
      if (!book) {
        setError('Could not retrieve book details.')
        return false
      }

      const current = readLocal<CartItem[]>('tt.guest_cart', [])
      const existingIdx = current.findIndex(
        it => it.book.id === id && it.selected_format === format && !it.saved_for_later
      )

      let updatedList: CartItem[]
      if (existingIdx >= 0) {
        updatedList = [...current]
        const newQty = updatedList[existingIdx].quantity + quantity
        updatedList[existingIdx] = {
          ...updatedList[existingIdx],
          quantity: newQty,
          lineTotal: updatedList[existingIdx].unitPrice * newQty,
        }
      } else {
        const unitPrice = book.price
        const newItem: CartItem = {
          id: `guest-${book.id}-${format}-${Date.now()}`,
          book,
          quantity,
          selected_format: format,
          saved_for_later: false,
          unitPrice,
          lineTotal: unitPrice * quantity,
        }
        updatedList = [...current, newItem]
      }

      localStorage.setItem('tt.guest_cart', JSON.stringify(updatedList))
      applyCart(computeGuestCart(updatedList))
      return true
    } catch (err: any) {
      setError(err?.message || 'Could not add to cart.')
      return false
    }
  }

  const setQty = async (itemId: string, quantity: number) => {
    try {
      setError('')
      const token = getAccessToken()
      if (token) {
        let updated: CartResponse
        if (quantity <= 0) {
          updated = await cartApi.remove(itemId)
        } else {
          updated = await cartApi.update(itemId, { quantity })
        }
        applyCart(updated)
        return
      }

      // Guest cart mode
      const current = readLocal<CartItem[]>('tt.guest_cart', [])
      let updatedList: CartItem[]
      if (quantity <= 0) {
        updatedList = current.filter(it => it.id !== itemId)
      } else {
        updatedList = current.map(it => {
          if (it.id === itemId) {
            return {
              ...it,
              quantity,
              lineTotal: it.unitPrice * quantity,
            }
          }
          return it
        })
      }
      localStorage.setItem('tt.guest_cart', JSON.stringify(updatedList))
      applyCart(computeGuestCart(updatedList))
    } catch (err: any) {
      setError(err?.message || 'Could not update quantity.')
    }
  }

  const saveForLater = async (itemId: string) => {
    try {
      setError('')
      const token = getAccessToken()
      if (token) {
        const updated = await cartApi.update(itemId, { saved_for_later: true })
        applyCart(updated)
        return
      }

      // Guest cart mode
      const current = readLocal<CartItem[]>('tt.guest_cart', [])
      const updatedList = current.map(it => {
        if (it.id === itemId) return { ...it, saved_for_later: true }
        return it
      })
      localStorage.setItem('tt.guest_cart', JSON.stringify(updatedList))
      applyCart(computeGuestCart(updatedList))
    } catch (err: any) {
      setError(err?.message || 'Could not save for later.')
    }
  }

  const moveToCartFromSaved = async (itemId: string) => {
    try {
      setError('')
      const token = getAccessToken()
      if (token) {
        const updated = await cartApi.update(itemId, { saved_for_later: false })
        applyCart(updated)
        return
      }

      // Guest cart mode
      const current = readLocal<CartItem[]>('tt.guest_cart', [])
      const updatedList = current.map(it => {
        if (it.id === itemId) return { ...it, saved_for_later: false }
        return it
      })
      localStorage.setItem('tt.guest_cart', JSON.stringify(updatedList))
      applyCart(computeGuestCart(updatedList))
    } catch (err: any) {
      setError(err?.message || 'Could not move to cart.')
    }
  }

  const moveToWishlist = async (itemId: string) => {
    try {
      setError('')
      const token = getAccessToken()
      if (token) {
        const updated = await cartApi.moveToWishlist(itemId)
        applyCart(updated)
        const w = await wishlistApi.get()
        setWishBooks(w)
        setWish(w.map(b => b.id))
      } else {
        await setQty(itemId, 0)
      }
    } catch (err: any) {
      setError(err?.message || 'Could not move to wishlist.')
    }
  }

  const clearCart = async () => {
    try {
      const token = getAccessToken()
      if (token) {
        const updated = await cartApi.clear()
        applyCart(updated)
      } else {
        localStorage.removeItem('tt.guest_cart')
        applyCart(computeGuestCart([]))
      }
    } catch (err: any) {
      setError(err?.message || 'Could not clear cart.')
    }
  }

  const toggleWish = async (id: string) => {
    try {
      setError('')
      const token = getAccessToken()
      if (!token) {
        setError('Please sign in to save books to your wishlist.')
        return
      }
      const inWish = wish.includes(id)
      const updated = inWish ? await wishlistApi.remove(id) : await wishlistApi.add(id)
      setWishBooks(updated)
      setWish(updated.map(b => b.id))
    } catch (err: any) {
      setError(err?.message || 'Could not update wishlist.')
    }
  }

  const moveToCart = async (bookId: string) => {
    const success = await add(bookId, 1)
    if (success) {
      await toggleWish(bookId)
    }
  }

  const login = async (email: string, pass: string) => {
    setError('')
    const res = await authApi.login(email, pass)
    setAccessToken(res.token)
    setUser(res.user)
    localStorage.setItem('tt.user', JSON.stringify(res.user))

    // Transfer guest cart items into user's account cart
    const guestCart = readLocal<CartItem[]>('tt.guest_cart', [])
    if (guestCart.length > 0) {
      for (const item of guestCart) {
        if (!item.saved_for_later) {
          try {
            await cartApi.add(item.book.id, item.quantity, item.selected_format)
          } catch {}
        }
      }
      localStorage.removeItem('tt.guest_cart')
    }

    await loadUserData()
  }

  const register = async (name: string, email: string, pass: string, phone = '') => {
    setError('')
    const res = await authApi.register(name, email, pass, phone)
    setAccessToken(res.token)
    setUser(res.user)
    localStorage.setItem('tt.user', JSON.stringify(res.user))

    // Transfer guest cart items into user's account cart
    const guestCart = readLocal<CartItem[]>('tt.guest_cart', [])
    if (guestCart.length > 0) {
      for (const item of guestCart) {
        if (!item.saved_for_later) {
          try {
            await cartApi.add(item.book.id, item.quantity, item.selected_format)
          } catch {}
        }
      }
      localStorage.removeItem('tt.guest_cart')
    }

    await loadUserData()
  }

  const logout = () => {
    setAccessToken(null)
    setUser(null)
    setCartItems([])
    setSavedForLaterItems([])
    setCartSubtotal(0)
    setCartTotal(0)
    setWish([])
    setWishBooks([])
    setAddresses([])
    localStorage.removeItem('tt.user')
    localStorage.removeItem('tt.guest_cart')
  }

  const refreshUserData = async () => {
    if (getAccessToken()) {
      await loadUserData()
    }
  }

  const clearError = () => setError('')

  const handleSetDeliveryLocation = (loc: DeliveryLocation) => {
    setDeliveryLocation(loc)
    localStorage.setItem('tt.location', JSON.stringify(loc))
  }

  return (
    <Ctx.Provider
      value={{
        cart: cartQtyMap,
        cartItems,
        savedForLaterItems,
        cartSubtotal,
        cartShippingFee,
        cartTotal,
        freeShippingThreshold,
        amountNeededForFreeShipping,
        wish,
        wishBooks,
        user,
        addresses,
        deliveryLocation,
        setDeliveryLocation: handleSetDeliveryLocation,
        error,
        ready,
        count,
        add,
        setQty,
        saveForLater,
        moveToCartFromSaved,
        moveToWishlist,
        moveToCart,
        clearCart,
        toggleWish,
        login,
        register,
        logout,
        refreshUserData,
        clearError,
      }}
    >
      {children}
    </Ctx.Provider>
  )
}

export function useStore(): Store {
  const store = useContext(Ctx)
  if (!store) throw new Error('useStore must be inside StoreProvider')
  return store
}
