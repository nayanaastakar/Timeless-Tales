const BASE = (import.meta.env.VITE_API_URL as string | undefined)?.trim().replace(/\/$/, '') || 'http://localhost:8080'
const TOKEN_KEY = 'tt.accessToken'

export const backendConnected = true

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message)
    this.name = 'ApiError'
  }
}

export interface BookEdition {
  id: string
  format: string
  format_label: string
  price: number
  mrp: number
  isbn10?: string
  isbn13?: string
  stock: number
  page_count?: number
  is_available: boolean
  savings: number
  discount_percent: number
}

export interface BookImage {
  id: string
  image_url: string
  caption: string
  order: number
}

export interface Review {
  id: string
  book: string
  rating: number
  title: string
  comment: string
  is_verified_purchase: boolean
  helpful_votes: number
  user_name: string
  created_at: string
}

export interface RatingBreakdown {
  total: number
  stars: Record<number, { count: number; percentage: number }>
}

export interface Book {
  id: string
  slug: string
  title: string
  subtitle?: string
  author: string
  genre: string
  price: number
  mrp: number
  rating: number
  review_count: number
  year: number
  blurb: string
  description?: string
  hue?: number
  stock: number
  isbn10?: string
  isbn13?: string
  publisher_name?: string
  language?: string
  page_count?: number
  format?: string
  cover_url?: string
  is_bestseller?: boolean
  is_featured?: boolean
  is_new_release?: boolean
  deal_discount?: number
  reading_age?: string
  dimensions?: string
  weight?: string
  sample_text?: string
  editions?: BookEdition[]
  images?: BookImage[]
  savings?: number
  discount_percent?: number
  reviews?: Review[]
  rating_breakdown?: RatingBreakdown
  related_books?: Book[]
}

export interface Subcategory {
  id: number
  name: string
  slug: string
  book_count: number
}

export interface Department {
  id: number
  name: string
  slug: string
  description?: string
  book_count: number
  subcategories: Subcategory[]
}

export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export interface CartItem {
  id: string
  book: Book
  quantity: number
  selected_format: string
  saved_for_later: boolean
  unitPrice: number
  lineTotal: number
}

export interface CartResponse {
  items: CartItem[]
  savedForLater: CartItem[]
  subtotal: number
  shippingFee: number
  freeShippingThreshold: number
  amountNeededForFreeShipping: number
  total: number
}

export interface Address {
  id: string
  full_name: string
  phone: string
  street_address: string
  landmark?: string
  city: string
  state: string
  postal_code: string
  country: string
  is_default: boolean
}

export interface User {
  id: string
  name: string
  email: string
  phone?: string
  role: string
  is_staff?: boolean
  addresses?: Address[]
}

export interface AuthResponse {
  token: string
  user: User
}

export interface OrderItem {
  id: string
  title: string
  author: string
  format: string
  cover_url?: string
  quantity: number
  unitPrice: number
  lineTotal: number
}

export interface ReturnRequest {
  id: string
  reason: string
  status: string
  admin_response?: string
  created_at: string
}

export interface Order {
  id: string
  orderNumber: string
  status: string
  subtotal: number
  shippingFee: number
  discountAmount: number
  couponCode?: string
  total: number
  shippingAddress: Address | Record<string, string>
  deliverySpeed: string
  paymentMethod: string
  paymentStatus: string
  trackingNumber?: string
  estimatedDelivery?: string
  createdAt: string
  items: OrderItem[]
  returns?: ReturnRequest[]
}

export interface LibraryItem {
  id: string
  book: Book
  format: string
  reading_status: 'UNREAD' | 'READING' | 'FINISHED'
  current_page: number
  notes?: string
  purchased_at: string
}

export interface BlogPost {
  id: string
  title: string
  slug: string
  summary: string
  content: string
  cover_image_url?: string
  author_name: string
  category: string
  reading_time_minutes: number
  published_at: string
}

export interface FAQItem {
  id: string
  category: string
  question: string
  answer: string
  display_order: number
}

export interface CouponResult {
  valid: boolean
  code?: string
  discountPercent?: number
  discountAmount?: number
  subtotal?: number
  netTotal?: number
  message: string
}

export interface SearchAutocompleteResult {
  query: string
  suggestions: string[]
  books: {
    id: string
    title: string
    author: string
    genre: string
    price: number
    cover_url?: string
    rating: number
  }[]
}

export interface RecommendationsResult {
  bestsellers: Book[]
  new_releases: Book[]
  today_deals: Book[]
  top_rated: Book[]
  under_299: Book[]
  under_499: Book[]
  regional_spotlight: Book[]
}

