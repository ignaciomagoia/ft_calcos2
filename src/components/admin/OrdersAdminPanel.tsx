"use client";

import { useEffect, useMemo, useState } from "react";
import { deleteOrder, listOrders, type Order } from "@/lib/orders";
import { buildImagePlaceholder, formatCurrency } from "@/lib/utils";

const formatDateTime = (isoDate: string) => {
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return isoDate;

  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(parsed);
};

const getCustomerNameFromDetails = (details: unknown): string | null => {
  if (!details || typeof details !== "object") return null;

  const raw = details as {
    customerName?: unknown;
    customer_name?: unknown;
  };

  if (typeof raw.customerName === "string" && raw.customerName.trim().length > 0) {
    return raw.customerName.trim();
  }

  if (typeof raw.customer_name === "string" && raw.customer_name.trim().length > 0) {
    return raw.customer_name.trim();
  }

  return null;
};

const getCustomerNameFromWhatsAppMessage = (message: string): string | null => {
  const match = message.match(/(?:^|\n)Nombre:\s*(.+)/i);
  if (!match || !match[1]) return null;

  const normalized = match[1].trim();
  return normalized.length > 0 ? normalized : null;
};

const buildOrderDetailPreview = (details: unknown): string | null => {
  if (!details || typeof details !== "object") return null;

  const raw = details as { items?: unknown };
  if (!Array.isArray(raw.items) || raw.items.length === 0) return null;

  const lines = raw.items
    .slice(0, 4)
    .map((item) => {
      if (!item || typeof item !== "object") return "";
      const row = item as {
        name?: unknown;
        quantity?: unknown;
        sizeCm?: unknown;
        size?: unknown;
      };

      const name = typeof row.name === "string" ? row.name.trim() : "Producto";
      const quantity =
        typeof row.quantity === "number" && row.quantity > 0
          ? row.quantity
          : null;
      const sizeValue =
        typeof row.sizeCm === "number"
          ? `${row.sizeCm} cm`
          : typeof row.size === "string"
          ? row.size
          : null;

      const chunks = [name];
      if (sizeValue) chunks.push(`tam: ${sizeValue}`);
      if (quantity && quantity > 1) chunks.push(`cant: ${quantity}`);
      return chunks.join(" | ");
    })
    .filter(Boolean);

  if (lines.length === 0) return null;
  return lines.join("\n");
};

type OrderImagePreviewItem = {
  key: string;
  src: string;
  alt: string;
};

const buildOrderImagePreview = (
  details: unknown,
  maxItems = 8
): { items: OrderImagePreviewItem[]; extraCount: number } => {
  if (!details || typeof details !== "object") {
    return { items: [], extraCount: 0 };
  }

  const raw = details as { items?: unknown };
  if (!Array.isArray(raw.items) || raw.items.length === 0) {
    return { items: [], extraCount: 0 };
  }

  const items = raw.items
    .slice(0, maxItems)
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const row = item as {
        name?: unknown;
        imageUrl?: unknown;
        image_url?: unknown;
      };

      const name = typeof row.name === "string" ? row.name.trim() : "Producto";
      const candidateImage =
        typeof row.imageUrl === "string" && row.imageUrl.trim().length > 0
          ? row.imageUrl.trim()
          : typeof row.image_url === "string" && row.image_url.trim().length > 0
          ? row.image_url.trim()
          : buildImagePlaceholder(name);

      return {
        key: `${name}-${index}`,
        src: candidateImage,
        alt: name,
      };
    })
    .filter((value): value is OrderImagePreviewItem => value !== null);

  return {
    items,
    extraCount: Math.max(raw.items.length - items.length, 0),
  };
};

export const OrdersAdminPanel = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const sortedOrders = useMemo(
    () =>
      [...orders].sort((a, b) => {
        const aDate = new Date(a.created_at).getTime();
        const bDate = new Date(b.created_at).getTime();
        return bDate - aDate;
      }),
    [orders]
  );

  const loadOrders = async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    setListError(null);

    try {
      const data = await listOrders();
      setOrders(data);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "No se pudieron cargar los pedidos.";
      setListError(message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    void loadOrders();
  }, []);

  const handleDeleteOrder = async (order: Order) => {
    const confirmed = window.confirm("Eliminar este pedido?");
    if (!confirmed) return;

    setActionMessage(null);
    setListError(null);

    try {
      await deleteOrder(order.id);
      setOrders((prev) => prev.filter((item) => item.id !== order.id));
      setActionMessage("Pedido eliminado.");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "No se pudo eliminar el pedido.";
      setListError(message);
    }
  };

  return (
    <section className="card rounded-3xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-slate-900">
          Pedidos ({sortedOrders.length})
        </h2>
        <button
          type="button"
          onClick={() => void loadOrders(true)}
          disabled={isRefreshing}
          className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isRefreshing ? "Recargando..." : "Recargar"}
        </button>
      </div>

      {actionMessage && <p className="mt-3 text-sm text-emerald-700">{actionMessage}</p>}

      {isLoading ? (
        <p className="mt-4 text-sm text-slate-500">Cargando pedidos...</p>
      ) : listError ? (
        <p className="mt-4 text-sm text-rose-600">{listError}</p>
      ) : sortedOrders.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">Todavia no hay pedidos guardados.</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {sortedOrders.map((order) => {
            const detailPreview = buildOrderDetailPreview(order.order_details);
            const customerName =
              getCustomerNameFromDetails(order.order_details) ??
              getCustomerNameFromWhatsAppMessage(order.whatsapp_message);
            const imagePreview = buildOrderImagePreview(order.order_details);

            return (
              <li
                key={order.id}
                className="rounded-2xl border border-slate-200 bg-white p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {formatDateTime(order.created_at)}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {order.summary}
                    </p>
                    {customerName ? (
                      <p className="mt-1 text-sm text-slate-700">
                        Cliente:{" "}
                        <span className="font-semibold text-slate-900">
                          {customerName}
                        </span>
                      </p>
                    ) : null}
                    <p className="mt-1 text-sm font-medium text-slate-700">
                      Total: {formatCurrency(order.total)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleDeleteOrder(order)}
                    className="rounded-full border border-rose-200 px-4 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                  >
                    Eliminar
                  </button>
                </div>

                {imagePreview.items.length > 0 ? (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {imagePreview.items.map((item) => (
                      <div
                        key={item.key}
                        className="h-16 w-16 overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
                      >
                        <img
                          src={item.src}
                          alt={item.alt}
                          className="h-full w-full object-contain p-1"
                          loading="lazy"
                        />
                      </div>
                    ))}
                    {imagePreview.extraCount > 0 ? (
                      <span className="inline-flex h-16 min-w-16 items-center justify-center rounded-xl border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-600">
                        +{imagePreview.extraCount}
                      </span>
                    ) : null}
                  </div>
                ) : null}

                {detailPreview ? (
                  <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-xs text-slate-700">
                    {detailPreview}
                  </pre>
                ) : null}

                <details className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <summary className="cursor-pointer text-xs font-semibold text-slate-700">
                    Ver mensaje y detalle completo
                  </summary>
                  <div className="mt-3 text-xs text-slate-700">
                    <div>
                      <p className="font-semibold text-slate-800">Mensaje WhatsApp</p>
                      <pre className="mt-1 whitespace-pre-wrap rounded-lg bg-white p-2">
                        {order.whatsapp_message}
                      </pre>
                    </div>
                  </div>
                </details>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
