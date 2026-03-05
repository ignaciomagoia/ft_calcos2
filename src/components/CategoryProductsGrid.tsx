"use client";

import { useMemo, useState } from "react";
import type { Product, ProductSubcategoryLink, Subcategory } from "@/lib/types";
import { ProductCard } from "./ProductCard";

type Props = {
  products: Product[];
  subcategories: Subcategory[];
  links: ProductSubcategoryLink[];
};

export const CategoryProductsGrid = ({ products, subcategories, links }: Props) => {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeSubcategoryId, setActiveSubcategoryId] = useState<string | null>(
    null
  );

  const subcategoryNameById = useMemo(
    () =>
      new Map(
        subcategories.map((subcategory) => [subcategory.id, subcategory.name] as const)
      ),
    [subcategories]
  );

  const productIdsBySubcategory = useMemo(() => {
    const map = new Map<string, Set<string>>();

    for (const link of links) {
      const current = map.get(link.subcategory_id);
      if (current) {
        current.add(link.product_id);
      } else {
        map.set(link.subcategory_id, new Set([link.product_id]));
      }
    }

    return map;
  }, [links]);

  const filteredProducts = useMemo(() => {
    if (!activeSubcategoryId) return products;

    const allowed = productIdsBySubcategory.get(activeSubcategoryId);
    if (!allowed || allowed.size === 0) return [];

    return products.filter((product) => allowed.has(product.id));
  }, [products, activeSubcategoryId, productIdsBySubcategory]);

  const activeSubcategoryName = activeSubcategoryId
    ? subcategoryNameById.get(activeSubcategoryId) ?? null
    : null;

  const hasSubcategories = subcategories.length > 0;

  return (
    <div className="space-y-4">
      {hasSubcategories ? (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setFiltersOpen((prev) => !prev)}
            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            {activeSubcategoryName ? `Filtrar: ${activeSubcategoryName}` : "Filtrar"}
          </button>
          {activeSubcategoryId ? (
            <button
              type="button"
              onClick={() => setActiveSubcategoryId(null)}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Quitar filtro
            </button>
          ) : null}
        </div>
      ) : null}

      {hasSubcategories && filtersOpen ? (
        <div className="flex flex-wrap gap-2 rounded-3xl border border-slate-200 bg-white p-3">
          <button
            type="button"
            onClick={() => setActiveSubcategoryId(null)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              activeSubcategoryId === null
                ? "bg-[var(--color-primary)] text-white"
                : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            Todas
          </button>
          {subcategories.map((subcategory) => (
            <button
              key={subcategory.id}
              type="button"
              onClick={() => setActiveSubcategoryId(subcategory.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                activeSubcategoryId === subcategory.id
                  ? "bg-[var(--color-primary)] text-white"
                  : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {subcategory.name}
            </button>
          ))}
        </div>
      ) : null}

      {filteredProducts.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center text-slate-500">
          {activeSubcategoryName
            ? `No hay productos en la subcategoría ${activeSubcategoryName}.`
            : "No hay productos activos en esta categoría."}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:gap-4 lg:grid-cols-6 lg:gap-5">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