export interface AdminAnalytics {
  metrics: {
    totalRevenue: number
    totalOrders: number
    pendingOrders: number
    totalCustomers: number
    totalBooks: number
    returnRequests: number
    lowStockCount: number
  }
  lowStockBooks: { id: string; title: string; stock: number; price: number }[]
  topSellers: { title: string; book_id: string; units_sold: number; revenue: number }[]
  categoryBreakdown: { genre: string; count: number }[]
  recentOrders: Order[]
}

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setAccessToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  if (init.body != null && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  const token = getAccessToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(`${BASE}${path}`, { ...init, headers })
  if (!response.ok) {
    const body = await response.text()
    let message = body || `Request failed (${response.status}).`
    try {
      const parsed = JSON.parse(body) as { detail?: unknown; error?: string; message?: string }
      if (parsed.message) message = parsed.message
      else if (parsed.error) message = parsed.error
      else if (typeof parsed.detail === 'string') message = parsed.detail
      else if (parsed.detail !== undefined) message = JSON.stringify(parsed.detail)
    } catch {
      // plain text error or HTML response
      if (body.includes('<html') || body.includes('<!doctype')) {
        message = response.status === 404 ? 'The requested resource was not found.' : `Server returned error (${response.status}). Please try again.`
      }
    }
    throw new ApiError(message, response.status)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export interface BookQuery {
  q?: string
  search_category?: string
  category?: string
  genre?: string
  format?: string
  language?: string
  minPrice?: number
  maxPrice?: number
  minRating?: number
  minDiscount?: number
  bestseller?: boolean
  new_release?: boolean
  featured?: boolean
  deals?: boolean
  available?: boolean
  author?: string
  publisher?: string
  sort?: string
  page?: number
  size?: number
}

export const bookApi = {
  list: async (query: BookQuery = {}): Promise<Page<Book>> => {
    const params = new URLSearchParams()
    if (query.q) params.set('q', query.q)
    if (query.search_category) params.set('search_category', query.search_category)
    if (query.category && query.category !== 'All') params.set('category', query.category)
    if (query.genre && query.genre !== 'All') params.set('genre', query.genre)
    if (query.format && query.format !== 'All') params.set('format', query.format)
    if (query.language && query.language !== 'All') params.set('language', query.language)
    if (query.minPrice != null) params.set('minPrice', String(query.minPrice))
    if (query.maxPrice != null) params.set('maxPrice', String(query.maxPrice))
    if (query.minRating != null && query.minRating > 0) params.set('minRating', String(query.minRating))
    if (query.minDiscount != null && query.minDiscount > 0) params.set('minDiscount', String(query.minDiscount))
    if (query.bestseller) params.set('bestseller', 'true')
    if (query.new_release) params.set('new_release', 'true')
    if (query.featured) params.set('featured', 'true')
    if (query.deals) params.set('deals', 'true')
    if (query.available) params.set('available', 'true')
    if (query.author) params.set('author', query.author)
    if (query.publisher) params.set('publisher', query.publisher)
    params.set('sort', query.sort || 'featured')
    params.set('page', String(query.page || 0))
    params.set('size', String(query.size || 24))
    return request<Page<Book>>(`/api/v1/books/?${params}`)
  },
  get: async (id: string): Promise<Book | undefined> => {
    try {
      return await request<Book>(`/api/v1/books/${encodeURIComponent(id)}/`)
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return undefined
      throw error
    }
  },
  autocomplete: (q: string, category = '') =>
    request<SearchAutocompleteResult>(`/api/v1/search/autocomplete/?q=${encodeURIComponent(q)}&category=${encodeURIComponent(category)}`),
  departments: () => request<Department[]>('/api/v1/departments/'),
  recommendations: () => request<RecommendationsResult>('/api/v1/recommendations/'),
  recentlyViewed: () => request<Book[]>('/api/v1/recently-viewed/'),
  recordView: (bookId: string) =>
    request<{ success: boolean }>('/api/v1/recently-viewed/', { method: 'POST', body: JSON.stringify({ bookId }) }),
  submitReview: (bookId: string, data: { rating: number; title: string; comment: string }) =>
    request<Review>(`/api/v1/books/${encodeURIComponent(bookId)}/reviews/`, { method: 'POST', body: JSON.stringify(data) }),
  voteReviewHelpful: (reviewId: string) =>
    request<{ helpful_votes: number }>(`/api/v1/reviews/${encodeURIComponent(reviewId)}/vote/`, { method: 'POST' }),
  author: (slug: string) => request<any>(`/api/v1/authors/${encodeURIComponent(slug)}/`),
  publisher: (slug: string) => request<any>(`/api/v1/publishers/${encodeURIComponent(slug)}/`),
}

export const authApi = {
  login: (email: string, password: string) =>
    request<AuthResponse>('/api/v1/auth/login/', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (name: string, email: string, password: string, phone = '') =>
    request<AuthResponse>('/api/v1/auth/register/', { method: 'POST', body: JSON.stringify({ name, email, password, phone }) }),
  me: () => request<User>('/api/v1/auth/me/'),
  updateProfile: (data: { name?: string; phone?: string; password?: string }) =>
    request<User>('/api/v1/auth/me/', { method: 'PUT', body: JSON.stringify(data) }),
}

export const cartApi = {
  get: () => request<CartResponse>('/api/v1/cart/'),
  add: (bookId: string, quantity = 1, format = 'Paperback') =>
    request<CartResponse>('/api/v1/cart/items/', { method: 'POST', body: JSON.stringify({ bookId, quantity, format }) }),
  update: (id: string, updates: { quantity?: number; saved_for_later?: boolean; format?: string }) =>
    request<CartResponse>(`/api/v1/cart/items/${encodeURIComponent(id)}/`, { method: 'PUT', body: JSON.stringify(updates) }),
  remove: (id: string) =>
    request<CartResponse>(`/api/v1/cart/items/${encodeURIComponent(id)}/`, { method: 'DELETE' }),
  moveToWishlist: (id: string) =>
    request<CartResponse>(`/api/v1/cart/items/${encodeURIComponent(id)}/move-to-wishlist/`, { method: 'POST' }),
  clear: () => request<CartResponse>('/api/v1/cart/', { method: 'DELETE' }),
}

export const wishlistApi = {
  get: () => request<Book[]>('/api/v1/wishlist/'),
  add: (bookId: string) => request<Book[]>(`/api/v1/wishlist/${encodeURIComponent(bookId)}/`, { method: 'POST' }),
  remove: (bookId: string) => request<Book[]>(`/api/v1/wishlist/${encodeURIComponent(bookId)}/`, { method: 'DELETE' }),
}

export const addressApi = {
  list: () => request<Address[]>('/api/v1/addresses/'),
  create: (addr: Omit<Address, 'id'>) =>
    request<Address>('/api/v1/addresses/', { method: 'POST', body: JSON.stringify(addr) }),
  update: (id: string, addr: Partial<Address>) =>
    request<Address>(`/api/v1/addresses/${encodeURIComponent(id)}/`, { method: 'PUT', body: JSON.stringify(addr) }),
  delete: (id: string) =>
    request<void>(`/api/v1/addresses/${encodeURIComponent(id)}/`, { method: 'DELETE' }),
}

export const orderApi = {
  applyCoupon: (code: string) =>
    request<CouponResult>('/api/v1/coupons/apply/', { method: 'POST', body: JSON.stringify({ code }) }),
  checkout: (data: {
    address: Partial<Address>
    deliverySpeed: string
    paymentMethod: string
    couponCode?: string
  }) => request<Order>('/api/v1/checkout/', { method: 'POST', body: JSON.stringify(data) }),
  list: () => request<Order[]>('/api/v1/orders/'),
  get: (id: string) => request<Order>(`/api/v1/orders/${encodeURIComponent(id)}/`),
  cancel: (id: string) => request<Order>(`/api/v1/orders/${encodeURIComponent(id)}/cancel/`, { method: 'POST' }),
  returnItem: (id: string, reason: string) =>
    request<Order>(`/api/v1/orders/${encodeURIComponent(id)}/return/`, { method: 'POST', body: JSON.stringify({ reason }) }),
}

export const libraryApi = {
  list: () => request<LibraryItem[]>('/api/v1/library/'),
  update: (id: string, data: { reading_status?: string; current_page?: number; notes?: string }) =>
    request<LibraryItem>(`/api/v1/library/${encodeURIComponent(id)}/`, { method: 'PUT', body: JSON.stringify(data) }),
}

export const contentApi = {
  blogs: (category?: string) =>
    request<BlogPost[]>(`/api/v1/blogs/${category ? `?category=${encodeURIComponent(category)}` : ''}`),
  blog: (slug: string) => request<BlogPost>(`/api/v1/blogs/${encodeURIComponent(slug)}/`),
  faqs: () => request<FAQItem[]>('/api/v1/faqs/'),
  supportTicket: (ticket: { name: string; email: string; subject: string; category: string; message: string }) =>
    request<any>('/api/v1/support/tickets/', { method: 'POST', body: JSON.stringify(ticket) }),
  subscribeNewsletter: (email: string) =>
    request<{ message: string }>('/api/v1/newsletter/subscribe/', { method: 'POST', body: JSON.stringify({ email }) }),
}

export const adminApi = {
  analytics: () => request<AdminAnalytics>('/api/v1/admin/analytics/'),
  orders: () => request<Order[]>('/api/v1/admin/orders/'),
  updateOrderStatus: (orderId: string, status: string) =>
    request<Order>(`/api/v1/admin/orders/${encodeURIComponent(orderId)}/status/`, { method: 'PUT', body: JSON.stringify({ status }) }),
  searchImport: (q: string) =>
    request<{ results: any[] }>(`/api/v1/admin/import-book/?q=${encodeURIComponent(q)}`),
  importBook: (metadata: any, options: { genre?: string; is_bestseller?: boolean; is_featured?: boolean; deal_discount?: number }) =>
    request<Book>('/api/v1/admin/import-book/', { method: 'POST', body: JSON.stringify({ metadata, ...options }) }),
}
