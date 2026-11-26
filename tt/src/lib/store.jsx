import { createContext, useContext, useEffect, useState } from "react";
import {
  addressApi,
  authApi,
  bookApi,
  cartApi,
  getAccessToken,
  setAccessToken,
  wishlistApi
} from "./api";
const Ctx = createContext(null);
function readLocal(key, fallback) {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
}
function computeGuestCart(items) {
  const activeItems = items.filter((it) => !it.saved_for_later);
  const savedItems = items.filter((it) => it.saved_for_later);
  const subtotal = activeItems.reduce((acc, it) => acc + it.lineTotal, 0);
  const freeThreshold = 499;
  const shippingFee = subtotal >= freeThreshold || subtotal === 0 ? 0 : 40;
  const total = subtotal + shippingFee;
  const amountNeeded = Math.max(0, freeThreshold - subtotal);
  return {
    items: activeItems,
    savedForLater: savedItems,
    subtotal,
    shippingFee,
    freeShippingThreshold: freeThreshold,
    amountNeededForFreeShipping: amountNeeded,
    total
  };
}
export function StoreProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [savedForLaterItems, setSavedForLaterItems] = useState([]);
  const [cartSubtotal, setCartSubtotal] = useState(0);
  const [cartShippingFee, setCartShippingFee] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(499);
  const [amountNeededForFreeShipping, setAmountNeededForFreeShipping] = useState(499);
  const [wish, setWish] = useState(() => readLocal("tt.wish", []));
  const [wishBooks, setWishBooks] = useState([]);
  const [user, setUser] = useState(() => readLocal("tt.user", null));
  const [addresses, setAddresses] = useState([]);
  const [deliveryLocation, setDeliveryLocation] = useState(
    () => readLocal("tt.location", { city: "Bengaluru", postalCode: "560025", label: "Deliver to Bengaluru 560025" })
  );
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const applyCart = (res) => {
    setCartItems(res.items || []);
    setSavedForLaterItems(res.savedForLater || []);
    setCartSubtotal(res.subtotal || 0);
    setCartShippingFee(res.shippingFee || 0);
    setCartTotal(res.total || 0);
    setFreeShippingThreshold(res.freeShippingThreshold || 499);
    setAmountNeededForFreeShipping(res.amountNeededForFreeShipping || 0);
  };
  const loadUserData = async () => {
    try {
      const [u, c, w, addrs] = await Promise.all([
        authApi.me(),
        cartApi.get().catch(() => null),
        wishlistApi.get().catch(() => []),
        addressApi.list().catch(() => [])
      ]);
      setUser(u);
      localStorage.setItem("tt.user", JSON.stringify(u));
      if (c) applyCart(c);
      setWishBooks(w);
      setWish(w.map((b) => b.id));
      setAddresses(addrs);
      const defAddr = addrs.find((a) => a.is_default) || addrs[0];
      if (defAddr) {
        const loc = {
          city: defAddr.city,
          postalCode: defAddr.postal_code,
          label: `Deliver to ${defAddr.city} ${defAddr.postal_code}`
        };
        setDeliveryLocation(loc);
        localStorage.setItem("tt.location", JSON.stringify(loc));
      }
    } catch {
      setAccessToken(null);
      setUser(null);
      localStorage.removeItem("tt.user");
    }
  };
  useEffect(() => {
    const init = async () => {
      const token = getAccessToken();
      if (token) {
        await loadUserData();
      } else {
        const guestItems = readLocal("tt.guest_cart", []);
        if (guestItems.length > 0) {
          applyCart(computeGuestCart(guestItems));
        }
      }
      setReady(true);
    };
    init();
  }, []);
  const count = cartItems.reduce((acc, it) => acc + it.quantity, 0);
  const cartQtyMap = Object.fromEntries(
    cartItems.map((it) => [it.book.id, it.quantity])
  );
  const add = async (id, quantity = 1, format = "Paperback") => {
    try {
      setError("");
      const token = getAccessToken();
      if (token) {
        const updated = await cartApi.add(id, quantity, format);
        applyCart(updated);
        return true;
      }
      const book = await bookApi.get(id);
      if (!book) {
        setError("Could not retrieve book details.");
        return false;
      }
      const current = readLocal("tt.guest_cart", []);
      const existingIdx = current.findIndex(
        (it) => it.book.id === id && it.selected_format === format && !it.saved_for_later
      );
      let updatedList;
      if (existingIdx >= 0) {
        updatedList = [...current];
        const newQty = updatedList[existingIdx].quantity + quantity;
        updatedList[existingIdx] = {
          ...updatedList[existingIdx],
          quantity: newQty,
          lineTotal: updatedList[existingIdx].unitPrice * newQty
        };
      } else {
        const unitPrice = book.price;
        const newItem = {
          id: `guest-${book.id}-${format}-${Date.now()}`,
          book,
          quantity,
          selected_format: format,
          saved_for_later: false,
          unitPrice,
          lineTotal: unitPrice * quantity
        };
        updatedList = [...current, newItem];
      }
      localStorage.setItem("tt.guest_cart", JSON.stringify(updatedList));
      applyCart(computeGuestCart(updatedList));
      return true;
    } catch (err) {
      setError(err?.message || "Could not add to cart.");
      return false;
    }
  };
  const setQty = async (itemId, quantity) => {
    try {
      setError("");
      const token = getAccessToken();
      if (token) {
        let updated;
        if (quantity <= 0) {
          updated = await cartApi.remove(itemId);
        } else {
          updated = await cartApi.update(itemId, { quantity });
        }
        applyCart(updated);
        return;
      }
      const current = readLocal("tt.guest_cart", []);
      let updatedList;
      if (quantity <= 0) {
        updatedList = current.filter((it) => it.id !== itemId);
      } else {
        updatedList = current.map((it) => {
          if (it.id === itemId) {
            return {
              ...it,
              quantity,
              lineTotal: it.unitPrice * quantity
            };
          }
          return it;
        });
      }
      localStorage.setItem("tt.guest_cart", JSON.stringify(updatedList));
      applyCart(computeGuestCart(updatedList));
    } catch (err) {
      setError(err?.message || "Could not update quantity.");
    }
  };
  const saveForLater = async (itemId) => {
    try {
      setError("");
      const token = getAccessToken();
      if (token) {
        const updated = await cartApi.update(itemId, { saved_for_later: true });
        applyCart(updated);
        return;
      }
      const current = readLocal("tt.guest_cart", []);
      const updatedList = current.map((it) => {
        if (it.id === itemId) return { ...it, saved_for_later: true };
        return it;
      });
      localStorage.setItem("tt.guest_cart", JSON.stringify(updatedList));
      applyCart(computeGuestCart(updatedList));
    } catch (err) {
      setError(err?.message || "Could not save for later.");
    }
  };
  const moveToCartFromSaved = async (itemId) => {
    try {
      setError("");
      const token = getAccessToken();
      if (token) {
        const updated = await cartApi.update(itemId, { saved_for_later: false });
        applyCart(updated);
        return;
      }
      const current = readLocal("tt.guest_cart", []);
      const updatedList = current.map((it) => {
        if (it.id === itemId) return { ...it, saved_for_later: false };
        return it;
      });
      localStorage.setItem("tt.guest_cart", JSON.stringify(updatedList));
      applyCart(computeGuestCart(updatedList));
    } catch (err) {
      setError(err?.message || "Could not move to cart.");
    }
  };
  const moveToWishlist = async (itemId) => {
    try {
      setError("");
      const token = getAccessToken();
      if (token) {
        const updated = await cartApi.moveToWishlist(itemId);
        applyCart(updated);
        const w = await wishlistApi.get();
        setWishBooks(w);
        setWish(w.map((b) => b.id));
      } else {
        await setQty(itemId, 0);
      }
    } catch (err) {
      setError(err?.message || "Could not move to wishlist.");
    }
  };
  const clearCart = async () => {
    try {
      const token = getAccessToken();
      if (token) {
        const updated = await cartApi.clear();
        applyCart(updated);
      } else {
        localStorage.removeItem("tt.guest_cart");
        applyCart(computeGuestCart([]));
      }
    } catch (err) {
      setError(err?.message || "Could not clear cart.");
    }
  };
  const toggleWish = async (id) => {
    try {
      setError("");
      const token = getAccessToken();
      if (!token) {
        setError("Please sign in to save books to your wishlist.");
        return;
      }
      const inWish = wish.includes(id);
      const updated = inWish ? await wishlistApi.remove(id) : await wishlistApi.add(id);
      setWishBooks(updated);
      setWish(updated.map((b) => b.id));
    } catch (err) {
      setError(err?.message || "Could not update wishlist.");
    }
  };
  const moveToCart = async (bookId) => {
    const success = await add(bookId, 1);
    if (success) {
      await toggleWish(bookId);
    }
  };
  const login = async (email, pass) => {
    setError("");
    const res = await authApi.login(email, pass);
    setAccessToken(res.token);
    setUser(res.user);
    localStorage.setItem("tt.user", JSON.stringify(res.user));
    const guestCart = readLocal("tt.guest_cart", []);
    if (guestCart.length > 0) {
      for (const item of guestCart) {
        if (!item.saved_for_later) {
          try {
            await cartApi.add(item.book.id, item.quantity, item.selected_format);
          } catch {
          }
        }
      }
      localStorage.removeItem("tt.guest_cart");
    }
    await loadUserData();
  };
  const register = async (name, email, pass, phone = "") => {
    setError("");
    const res = await authApi.register(name, email, pass, phone);
    setAccessToken(res.token);
    setUser(res.user);
    localStorage.setItem("tt.user", JSON.stringify(res.user));
    const guestCart = readLocal("tt.guest_cart", []);
    if (guestCart.length > 0) {
      for (const item of guestCart) {
        if (!item.saved_for_later) {
          try {
            await cartApi.add(item.book.id, item.quantity, item.selected_format);
          } catch {
          }
        }
      }
      localStorage.removeItem("tt.guest_cart");
    }
    await loadUserData();
  };
  const logout = () => {
    setAccessToken(null);
    setUser(null);
    setCartItems([]);
    setSavedForLaterItems([]);
    setCartSubtotal(0);
    setCartTotal(0);
    setWish([]);
    setWishBooks([]);
    setAddresses([]);
    localStorage.removeItem("tt.user");
    localStorage.removeItem("tt.guest_cart");
  };
  const refreshUserData = async () => {
    if (getAccessToken()) {
      await loadUserData();
    }
  };
  const clearError = () => setError("");
  const handleSetDeliveryLocation = (loc) => {
    setDeliveryLocation(loc);
    localStorage.setItem("tt.location", JSON.stringify(loc));
  };
  return <Ctx.Provider
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
      clearError
    }}
  >
      {children}
    </Ctx.Provider>;
}
export function useStore() {
  const store = useContext(Ctx);
  if (!store) throw new Error("useStore must be inside StoreProvider");
  return store;
}
