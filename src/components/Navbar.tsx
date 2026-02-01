"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { useCartStore } from "@/lib/cartStore";

const Navbar = () => {
  const items = useCartStore((state) => state.items);
  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  return (
    <header className="border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/image.png"
            alt="EFETE Calcos"
            width={36}
            height={36}
            className="h-8 w-8 rounded-full object-cover"
            priority
          />
          <span className="text-lg font-semibold tracking-tight text-slate-900">
            EFETE CALCOS
          </span>
        </Link>

        <div className="flex items-center gap-4 text-sm font-medium">
          <Link
            href="/cart"
            className="relative flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <CartIcon />
            <span>Carrito</span>
            <span className="pill pill--accent text-[var(--color-primary)]">
              {itemCount}
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
};

const CartIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61H19a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
);

export default Navbar;
