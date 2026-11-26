const BASE = import.meta.env.VITE_API_URL?.trim().replace(/\/$/, "") || "http://127.0.0.1:8000";
const TOKEN_KEY = "tt.accessToken";
export const backendConnected = true;
export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
  status;
}
export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setAccessToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}
async function request(path, init = {}) {
  const headers = new Headers(init.headers);
  if (init.body != null && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const token = getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(`${BASE}${path}`, { ...init, headers });
  if (!response.ok) {
    const body = await response.text();
    let message = body || `Request failed (${response.status}).`;
    try {
      const parsed = JSON.parse(body);
      if (parsed.message) message = parsed.message;
      else if (parsed.error) message = parsed.error;
      else if (typeof parsed.detail === "string") message = parsed.detail;
      else if (parsed.detail !== void 0) message = JSON.stringify(parsed.detail);
    } catch {
      if (body.includes("<html") || body.includes("<!doctype")) {
        message = response.status === 404 ? "The requested resource was not found." : `Server returned error (${response.status}). Please try again.`;
      }
    }
    throw new ApiError(message, response.status);
  }
  if (response.status === 204) return void 0;
  return response.json();
}
export const bookApi = {
  list: async (query = {}) => {
    const params = new URLSearchParams();
    if (query.q) params.set("q", query.q);
    if (query.search_category) params.set("search_category", query.search_category);
    if (query.category && query.category !== "All") params.set("category", query.category);
    if (query.genre && query.genre !== "All") params.set("genre", query.genre);
    if (query.format && query.format !== "All") params.set("format", query.format);
    if (query.language && query.language !== "All") params.set("language", query.language);
    if (query.minPrice != null) params.set("minPrice", String(query.minPrice));
    if (query.maxPrice != null) params.set("maxPrice", String(query.maxPrice));
    if (query.minRating != null && query.minRating > 0) params.set("minRating", String(query.minRating));
    if (query.minDiscount != null && query.minDiscount > 0) params.set("minDiscount", String(query.minDiscount));
    if (query.bestseller) params.set("bestseller", "true");
    if (query.new_release) params.set("new_release", "true");
    if (query.featured) params.set("featured", "true");
    if (query.deals) params.set("deals", "true");
    if (query.available) params.set("available", "true");
    if (query.author) params.set("author", query.author);
    if (query.publisher) params.set("publisher", query.publisher);
    params.set("sort", query.sort || "featured");
    params.set("page", String(query.page || 0));
    params.set("size", String(query.size || 24));
    return request(`/api/v1/books/?${params}`);
  },
  get: async (id) => {
    try {
      return await request(`/api/v1/books/${encodeURIComponent(id)}/`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return void 0;
      throw error;
    }
  },
  autocomplete: (q, category = "") => request(`/api/v1/search/autocomplete/?q=${encodeURIComponent(q)}&category=${encodeURIComponent(category)}`),
  departments: () => request("/api/v1/departments/"),
  recommendations: () => request("/api/v1/recommendations/"),
  recentlyViewed: () => request("/api/v1/recently-viewed/"),
  recordView: (bookId) => request("/api/v1/recently-viewed/", { method: "POST", body: JSON.stringify({ bookId }) }),
  submitReview: (bookId, data) => request(`/api/v1/books/${encodeURIComponent(bookId)}/reviews/`, { method: "POST", body: JSON.stringify(data) }),
  voteReviewHelpful: (reviewId) => request(`/api/v1/reviews/${encodeURIComponent(reviewId)}/vote/`, { method: "POST" }),
  author: (slug) => request(`/api/v1/authors/${encodeURIComponent(slug)}/`),
  publisher: (slug) => request(`/api/v1/publishers/${encodeURIComponent(slug)}/`)
};
export const authApi = {
  login: (email, password) => request("/api/v1/auth/login/", { method: "POST", body: JSON.stringify({ email, password }) }),
  register: (name, email, password, phone = "") => request("/api/v1/auth/register/", { method: "POST", body: JSON.stringify({ name, email, password, phone }) }),
  me: () => request("/api/v1/auth/me/"),
  updateProfile: (data) => request("/api/v1/auth/me/", { method: "PUT", body: JSON.stringify(data) })
};
export const cartApi = {
  get: () => request("/api/v1/cart/"),
  add: (bookId, quantity = 1, format = "Paperback") => request("/api/v1/cart/items/", { method: "POST", body: JSON.stringify({ bookId, quantity, format }) }),
  update: (id, updates) => request(`/api/v1/cart/items/${encodeURIComponent(id)}/`, { method: "PUT", body: JSON.stringify(updates) }),
  remove: (id) => request(`/api/v1/cart/items/${encodeURIComponent(id)}/`, { method: "DELETE" }),
  moveToWishlist: (id) => request(`/api/v1/cart/items/${encodeURIComponent(id)}/move-to-wishlist/`, { method: "POST" }),
  clear: () => request("/api/v1/cart/", { method: "DELETE" })
};
export const wishlistApi = {
  get: () => request("/api/v1/wishlist/"),
  add: (bookId) => request(`/api/v1/wishlist/${encodeURIComponent(bookId)}/`, { method: "POST" }),
  remove: (bookId) => request(`/api/v1/wishlist/${encodeURIComponent(bookId)}/`, { method: "DELETE" })
};
export const addressApi = {
  list: () => request("/api/v1/addresses/"),
  create: (addr) => request("/api/v1/addresses/", { method: "POST", body: JSON.stringify(addr) }),
  update: (id, addr) => request(`/api/v1/addresses/${encodeURIComponent(id)}/`, { method: "PUT", body: JSON.stringify(addr) }),
  delete: (id) => request(`/api/v1/addresses/${encodeURIComponent(id)}/`, { method: "DELETE" })
};
export const orderApi = {
  applyCoupon: (code) => request("/api/v1/coupons/apply/", { method: "POST", body: JSON.stringify({ code }) }),
  checkout: (data) => request("/api/v1/checkout/", { method: "POST", body: JSON.stringify(data) }),
  list: () => request("/api/v1/orders/"),
  get: (id) => request(`/api/v1/orders/${encodeURIComponent(id)}/`),
  cancel: (id) => request(`/api/v1/orders/${encodeURIComponent(id)}/cancel/`, { method: "POST" }),
  returnItem: (id, reason) => request(`/api/v1/orders/${encodeURIComponent(id)}/return/`, { method: "POST", body: JSON.stringify({ reason }) })
};
export const libraryApi = {
  list: () => request("/api/v1/library/"),
  update: (id, data) => request(`/api/v1/library/${encodeURIComponent(id)}/`, { method: "PUT", body: JSON.stringify(data) })
};
export const contentApi = {
  blogs: (category) => request(`/api/v1/blogs/${category ? `?category=${encodeURIComponent(category)}` : ""}`),
  blog: (slug) => request(`/api/v1/blogs/${encodeURIComponent(slug)}/`),
  faqs: () => request("/api/v1/faqs/"),
  supportTicket: (ticket) => request("/api/v1/support/tickets/", { method: "POST", body: JSON.stringify(ticket) }),
  subscribeNewsletter: (email) => request("/api/v1/newsletter/subscribe/", { method: "POST", body: JSON.stringify({ email }) })
};
export const adminApi = {
  analytics: () => request("/api/v1/admin/analytics/"),
  orders: () => request("/api/v1/admin/orders/"),
  updateOrderStatus: (orderId, status) => request(`/api/v1/admin/orders/${encodeURIComponent(orderId)}/status/`, { method: "PUT", body: JSON.stringify({ status }) }),
  searchImport: (q) => request(`/api/v1/admin/import-book/?q=${encodeURIComponent(q)}`),
  importBook: (metadata, options) => request("/api/v1/admin/import-book/", { method: "POST", body: JSON.stringify({ metadata, ...options }) })
};
