"use client";

import { useState } from "react";
import type { Product } from "@/lib/types";
import { AddToCartButton } from "./AddToCartButton";
import { buildImagePlaceholder, formatCurrency } from "@/lib/utils";

type Props = {
  product: Product;
};

export const ProductDetail = ({ product }: Props) => {
  const [quantity, setQuantity] = useState(1);
  const image = product.image_url || buildImagePlaceholder(product.name);

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
            {formatCurrency(product.price)}
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-500">Cantidad</p>
          <div className="inline-flex items-center gap-3 rounded-full border border-slate-200 px-4 py-2 text-lg">
            <button
              type="button"
              onClick={decrease}
              className="text-2xl text-slate-500 transition hover:text-slate-900"
            >
              −
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

        <AddToCartButton product={product} quantity={quantity} />

        <p className="text-sm text-slate-500">
          Pago por transferencia bancaria. Envíos coordinados por WhatsApp.
        </p>
      </div>
    </div>
  );
};
