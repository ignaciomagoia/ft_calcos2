"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Product, Subcategory } from "@/lib/types";
import { compareNamesWithTrailingNumber } from "@/lib/utils";
import { ProductCard } from "./ProductCard";
import { InlineProductCard } from "./InlineProductCard";

type Props = {
  categoryId: string;
  initialProducts: Product[];
  initialTotal: number;
  initialHasMore: boolean;
  pageSize: number;
  subcategories: Subcategory[];
  displayMode?: "compact" | "large";
};

type CatalogProductsApiPayload = {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

const parseCatalogProductsPayload = (
  payload: unknown
): CatalogProductsApiPayload | null => {
  if (!payload || typeof payload !== "object") return null;

  const raw = payload as Partial<CatalogProductsApiPayload>;
  if (
    !Array.isArray(raw.items) ||
    typeof raw.total !== "number" ||
    typeof raw.page !== "number" ||
    typeof raw.pageSize !== "number" ||
    typeof raw.hasMore !== "boolean"
  ) {
    return null;
  }

  return {
    items: raw.items as Product[],
    total: raw.total,
    page: raw.page,
    pageSize: raw.pageSize,
    hasMore: raw.hasMore,
  };
};

const normalizeAndSortProducts = (items: Product[]) => {
  const uniqueById = new Map<string, Product>();
  for (const item of items) {
    uniqueById.set(item.id, item);
  }

  return Array.from(uniqueById.values()).sort((a, b) =>
    compareNamesWithTrailingNumber(a.name, b.name)
  );
};

export const CategoryProductsGrid = ({
  categoryId,
  initialProducts,
  initialTotal,
  initialHasMore,
  pageSize,
  subcategories,
  displayMode = "compact",
}: Props) => {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeSubcategoryId, setActiveSubcategoryId] = useState<string | null>(
    null
  );
  const [products, setProducts] = useState<Product[]>(() =>
    normalizeAndSortProducts(initialProducts)
  );
  const [total, setTotal] = useState(initialTotal);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const requestSeqRef = useRef(0);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const appendLoadingRef = useRef(false);

  const activeSubcategoryName = useMemo(() => {
    if (!activeSubcategoryId) return null;
    return (
      subcategories.find((subcategory) => subcategory.id === activeSubcategoryId)
        ?.name ?? null
    );
  }, [activeSubcategoryId, subcategories]);

  const hasSubcategories = subcategories.length > 0;
  const isLargeMode = displayMode === "large";

  const resetToInitialProducts = useCallback(() => {
    setProducts(normalizeAndSortProducts(initialProducts));
    setTotal(initialTotal);
    setCurrentPage(1);
    setHasMore(initialHasMore);
    setFetchError(null);
    appendLoadingRef.current = false;
  }, [initialProducts, initialTotal, initialHasMore]);

  const fetchCatalogPage = useCallback(
    async (page: number, subcategoryId: string | null) => {
      const params = new URLSearchParams({
        categoryId,
        page: String(page),
        pageSize: String(pageSize),
      });

      if (subcategoryId) {
        params.set("subcategoryId", subcategoryId);
      }

      const response = await fetch(`/api/catalog/products?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
      });
      const payload = parseCatalogProductsPayload(await response.json());

      if (!response.ok || !payload) {
        throw new Error("No se pudo cargar el catalogo.");
      }

      return payload;
    },
    [categoryId, pageSize]
  );

  const loadPage = useCallback(
    async (page: number, mode: "replace" | "append", subcategoryId: string | null) => {
      const requestId = requestSeqRef.current + 1;
      requestSeqRef.current = requestId;
      setIsLoading(true);

      try {
        const payload = await fetchCatalogPage(page, subcategoryId);
        if (requestSeqRef.current !== requestId) return;

        setFetchError(null);
        setCurrentPage(payload.page);
        setTotal(payload.total);
        setHasMore(payload.hasMore);
        setProducts((prev) =>
          mode === "replace"
            ? normalizeAndSortProducts(payload.items)
            : normalizeAndSortProducts([...prev, ...payload.items])
        );
      } catch (error: unknown) {
        if (requestSeqRef.current !== requestId) return;
        const message =
          error instanceof Error ? error.message : "No se pudo cargar productos.";
        setFetchError(message);
      } finally {
        if (requestSeqRef.current === requestId) {
          setIsLoading(false);
        }
        if (mode === "append") {
          appendLoadingRef.current = false;
        }
      }
    },
    [fetchCatalogPage]
  );

  useEffect(() => {
    setFiltersOpen(false);
    setActiveSubcategoryId(null);
    resetToInitialProducts();
  }, [categoryId, resetToInitialProducts]);

  useEffect(() => {
    if (!activeSubcategoryId) {
      resetToInitialProducts();
      return;
    }

    void loadPage(1, "replace", activeSubcategoryId);
  }, [activeSubcategoryId, loadPage, resetToInitialProducts]);

  const handleLoadMore = useCallback(() => {
    if (isLoading || !hasMore || appendLoadingRef.current) return;
    appendLoadingRef.current = true;
    void loadPage(currentPage + 1, "append", activeSubcategoryId);
  }, [activeSubcategoryId, currentPage, hasMore, isLoading, loadPage]);

  useEffect(() => {
    const target = sentinelRef.current;
    if (!target) return;
    if (!hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const isVisible = entries.some((entry) => entry.isIntersecting);
        if (!isVisible) return;
        handleLoadMore();
      },
      {
        root: null,
        rootMargin: "220px 0px",
        threshold: 0.01,
      }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [handleLoadMore, hasMore]);

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

      {fetchError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {fetchError}
        </div>
      ) : null}

      {products.length === 0 && !isLoading ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center text-slate-500">
          {activeSubcategoryName
            ? `No hay productos en la subcategoria ${activeSubcategoryName}.`
            : "No hay productos activos en esta categoria."}
        </div>
      ) : (
        <div
          className={
            isLargeMode
              ? "grid grid-cols-1 gap-4 sm:gap-5"
              : "grid grid-cols-3 gap-3 sm:gap-4 md:grid-cols-6 lg:gap-5"
          }
        >
          {products.map((product) =>
            isLargeMode ? (
              <InlineProductCard key={product.id} product={product} />
            ) : (
              <ProductCard key={product.id} product={product} />
            )
          )}
        </div>
      )}

      {hasMore ? (
        <div
          ref={sentinelRef}
          className="flex h-10 items-center justify-center"
          aria-hidden="true"
        >
          {isLoading ? (
            <span className="inline-flex h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-[var(--color-primary)]" />
          ) : null}
        </div>
      ) : null}
    </div>
  );
};
