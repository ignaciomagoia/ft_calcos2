"use client";

import { useState } from "react";
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

export const ProductCard = ({ product }: Props) => {
  const image = product.image_url || buildImagePlaceholder(product.name);
  const [isOpen, setIsOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedSizeCm, setSelectedSizeCm] = useState<ProductSizeCm | null>(
    null
  );

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

  const openConfigurator = () => {
    setQuantity(1);
    setSelectedSizeCm(null);
    setIsOpen(true);
  };

  const decrement = () => setQuantity((prev) => Math.max(prev - 1, 1));
  const increment = () => setQuantity((prev) => Math.min(prev + 1, 99));

  return (
    <>
      <div className="flex items-center justify-center">
        <button
          type="button"
          onClick={openConfigurator}
          className="group inline-flex w-full items-center justify-center rounded-2xl p-1 transition"
          aria-label={`Configurar ${product.name}`}
        >
          <img
            src={image}
            alt={product.name}
            className="h-auto w-full max-w-[130px] object-contain drop-shadow-[0_8px_10px_rgba(15,23,42,0.28)] transition duration-300 group-hover:scale-105"
            loading="lazy"
          />
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]"
            aria-label="Cerrar configurador"
            onClick={() => setIsOpen(false)}
          />

          <div className="card relative z-10 w-full max-w-md rounded-3xl p-5 shadow-2xl">
            <button
              type="button"
              className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
              aria-label="Cerrar"
              onClick={() => setIsOpen(false)}
            >
              x
            </button>

            <div className="mx-auto mb-3 flex w-full max-w-[180px] items-center justify-center">
              <img
                src={image}
                alt={product.name}
                className="h-auto w-full object-contain drop-shadow-[0_8px_12px_rgba(15,23,42,0.28)]"
              />
            </div>

            <div className="space-y-1 text-center">
              <p className="text-lg font-semibold leading-tight text-slate-900">
                {product.name}
              </p>
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

            {hasSizes && (
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
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
                      name={`size-${product.id}`}
                      value={option.sizeCm}
                      checked={selectedSizeCm === option.sizeCm}
                      onChange={() => setSelectedSizeCm(option.sizeCm)}
                      className="sr-only"
                    />
                  </label>
                ))}
              </div>
            )}

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

                <AddToCartButton
                  product={product}
                  unitPrice={unitPrice ?? 0}
                  sizeCm={selectedSizeCm}
                  quantity={quantity}
                  disabled={hasSizes && !selectedSizeCm}
                  disabledLabel="Elegí tamaño"
                  onAdded={() => setIsOpen(false)}
                />
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
          </div>
        </div>
      )}
    </>
  );
};
