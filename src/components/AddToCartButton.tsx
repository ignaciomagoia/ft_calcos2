"use client";

import { useState, useTransition } from "react";
import { useCartStore } from "@/lib/cartStore";
import type { Product } from "@/lib/types";

type Props = {
  product: Pick<Product, "id" | "name" | "price" | "image_url">;
  quantity?: number;
  variant?: "primary" | "secondary";
  fullWidth?: boolean;
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
  quantity = 1,
  variant = "primary",
  fullWidth = true,
}: Props) => {
  const addItem = useCartStore((state) => state.addItem);
  const [added, setAdded] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleAdd = () => {
    startTransition(() => {
      addItem(
        {
          id: product.id,
          name: product.name,
          price: product.price,
          imageUrl: product.image_url,
        },
        quantity
      );
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
    >
      {added ? "Agregado" : "Agregar"}
    </button>
  );
};
