"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import type { Category } from "@/lib/types";
import { useCartStore } from "@/lib/cartStore";
import MobileMenuDrawer from "./MobileMenuDrawer";

type NavbarClientProps = {
  categories: Category[];
};

const NavbarClient = ({ categories }: NavbarClientProps) => {
  const pathname = usePathname();
  const items = useCartStore((state) => state.items);
  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    setIsDrawerOpen(false);
  }, [pathname]);

  const toggleDrawer = () => setIsDrawerOpen((prev) => !prev);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 border-b border-slate-200 bg-white/90 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/70">
        <div className="mx-auto flex w-full max-w-6xl items-center px-4 py-2 sm:px-6 sm:py-4 lg:px-8">
          <div className="relative flex w-full items-center justify-between">
            <button
              type="button"
              onClick={toggleDrawer}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 sm:h-11 sm:w-11"
              aria-label="Abrir menú"
              aria-expanded={isDrawerOpen}
            >
              <span className="sr-only">Abrir menú</span>
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <line x1="4" y1="7" x2="20" y2="7" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="17" x2="20" y2="17" />
              </svg>
            </button>

            <Link
              href="/"
              className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center"
              aria-label="Inicio"
            >
              <Image
                src="/imagenvariante.png"
                alt="EFETE Calcos"
                width={36}
                height={36}
                className="h-8 w-8 rounded-full object-contain sm:h-10 sm:w-10"
                priority
              />
            </Link>

            <Link
              href="/cart"
              className="relative inline-flex h-9 items-center gap-1.5 rounded-full border border-slate-200 px-2 text-[11px] font-medium leading-none transition hover:border-slate-300 hover:bg-slate-50 sm:h-auto sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"
            >
              <CartIcon />
              <span className="sr-only sm:not-sr-only">Carrito</span>
              <span className="pill pill--accent px-2 py-0.5 text-[10px] text-[var(--color-primary)] sm:px-3 sm:py-1 sm:text-xs">
                {itemCount}
              </span>
            </Link>
          </div>
        </div>
      </header>

      <MobileMenuDrawer
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        categories={categories}
      />
    </>
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
    className="h-4 w-4 sm:h-[18px] sm:w-[18px]"
  >
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61H19a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
);

export default NavbarClient;
