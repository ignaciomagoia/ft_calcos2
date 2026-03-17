"use client";

import { useEffect, useRef, useState } from "react";
import type { Product } from "@/lib/types";
import { AddToCartButton } from "./AddToCartButton";
import { buildImagePlaceholder, formatCurrency } from "@/lib/utils";
import {
  type ProductSizeCm,
  getLegacyProductPrice,
  getProductSizeOptions,
} from "@/lib/productPricing";

type Props = {
  product: Product;
};

export const InlineProductCard = ({ product }: Props) => {
  const image = product.image_url || buildImagePlaceholder(product.name);
  const description = product.description?.trim() || "";
  const [quantity, setQuantity] = useState(1);
  const [selectedSizeCm, setSelectedSizeCm] = useState<ProductSizeCm | null>(
    null
  );
  const [selectionError, setSelectionError] = useState("");
  const [showAdded, setShowAdded] = useState(false);
  const addedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sizeOptions = getProductSizeOptions(product);
  const hasSizes = sizeOptions.length > 0;
  const legacyPrice = getLegacyProductPrice(product);
  const selectedSizeOption = sizeOptions.find(
    (option) => option.sizeCm === selectedSizeCm
  );
  const unitPrice = hasSizes ? selectedSizeOption?.price ?? null : legacyPrice;
  const canAddWithoutSize = !hasSizes && typeof unitPrice === "number";
  const consultUrl = `https://wa.me/5493516183951?text=${encodeURIComponent(
    `Hola! Quiero consultar por ${product.name}.`
  )}`;

  const decrement = () => setQuantity((prev) => Math.max(prev - 1, 1));
  const increment = () => setQuantity((prev) => Math.min(prev + 1, 99));

  const handleAdded = () => {
    setShowAdded(true);

    if (addedTimeoutRef.current) {
      clearTimeout(addedTimeoutRef.current);
    }

    addedTimeoutRef.current = setTimeout(() => {
      setShowAdded(false);
      addedTimeoutRef.current = null;
    }, 2200);
  };

  useEffect(() => {
    return () => {
      if (addedTimeoutRef.current) {
        clearTimeout(addedTimeoutRef.current);
      }
    };
  }, []);

  return (
    <article className="card w-full rounded-3xl p-4 sm:p-5">
      <div className="mx-auto mb-3 flex w-full max-w-[290px] items-center justify-center">
        <img
          src={image}
          alt={product.name}
          className="h-auto w-full object-contain drop-shadow-[0_10px_14px_rgba(15,23,42,0.25)]"
          loading="lazy"
        />
      </div>

      <div className="space-y-1 text-center">
        <p className="text-lg font-semibold leading-tight text-slate-900">
          {product.name}
        </p>
        {description ? <p className="text-sm text-slate-500">{description}</p> : null}
        {(!hasSizes || unitPrice) && (
          <p className="text-sm font-medium text-slate-600">
            {hasSizes
              ? `${selectedSizeCm} cm: ${formatCurrency(unitPrice ?? 0)}`
              : unitPrice
              ? formatCurrency(unitPrice)
              : "Consultar por WhatsApp"}
          </p>
        )}
        {unitPrice && quantity > 1 && (
          <p className="text-xs text-slate-500">
            Total: {formatCurrency(unitPrice * quantity)}
          </p>
        )}
      </div>

      {hasSizes ? (
        <div className="mt-4 grid grid-cols-3 gap-2">
          {sizeOptions.map((option) => (
            <label
              key={option.sizeCm}
              className={`flex cursor-pointer items-center justify-between rounded-2xl border px-3 py-2 text-xs transition ${
                selectedSizeCm === option.sizeCm
                  ? "border-[var(--color-primary)] bg-slate-50 text-slate-900"
                  : "border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              <span className="font-semibold">{option.sizeCm} cm</span>
              <span>{formatCurrency(option.price)}</span>
              <input
                type="radio"
                name={`inline-size-${product.id}`}
                value={option.sizeCm}
                checked={selectedSizeCm === option.sizeCm}
                onChange={() => {
                  setSelectedSizeCm(option.sizeCm);
                  setSelectionError("");
                }}
                className="sr-only"
              />
            </label>
          ))}
        </div>
      ) : null}

      {(hasSizes || canAddWithoutSize) ? (
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">
            <button
              type="button"
              onClick={decrement}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 text-base transition hover:bg-slate-100"
              aria-label="Disminuir cantidad"
            >
              -
            </button>
            <span className="tabular-nums">{quantity}</span>
            <button
              type="button"
              onClick={increment}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 text-base transition hover:bg-slate-100"
              aria-label="Aumentar cantidad"
            >
              +
            </button>
          </div>

          {hasSizes && !selectedSizeCm && selectionError ? (
            <p className="text-center text-xs font-medium text-rose-600">
              {selectionError}
            </p>
          ) : null}

          {hasSizes && !selectedSizeCm ? (
            <button
              type="button"
              onClick={() => setSelectionError("Elegí un tamaño para continuar.")}
              className="inline-flex w-full items-center justify-center rounded-full bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-dark)]"
            >
              Agregar
            </button>
          ) : (
            <AddToCartButton
              product={product}
              unitPrice={unitPrice ?? 0}
              sizeCm={selectedSizeCm}
              sizeOptions={sizeOptions}
              quantity={quantity}
              onAdded={handleAdded}
            />
          )}

          {showAdded ? (
            <p className="text-center text-xs font-semibold text-emerald-700">
              ✅ Agregado al carrito
            </p>
          ) : null}
        </div>
      ) : (
        <a
          href={consultUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex w-full items-center justify-center rounded-full border border-[var(--color-secondary)] px-4 py-2 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-secondary)] hover:text-white"
        >
          Consultar por WhatsApp
        </a>
      )}
    </article>
  );
};
