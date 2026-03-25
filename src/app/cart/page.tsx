"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CouponPanel } from "@/components/cart/CouponPanel";
import { useCartStore, type CartItem } from "@/lib/cartStore";
import {
  clearAppliedCoupon,
  getAppliedCoupon,
  normalizeCouponCode,
  setAppliedCoupon as persistAppliedCoupon,
  validateCouponCode,
  type AppliedCoupon,
} from "@/lib/coupons";
import {
  clearCart as clearPersistedCart,
  getLastOrder,
  recoverLastOrder,
  saveLastOrder,
  type LastOrder,
} from "@/lib/cartCheckout";
import {
  buildImagePlaceholder,
  compareNamesWithTrailingNumber,
  formatCurrency,
  normalizeCustomerName,
} from "@/lib/utils";
import { buildOptimizedImageUrl } from "@/lib/cloudinaryImage";
import { createOrderIntent } from "@/lib/orders";
import {
  buildWhatsAppCheckoutPayload,
  openCheckoutWhatsAppConversation,
} from "@/lib/whatsapp";

const transferAlias =
  process.env.NEXT_PUBLIC_TRANSFER_ALIAS ?? "TRANSFER_ALIAS";

type Feedback = {
  type: "success" | "error";
  message: string;
};

const buildCartOrderSummary = (items: CartItem[]) => {
  if (items.length === 0) return "Pedido sin productos";

  const preview = items
    .slice(0, 3)
    .map((item) => {
      const sizeLabel = typeof item.sizeCm === "number" ? ` (${item.sizeCm} cm)` : "";
      return `${item.name}${sizeLabel} x${item.quantity}`;
    })
    .join(", ");

  const extra = items.length > 3 ? ` +${items.length - 3} mas` : "";
  return `${items.length} producto(s): ${preview}${extra}`;
};

