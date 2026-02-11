"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useCartStore } from "@/lib/cartStore";
import { buildImagePlaceholder, formatCurrency } from "@/lib/utils";
import { buildWhatsAppCheckoutUrl } from "@/lib/whatsapp";
const transferAlias =
  process.env.NEXT_PUBLIC_TRANSFER_ALIAS ?? "TRANSFER_ALIAS";

export default function CartPage() {
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const setQty = useCartStore((state) => state.setQty);
  const clear = useCartStore((state) => state.clear);
  const getUnitPrice = (item: (typeof items)[number]) =>
    item.unitPrice ?? item.price ?? 0;

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + getUnitPrice(item) * item.quantity,
        0
      ),
    [items]
  );

  const checkoutUrl = buildWhatsAppCheckoutUrl({
    items,
    total: subtotal,
    transferAlias,
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
      <div className="space-y-6">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
      >
        ← Seguir comprando
      </Link>

      <h1 className="text-4xl font-semibold">Tu carrito</h1>

      {items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <p className="text-lg text-slate-600">Todavía no agregaste calcos.</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/"
              className="rounded-full bg-[var(--color-primary)] px-6 py-3 text-white hover:bg-[var(--color-primary-dark)]"
            >
              Ir al catálogo
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <div className="space-y-4">
            {items.map((item) => (
              <article
                key={item.id}
                className="card flex flex-col gap-4 rounded-3xl p-4 sm:flex-row sm:items-center"
              >
                <div className="flex h-28 w-full items-center justify-center rounded-2xl bg-slate-100 sm:h-24 sm:w-24">
                  <img
                    src={item.imageUrl || buildImagePlaceholder(item.name)}
                    alt={item.name}
                    className="h-full w-full max-h-24 object-contain p-2"
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
                  {item.sizeCm && (
                    <p className="text-xs font-medium text-slate-500">
                      Tamano: {item.sizeCm} cm
                    </p>
                  )}
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
                        −
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

            <dl className="space-y-3 text-sm text-slate-600">
              <div className="flex items-center justify-between font-medium text-slate-900">
                <dt>Subtotal</dt>
                <dd>{formatCurrency(subtotal)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>Envío</dt>
                <dd>A coordinar</dd>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-base font-semibold text-slate-900">
                <dt>Total</dt>
                <dd>{formatCurrency(subtotal)}</dd>
              </div>
            </dl>

            <button
              type="button"
              className="mt-2 inline-flex items-center justify-center rounded-full bg-[var(--color-primary)] px-6 py-3 text-white transition hover:bg-[var(--color-primary-dark)] disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => window.open(checkoutUrl, "_blank")}
              disabled={items.length === 0}
            >
              Finalizar por WhatsApp
            </button>

            <p className="text-xs text-slate-500">
              Enviaremos un mensaje con el detalle del pedido, el total y el
              texto “Pago por transferencia, coordinamos por WhatsApp”.
            </p>
          </aside>
        </div>
      )}
      </div>
    </div>
  );
}
