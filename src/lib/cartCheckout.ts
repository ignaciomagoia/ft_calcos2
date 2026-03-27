import { clearAppliedCoupon, setAppliedCoupon, type AppliedCoupon } from "./coupons";
import { useCartStore, type CartItem } from "./cartStore";

export const LAST_ORDER_STORAGE_KEY = "lastOrder";

export type LastOrder = {
  items: CartItem[];
  subtotal: number;
  total: number;
  timestamp: string;
  coupon: AppliedCoupon | null;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
};

const isBrowser = () => typeof window !== "undefined";

const isValidCartItem = (value: unknown): value is CartItem => {
  if (!value || typeof value !== "object") return false;

  const item = value as Partial<CartItem>;
  return (
    typeof item.id === "string" &&
    typeof item.productId === "string" &&
    typeof item.name === "string" &&
    typeof item.unitPrice === "number" &&
    typeof item.quantity === "number"
  );
};

export const saveLastOrder = (order: LastOrder) => {
  if (!isBrowser()) return;
  window.localStorage.setItem(LAST_ORDER_STORAGE_KEY, JSON.stringify(order));
};

export const getLastOrder = (): LastOrder | null => {
  if (!isBrowser()) return null;

  try {
    const raw = window.localStorage.getItem(LAST_ORDER_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<LastOrder>;
    if (!Array.isArray(parsed.items)) return null;

    const items = parsed.items.filter(isValidCartItem);
    if (items.length === 0) return null;

    const subtotal = Number(parsed.subtotal);
    const total = Number(parsed.total);
    const timestamp =
      typeof parsed.timestamp === "string"
        ? parsed.timestamp
        : new Date().toISOString();

    const coupon =
      parsed.coupon &&
      typeof parsed.coupon.code === "string" &&
      typeof parsed.coupon.percent === "number"
        ? parsed.coupon
        : null;
    const customerName =
      typeof parsed.customerName === "string" ? parsed.customerName : undefined;
    const customerPhone =
      typeof parsed.customerPhone === "string" ? parsed.customerPhone : undefined;
    const customerEmail =
      typeof parsed.customerEmail === "string" ? parsed.customerEmail : undefined;

    if (!Number.isFinite(subtotal) || !Number.isFinite(total)) return null;

    return {
      items,
      subtotal,
      total,
      timestamp,
      coupon,
      customerName,
      customerPhone,
      customerEmail,
    };
  } catch {
    return null;
  }
};

export const clearCart = () => {
  const store = useCartStore.getState();
  store.clear();
  clearAppliedCoupon();
};

export const recoverLastOrder = (order: LastOrder) => {
  const store = useCartStore.getState();
  store.clear();

  for (const item of order.items) {
    const { quantity, ...payload } = item;
    store.addItem(payload, Math.max(Number(quantity) || 1, 1));
  }

  if (order.coupon) {
    setAppliedCoupon(order.coupon);
  } else {
    clearAppliedCoupon();
  }
};
