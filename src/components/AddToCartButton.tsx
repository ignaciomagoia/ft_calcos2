"use client";

import { useState, useTransition } from "react";
import { useCartStore } from "@/lib/cartStore";
import type { Product } from "@/lib/types";
import type { ProductSizeCm } from "@/lib/productPricing";

type Props = {
  product: Pick<Product, "id" | "name" | "image_url">;
  unitPrice: number;
  sizeCm?: ProductSizeCm | null;
  sizeOptions?: Array<{ sizeCm: ProductSizeCm; price: number }>;
  quantity?: number;
  variant?: "primary" | "secondary";
  fullWidth?: boolean;
  disabled?: boolean;
  disabledLabel?: string;
  onAdded?: () => void;
  onDisabledClick?: () => void;
};

const baseStyles =
  "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";

const variants: Record<string, string> = {
  primary:
    "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] focus-visible:outline-[var(--color-primary)]",
  secondary:
    "border border-[var(--color-secondary)] text-[var(--color-primary)] hover:bg-[var(--color-secondary)] hover:text-white focus-visible:outline-[var(--color-secondary)]",
};

export const AddToCartButton = ({
  product,
  unitPrice,
  sizeCm = null,
  sizeOptions = [],
  quantity = 1,
  variant = "primary",
  fullWidth = true,
  disabled = false,
  disabledLabel = "Eleg\u00ed una opci\u00f3n",
  onAdded,
  onDisabledClick,
}: Props) => {
  const addItem = useCartStore((state) => state.addItem);
  const [added, setAdded] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleAdd = () => {
    if (disabled) {
      onDisabledClick?.();
      return;
    }

    startTransition(() => {
      const lineId = `${product.id}:${sizeCm ?? "base"}:${unitPrice}`;
      addItem(
        {
          id: lineId,
          productId: product.id,
          name: product.name,
          unitPrice,
          price: unitPrice,
          sizeCm,
          sizeOptions: sizeOptions.length > 0 ? sizeOptions : undefined,
          imageUrl: product.image_url,
        },
        quantity
      );
      onAdded?.();
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
    });
  };

  return (
    <button
      type="button"
      onClick={handleAdd}
      className={`${baseStyles} ${variants[variant]} ${
        fullWidth ? "w-full" : ""
      }`}
      disabled={isPending}
      aria-disabled={disabled || isPending}
    >
      {added ? "Agregado" : disabled ? disabledLabel : "Agregar"}
    </button>
  );
};