export default function CartPage() {
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const setQty = useCartStore((state) => state.setQty);
  const setSize = useCartStore((state) => state.setSize);
  const clear = useCartStore((state) => state.clear);

  const [couponInput, setCouponInput] = useState("");
  const [couponFeedback, setCouponFeedback] = useState<Feedback | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutFeedback, setCheckoutFeedback] = useState<Feedback | null>(null);
  const [lastOrder, setLastOrder] = useState<LastOrder | null>(null);
  const [customerName, setCustomerName] = useState("");

  useEffect(() => {
    const storedLastOrder = getLastOrder();
    setLastOrder(storedLastOrder);
    if (storedLastOrder?.customerName) {
      setCustomerName(storedLastOrder.customerName);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const restoreAppliedCoupon = async () => {
      const storedCoupon = getAppliedCoupon();
      if (!storedCoupon) return;

      setCouponInput(storedCoupon.code);
      setIsApplying(true);

      try {
        const validCoupon = await validateCouponCode(storedCoupon.code);
        if (cancelled) return;

        if (!validCoupon) {
          clearAppliedCoupon();
          setAppliedCoupon(null);
          setCouponFeedback({
            type: "error",
            message: "Cupon invalido",
          });
          return;
        }

        persistAppliedCoupon(validCoupon);
        setAppliedCoupon(validCoupon);
      } catch {
        if (cancelled) return;
        setCouponFeedback({
          type: "error",
          message: "No se pudo validar el cupon.",
        });
      } finally {
        if (!cancelled) {
          setIsApplying(false);
        }
      }
    };

    void restoreAppliedCoupon();

    return () => {
      cancelled = true;
    };
  }, []);

  const getUnitPrice = (item: (typeof items)[number]) =>
    item.unitPrice ?? item.price ?? 0;
  const sortedItems = useMemo(
    () =>
      [...items].sort((a, b) => {
        const byName = compareNamesWithTrailingNumber(a.name, b.name);
        if (byName !== 0) return byName;

        const aSize = typeof a.sizeCm === "number" ? a.sizeCm : Number.MAX_SAFE_INTEGER;
        const bSize = typeof b.sizeCm === "number" ? b.sizeCm : Number.MAX_SAFE_INTEGER;
        if (aSize !== bSize) return aSize - bSize;

        return a.id.localeCompare(b.id, "es", { sensitivity: "base" });
      }),
    [items]
  );

  const subtotal = useMemo(
    () =>
      items.reduce((sum, item) => sum + getUnitPrice(item) * item.quantity, 0),
    [items]
  );

  const discountPercent = appliedCoupon?.percent ?? 0;
  const discountAmount = useMemo(
    () => subtotal * (discountPercent / 100),
    [subtotal, discountPercent]
  );
  const totalWithDiscount = useMemo(
    () => Math.max(subtotal - discountAmount, 0),
    [subtotal, discountAmount]
  );
  const hasCustomerName = normalizeCustomerName(customerName).length > 0;

  const handleApplyCoupon = async () => {
    const normalizedCode = normalizeCouponCode(couponInput);
    if (!normalizedCode) {
      setCouponFeedback({ type: "error", message: "Cupon invalido" });
      return;
    }

    setIsApplying(true);
    setCouponFeedback(null);

    try {
      const coupon = await validateCouponCode(normalizedCode);

      if (!coupon) {
        setCouponFeedback({ type: "error", message: "Cupon invalido" });
        return;
      }

      persistAppliedCoupon(coupon);
      setAppliedCoupon(coupon);
      setCouponInput(coupon.code);
      setCouponFeedback({
        type: "success",
        message: `Cupon aplicado: ${coupon.percent}%`,
      });
    } catch {
      setCouponFeedback({
        type: "error",
        message: "No se pudo validar el cupon.",
      });
    } finally {
      setIsApplying(false);
    }
  };

  const handleRemoveCoupon = () => {
    clearAppliedCoupon();
    setAppliedCoupon(null);
    setCouponFeedback(null);
    setCouponInput("");
  };

  const handleCheckoutWhatsapp = async () => {
    if (items.length === 0) return;

    const normalizedCustomerName = normalizeCustomerName(customerName);
    if (!normalizedCustomerName) {
      setCheckoutFeedback({
        type: "error",
        message: "Escribí tu nombre para finalizar el pedido.",
      });
      return;
    }

    const confirmed = window.confirm(
      "Confirmas que queres enviar el pedido por WhatsApp?"
    );
    if (!confirmed) return;

    const checkoutPayload = buildWhatsAppCheckoutPayload({
      items: sortedItems,
      customerName: normalizedCustomerName,
      total: totalWithDiscount,
      subtotal,
      discountAmount,
      discountPercent,
      couponCode: appliedCoupon?.code ?? null,
      transferAlias,
    });

    setIsCheckingOut(true);

    const orderSnapshot: LastOrder = {
      items: sortedItems.map((item) => ({ ...item })),
      subtotal,
      total: totalWithDiscount,
      timestamp: new Date().toISOString(),
      coupon: appliedCoupon,
      customerName: normalizedCustomerName,
    };

    try {
      await createOrderIntent({
        summary: `${normalizedCustomerName} - ${buildCartOrderSummary(sortedItems)}`,
        total: totalWithDiscount,
        whatsappMessage: checkoutPayload.message,
        source: "web",
        orderDetails: {
          customerName: normalizedCustomerName,
          items: sortedItems.map((item) => ({
            id: item.id,
            productId: item.productId,
            name: item.name,
            imageUrl: item.imageUrl ?? null,
            sizeCm: item.sizeCm ?? null,
            quantity: item.quantity,
            unitPrice: getUnitPrice(item),
            lineTotal: getUnitPrice(item) * item.quantity,
          })),
          subtotal: Math.round(subtotal),
          discountPercent,
          discountAmount: Math.round(discountAmount),
          total: Math.round(totalWithDiscount),
          couponCode: appliedCoupon?.code ?? null,
        },
      });

      saveLastOrder(orderSnapshot);
      setLastOrder(orderSnapshot);

      clearPersistedCart();
      setAppliedCoupon(null);
      setCouponInput("");
      setCouponFeedback(null);
      setCustomerName(normalizedCustomerName);

      setCheckoutFeedback({
        type: "success",
        message: "Listo, abrimos WhatsApp para enviar tu pedido.",
      });

      openCheckoutWhatsAppConversation(checkoutPayload.message);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo guardar el pedido. Reintenta de nuevo.";
      setCheckoutFeedback({
        type: "error",
        message,
      });
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleRecoverLastOrder = () => {
    if (!lastOrder) return;

    recoverLastOrder(lastOrder);

    if (lastOrder.coupon) {
      setAppliedCoupon(lastOrder.coupon);
      setCouponInput(lastOrder.coupon.code);
      setCouponFeedback({
        type: "success",
        message: `Cupon recuperado: ${lastOrder.coupon.percent}%`,
      });
    } else {
      setAppliedCoupon(null);
      setCouponInput("");
      setCouponFeedback(null);
    }
    setCustomerName(lastOrder.customerName ?? "");

    setCheckoutFeedback({
      type: "success",
      message: "Recuperamos tu ultimo pedido.",
    });
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
        >
          &larr; Seguir comprando
        </Link>

        <h1 className="text-4xl font-semibold">Tu carrito</h1>

        {items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center">
            <p className="text-lg text-slate-600">Todavia no agregaste calcos.</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/"
                className="rounded-full bg-[var(--color-primary)] px-6 py-3 text-white hover:bg-[var(--color-primary-dark)]"
              >
                Ir al catalogo
              </Link>
              {lastOrder && (
                <button
                  type="button"
                  onClick={handleRecoverLastOrder}
                  className="rounded-full border border-slate-300 px-6 py-3 text-slate-700 transition hover:bg-slate-50"
                >
                  Recuperar ultimo pedido
                </button>
              )}
            </div>
            {checkoutFeedback && (
              <p
                className={`mt-4 text-sm ${
                  checkoutFeedback.type === "success"
                    ? "text-emerald-700"
                    : "text-rose-600"
                }`}
              >
                {checkoutFeedback.message}
              </p>
            )}
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
            <div className="space-y-4">
              {sortedItems.map((item) => (
                <article
                  key={item.id}
                  className="card flex flex-col gap-4 rounded-3xl p-4 sm:flex-row sm:items-center"
                >
                  <div className="flex h-28 w-full items-center justify-center rounded-2xl bg-slate-100 sm:h-24 sm:w-24">
                    <img
                      src={
                        buildOptimizedImageUrl(item.imageUrl, {
                          width: 220,
                          height: 220,
                          crop: "limit",
                        }) || buildImagePlaceholder(item.name)
                      }
                      alt={item.name}
                      className="h-full w-full max-h-24 object-contain p-2"
                      loading="lazy"
                    />
                  </div>

                  <div className="flex flex-1 flex-col gap-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-lg font-semibold text-slate-900">
                        {item.name}
                      </h3>
                      <p className="text-base font-semibold text-slate-700">
                        {formatCurrency(getUnitPrice(item) * item.quantity)}
                      </p>
                    </div>
                    {item.sizeOptions && item.sizeOptions.length > 0 ? (
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-medium text-slate-500">Tamano:</span>
                        <select
                          value={item.sizeCm ?? ""}
                          onChange={(event) =>
                            setSize(item.id, Number(event.target.value) as 4 | 6 | 8)
                          }
                          className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 focus:border-slate-400 focus:outline-none"
                        >
                          {[...item.sizeOptions]
                            .sort((a, b) => a.sizeCm - b.sizeCm)
                            .map((option) => (
                              <option key={`${item.id}-${option.sizeCm}`} value={option.sizeCm}>
                                {`${option.sizeCm} cm - ${formatCurrency(option.price)}`}
                              </option>
                            ))}
                        </select>
                      </div>
                    ) : item.sizeCm ? (
                      <p className="text-xs font-medium text-slate-500">
                        {`Tamano: ${item.sizeCm} cm`}
                      </p>
                    ) : null}
                    <p className="text-xs text-slate-500">
                      Unitario: {formatCurrency(getUnitPrice(item))}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <div className="inline-flex items-center gap-3 rounded-full border border-slate-200 px-3 py-1">
                        <button
                          type="button"
                          className="text-lg text-slate-500 hover:text-slate-900"
                          onClick={() => setQty(item.id, item.quantity - 1)}
                        >
                          -
                        </button>
                        <span className="min-w-[2rem] text-center font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          className="text-lg text-slate-500 hover:text-slate-900"
                          onClick={() => setQty(item.id, item.quantity + 1)}
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        className="text-slate-500 underline-offset-2 hover:text-slate-900 hover:underline"
                        onClick={() => removeItem(item.id)}
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                </article>
              ))}

              <button
                type="button"
                onClick={clear}
                className="text-sm text-slate-500 underline-offset-2 hover:text-slate-900 hover:underline"
              >
                Vaciar carrito
              </button>
            </div>

            <aside className="card flex flex-col gap-4 rounded-3xl p-6">
              <div>
                <h2 className="text-2xl font-semibold">Resumen</h2>
                <p className="text-sm text-slate-500">
                  Coordinamos el pago por WhatsApp.
                </p>
              </div>

              <div className="space-y-2 rounded-2xl border border-slate-200 p-3">
                <label
                  htmlFor="checkout-customer-name"
                  className="text-sm font-semibold text-slate-800"
                >
                  Nombre (obligatorio)
                </label>
                <input
                  id="checkout-customer-name"
                  type="text"
                  value={customerName}
                  onChange={(event) => {
                    setCustomerName(event.target.value);
                    if (checkoutFeedback?.type === "error") {
                      setCheckoutFeedback(null);
                    }
                  }}
                  placeholder="Ej: Juan Pérez"
                  disabled={isCheckingOut}
                  className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[var(--color-primary)] disabled:cursor-not-allowed disabled:bg-slate-50"
                />
              </div>

              <CouponPanel
                couponInput={couponInput}
                onCouponInputChange={setCouponInput}
                onApplyCoupon={() => void handleApplyCoupon()}
                onRemoveCoupon={handleRemoveCoupon}
                appliedCoupon={appliedCoupon}
                isApplying={isApplying}
                feedback={couponFeedback}
              />

              <dl className="space-y-3 text-sm text-slate-600">
                <div className="flex items-center justify-between font-medium text-slate-900">
                  <dt>Subtotal</dt>
                  <dd>{formatCurrency(subtotal)}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt>Descuento ({discountPercent}%)</dt>
                  <dd>-{formatCurrency(discountAmount)}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt>Envio</dt>
                  <dd>A coordinar</dd>
                </div>
                <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-base font-semibold text-slate-900">
                  <dt>Total final</dt>
                  <dd>{formatCurrency(totalWithDiscount)}</dd>
                </div>
              </dl>

              <button
                type="button"
                className="mt-2 inline-flex items-center justify-center rounded-full bg-[var(--color-primary)] px-6 py-3 text-white transition hover:bg-[var(--color-primary-dark)] disabled:cursor-not-allowed disabled:opacity-50"
                onClick={handleCheckoutWhatsapp}
                disabled={items.length === 0 || isCheckingOut || !hasCustomerName}
              >
                {isCheckingOut ? "Guardando pedido..." : "Finalizar por WhatsApp"}
              </button>

              {checkoutFeedback && (
                <p
                  className={`text-xs ${
                    checkoutFeedback.type === "success"
                      ? "text-emerald-700"
                      : "text-rose-600"
                  }`}
                >
                  {checkoutFeedback.message}
                </p>
              )}

              <p className="text-xs text-slate-500">
                Enviaremos un mensaje con tu nombre, el detalle del pedido, el total y el
                texto "Pago por transferencia, coordinamos por WhatsApp".
              </p>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
