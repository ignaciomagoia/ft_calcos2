"use client";

import Link from "next/link";
import type { Category } from "@/lib/types";

type MobileMenuDrawerProps = {
  open: boolean;
  onClose: () => void;
  categories: Category[];
};

const MobileMenuDrawer = ({
  open,
  onClose,
  categories,
}: MobileMenuDrawerProps) => {
  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-slate-900/40 transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden={!open}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-full flex-col border-r border-slate-200 bg-white p-6 shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Menú principal"
      >
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
            Catálogo
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50"
            aria-label="Cerrar menú"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <nav className="mt-6 space-y-2">
          {categories.length === 0 ? (
            <p className="text-sm text-slate-500">
              Aún no hay categorías disponibles.
            </p>
          ) : (
            categories.map((category) => (
              <Link
                key={category.id}
                href={
                  category.id === "fake-personalizados-menu"
                    ? "/personalizados"
                    : category.id === "fake-planchas-personalizadas-menu"
                    ? "/planchas-personalizadas"
                    : category.id === "fake-personalizadas-por-mayor-menu"
                    ? "/personalizadas-por-mayor"
                    : `/c/${category.slug}`
                }
                className="block rounded-2xl border border-slate-100 px-4 py-3 text-lg font-medium text-slate-800 transition hover:-translate-x-1 hover:border-[var(--color-secondary)] hover:bg-[var(--color-secondary-light)]"
              >
                {category.name}
              </Link>
            ))
          )}
        </nav>
      </aside>
    </>
  );
};

export default MobileMenuDrawer;

