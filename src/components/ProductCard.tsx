"use client";

import { useState } from "react";
import type { Product } from "@/lib/types";
import { AddToCartButton } from "./AddToCartButton";
import { buildImagePlaceholder, formatCurrency } from "@/lib/utils";

type Props = {
  product: Product;
};

export const ProductCard = ({ product }: Props) => {
  const image = product.image_url || buildImagePlaceholder(product.name);
  const [quantity, setQuantity] = useState(1);

  const decrement = () => setQuantity((prev) => Math.max(prev - 1, 1));
  const increment = () => setQuantity((prev) => Math.min(prev + 1, 99));

  return (
    <div className="card flex h-full flex-col gap-4 rounded-3xl p-4">
      <div className="group relative cursor-default overflow-hidden rounded-2xl bg-slate-100">
        <div className="aspect-square">
          <img
            src={image}
            alt={product.name}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            loading="lazy"
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3">
        <div className="space-y-1">
          <p className="text-lg font-semibold leading-tight text-slate-900">
            {product.name}
          </p>
          <p className="text-base font-medium text-slate-600">
            {formatCurrency(product.price)}
          </p>
        </div>

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

        <AddToCartButton product={product} quantity={quantity} />
      </div>
    </div>
  );
};
