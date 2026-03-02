"use client";

import { useEffect, useMemo, useState } from "react";
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

export const ProductDetail = ({ product }: Props) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedSizeCm, setSelectedSizeCm] = useState<ProductSizeCm | null>(
    null
  );
  const [selectionError, setSelectionError] = useState("");

  const image = product.image_url || buildImagePlaceholder(product.name);
  const sizeOptions = useMemo(() => getProductSizeOptions(product), [product]);
  const hasSizeOptions = sizeOptions.length > 0;
  const legacyPrice = getLegacyProductPrice(product);
  const selectedSizeOption = sizeOptions.find(
    (option) => option.sizeCm === selectedSizeCm
  );
  const unitPrice = hasSizeOptions
    ? selectedSizeOption?.price ?? null
    : legacyPrice;

  const consultUrl = `https://wa.me/5493516183951?text=${encodeURIComponent(
    `Hola! Quiero consultar por ${product.name}.`
  )}`;

  useEffect(() => {
    setQuantity(1);
    setSelectedSizeCm(null);
    setSelectionError("");
  }, [product.id]);

  const decrease = () => setQuantity((qty) => Math.max(qty - 1, 1));
  const increase = () => setQuantity((qty) => Math.min(qty + 1, 20));

  return (
    <div className="grid gap-8 lg:grid-cols-[2fr,1.2fr]">
      <div className="card overflow-hidden rounded-3xl">
        <img
          src={image}
          alt={product.name}
          className="h-full w-full object-cover"
        />
      </div>

      <div className="card flex flex-col gap-6 rounded-3xl p-6">
        <div className="space-y-3">
          <p className="pill pill--accent text-xs uppercase tracking-[0.3em]">
            Producto
          </p>
          <h1 className="text-4xl font-semibold leading-tight">
            {product.name}
          </h1>
          <p className="text-3xl font-semibold text-slate-900">
            {unitPrice
              ? formatCurrency(unitPrice)
              : hasSizeOptions
              ? "Eleg\u00ed un tama\u00f1o"
              : "Precio a coordinar"}
          </p>
          {unitPrice && quantity > 1 && (
            <p className="text-sm font-medium text-slate-500">
              Total: {formatCurrency(unitPrice * quantity)}
            </p>
          )}
        </div>

        {hasSizeOptions && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-500">
              {"Eleg\u00ed el tama\u00f1o"}
            </p>
            <div className="grid gap-2 sm:grid-cols-3">
              {sizeOptions.map((option) => (
                <label
                  key={option.sizeCm}
                  className={`flex cursor-pointer items-center justify-between rounded-2xl border px-3 py-2 text-sm transition ${
                    selectedSizeCm === option.sizeCm
                      ? "border-[var(--color-primary)] bg-slate-50 text-slate-900"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <span className="font-semibold">{option.sizeCm} cm</span>
                  <span>{formatCurrency(option.price)}</span>
                  <input
                    type="radio"
                    name="size-cm"
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
            {selectionError ? (
              <p className="text-xs font-medium text-rose-600">{selectionError}</p>
            ) : null}
          </div>
        )}

        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-500">Cantidad</p>
          <div className="inline-flex items-center gap-3 rounded-full border border-slate-200 px-4 py-2 text-lg">
            <button
              type="button"
              onClick={decrease}
              className="text-2xl text-slate-500 transition hover:text-slate-900"
            >
              -
            </button>
            <span className="min-w-[2rem] text-center font-semibold">
              {quantity}
            </span>
            <button
              type="button"
              onClick={increase}
              className="text-2xl text-slate-500 transition hover:text-slate-900"
            >
              +
            </button>
          </div>
        </div>

        {unitPrice ? (
          <AddToCartButton
            product={product}
            unitPrice={unitPrice}
            sizeCm={selectedSizeCm}
            quantity={quantity}
            disabled={hasSizeOptions && !selectedSizeCm}
            disabledLabel="Eleg\u00ed tama\u00f1o"
            onDisabledClick={() =>
              setSelectionError("Eleg\u00ed un tama\u00f1o para continuar.")
            }
          />
        ) : (
          <a
            href={consultUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-full bg-[var(--color-primary)] px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-[var(--color-primary-dark)]"
          >
            Consultar por WhatsApp
          </a>
        )}

        <p className="text-sm text-slate-500">
          {"Pago por transferencia bancaria. Env\u00edos coordinados por WhatsApp."}
        </p>
      </div>
    </div>
  );
};
