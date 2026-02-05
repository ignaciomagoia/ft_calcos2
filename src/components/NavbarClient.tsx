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
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/70">
        <div className="mx-auto flex w-full max-w-6xl items-center px-4 py-4 sm:px-6 lg:px-8">
          <div className="grid w-full grid-cols-3 items-center">
            <div className="flex justify-start">
              <button
                type="button"
                onClick={toggleDrawer}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
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
            </div>

            <div className="flex justify-center">
              <Link href="/" className="flex items-center gap-3">
                <Image
                  src="/imagenvariante.png"
                  alt="EFETE Calcos"
                  width={36}
                  height={36}
                  className="h-9 w-9 rounded-full object-contain"
                  priority
                />
                <span className="text-lg font-semibold tracking-tight text-slate-900">
                  EFETE CALCOS
                </span>
              </Link>
            </div>

            <div className="flex justify-end">
              <Link
                href="/cart"
                className="relative inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium transition hover:border-slate-300 hover:bg-slate-50"
              >
                <CartIcon />
                <span>Carrito</span>
                <span className="pill pill--accent text-[var(--color-primary)]">
                  {itemCount}
                </span>
              </Link>
            </div>
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
  >
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61H19a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
);

export default NavbarClient;
