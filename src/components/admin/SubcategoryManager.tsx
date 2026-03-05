"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type {
  Category,
  Product,
  ProductSubcategoryLink,
  Subcategory,
} from "@/lib/types";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { compareNamesWithTrailingNumber, slugify } from "@/lib/utils";

type Props = {
  categories: Category[];
  products: Product[];
};

const normalizeSearchText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const isMissingTableError = (error: any) => error?.code === "42P01";

const sortSubcategories = (items: Subcategory[]) =>
  [...items].sort((a, b) => {
    const aOrder = a.sort_order ?? 0;
    const bOrder = b.sort_order ?? 0;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return a.name.localeCompare(b.name, "es", { sensitivity: "base" });
  });

export const SubcategoryManager = ({ categories, products }: Props) => {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    categories[0]?.id ?? ""
  );
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [links, setLinks] = useState<ProductSubcategoryLink[]>([]);
  const [activeSubcategoryId, setActiveSubcategoryId] = useState<string | null>(
    null
  );
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [newSubcategoryName, setNewSubcategoryName] = useState("");
  const [newSubcategorySortOrder, setNewSubcategorySortOrder] = useState("0");
  const [loading, setLoading] = useState(false);
  const [savingAssignments, setSavingAssignments] = useState(false);
  const [schemaMissing, setSchemaMissing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedCategoryId && categories[0]?.id) {
      setSelectedCategoryId(categories[0].id);
    }
  }, [categories, selectedCategoryId]);

  const loadData = async () => {
    setLoading(true);
    setMessage(null);
    setError(null);

    const [subcategoriesResult, linksResult] = await Promise.all([
      supabase
        .from("subcategories")
        .select("*")
        .order("sort_order", { ascending: true, nullsFirst: false })
        .order("name", { ascending: true }),
      supabase.from("product_subcategories").select("subcategory_id, product_id"),
    ]);

    if (subcategoriesResult.error || linksResult.error) {
      const firstError = subcategoriesResult.error ?? linksResult.error;

      if (isMissingTableError(firstError)) {
        setSchemaMissing(true);
        setSubcategories([]);
        setLinks([]);
        setError(
          "Faltan tablas de subcategorias en Supabase. Ejecuta las queries SQL y recarga esta pagina."
        );
      } else {
        setError(firstError?.message ?? "No se pudo cargar subcategorias.");
      }
      setLoading(false);
      return;
    }

    setSchemaMissing(false);
    setSubcategories(sortSubcategories(subcategoriesResult.data ?? []));
    setLinks(linksResult.data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visibleSubcategories = useMemo(
    () =>
      sortSubcategories(
        subcategories.filter(
          (subcategory) => subcategory.category_id === selectedCategoryId
        )
      ),
    [subcategories, selectedCategoryId]
  );

  useEffect(() => {
    if (
      !activeSubcategoryId ||
      !visibleSubcategories.some(
        (subcategory) => subcategory.id === activeSubcategoryId
      )
    ) {
      setActiveSubcategoryId(visibleSubcategories[0]?.id ?? null);
    }
  }, [activeSubcategoryId, visibleSubcategories]);

  const activeSubcategoryLinks = useMemo(
    () =>
      activeSubcategoryId
        ? links.filter((link) => link.subcategory_id === activeSubcategoryId)
        : [],
    [activeSubcategoryId, links]
  );

  useEffect(() => {
    setSelectedProductIds(activeSubcategoryLinks.map((link) => link.product_id));
  }, [activeSubcategoryLinks, activeSubcategoryId]);

  const categoryProducts = useMemo(() => {
    const filtered = products.filter(
      (product) => product.category_id === selectedCategoryId
    );

    return [...filtered].sort((a, b) =>
      compareNamesWithTrailingNumber(a.name, b.name)
    );
  }, [products, selectedCategoryId]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = normalizeSearchText(productSearchTerm);
    if (!normalizedSearch) return categoryProducts;

    return categoryProducts.filter((product) =>
      normalizeSearchText(product.name).includes(normalizedSearch)
    );
  }, [categoryProducts, productSearchTerm]);

  const selectedProductIdsSet = useMemo(
    () => new Set(selectedProductIds),
    [selectedProductIds]
  );

  const createUniqueSubcategorySlug = (name: string) => {
    const base = slugify(name) || "subcategoria";
    const existing = new Set(
      visibleSubcategories.map((subcategory) => subcategory.slug)
    );

    if (!existing.has(base)) return base;

    let index = 2;
    let candidate = `${base}-${index}`;
    while (existing.has(candidate)) {
      index += 1;
      candidate = `${base}-${index}`;
    }
    return candidate;
  };

  const handleCreateSubcategory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedCategoryId) {
      setError("Selecciona una categoria primero.");
      return;
    }

    const trimmedName = newSubcategoryName.trim();
    if (!trimmedName) {
      setError("Ingresa un nombre de subcategoria.");
      return;
    }

    setError(null);
    setMessage(null);
    setLoading(true);

    const payload = {
      category_id: selectedCategoryId,
      name: trimmedName,
      slug: createUniqueSubcategorySlug(trimmedName),
      sort_order: Number(newSubcategorySortOrder || 0),
    };

    const { data, error: insertError } = await supabase
      .from("subcategories")
      .insert(payload)
      .select("*")
      .single();

    if (insertError || !data) {
      setError(insertError?.message ?? "No se pudo crear la subcategoria.");
      setLoading(false);
      return;
    }

    setSubcategories((prev) => sortSubcategories([...prev, data]));
    setNewSubcategoryName("");
    setNewSubcategorySortOrder("0");
    setActiveSubcategoryId(data.id);
    setMessage("Subcategoria creada.");
    setLoading(false);
  };

  const handleDeleteSubcategory = async (subcategory: Subcategory) => {
    const confirmed = window.confirm(
      `¿Eliminar la subcategoria "${subcategory.name}"?`
    );
    if (!confirmed) return;

    setError(null);
    setMessage(null);
    setLoading(true);

    const { error: deleteError } = await supabase
      .from("subcategories")
      .delete()
      .eq("id", subcategory.id);

    if (deleteError) {
      setError(deleteError.message);
      setLoading(false);
      return;
    }

    setSubcategories((prev) =>
      prev.filter((item) => item.id !== subcategory.id)
    );
    setLinks((prev) =>
      prev.filter((item) => item.subcategory_id !== subcategory.id)
    );
    setMessage("Subcategoria eliminada.");
    setLoading(false);
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectVisibleProducts = () => {
    const visibleIds = filteredProducts.map((product) => product.id);
    setSelectedProductIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
  };

  const handleClearSelectedProducts = () => {
    setSelectedProductIds([]);
  };

  const handleSaveAssignments = async () => {
    if (!activeSubcategoryId) {
      setError("Selecciona una subcategoria.");
      return;
    }

    setSavingAssignments(true);
    setError(null);
    setMessage(null);

    const currentAssignedSet = new Set(
      links
        .filter((link) => link.subcategory_id === activeSubcategoryId)
        .map((link) => link.product_id)
    );
    const desiredSet = new Set(selectedProductIds);

    const toInsert = Array.from(desiredSet).filter(
      (productId) => !currentAssignedSet.has(productId)
    );
    const toDelete = Array.from(currentAssignedSet).filter(
      (productId) => !desiredSet.has(productId)
    );

    if (toInsert.length > 0) {
      const { error: insertError } = await supabase
        .from("product_subcategories")
        .insert(
          toInsert.map((productId) => ({
            subcategory_id: activeSubcategoryId,
            product_id: productId,
          }))
        );

      if (insertError) {
        setError(insertError.message);
        setSavingAssignments(false);
        return;
      }
    }

    if (toDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from("product_subcategories")
        .delete()
        .eq("subcategory_id", activeSubcategoryId)
        .in("product_id", toDelete);

      if (deleteError) {
        setError(deleteError.message);
        setSavingAssignments(false);
        return;
      }
    }

    setLinks((prev) => {
      const withoutActiveSubcategory = prev.filter(
        (link) => link.subcategory_id !== activeSubcategoryId
      );
      const rebuilt = Array.from(desiredSet).map((productId) => ({
        subcategory_id: activeSubcategoryId,
        product_id: productId,
      }));
      return [...withoutActiveSubcategory, ...rebuilt];
    });

    setMessage("Asignaciones guardadas.");
    setSavingAssignments(false);
  };

  if (schemaMissing) {
    return (
      <section className="card rounded-3xl p-6">
        <h2 className="text-xl font-semibold">Subcategorias y filtros</h2>
        <p className="mt-2 text-sm text-rose-600">
          {error ??
            "Faltan tablas en Supabase para subcategorias. Ejecuta las queries SQL."}
        </p>
      </section>
    );
  }

  return (
    <section className="card rounded-3xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Subcategorias y filtros</h2>
        <select
          value={selectedCategoryId}
          onChange={(event) => setSelectedCategoryId(event.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <p className="mt-1 text-sm text-slate-500">
        Crea subcategorias por categoria y asigna calcos ya subidas.
      </p>

      <form
        className="mt-4 grid gap-3 rounded-2xl border border-slate-200 p-4 md:grid-cols-[1fr,120px,auto]"
        onSubmit={handleCreateSubcategory}
      >
        <input
          type="text"
          value={newSubcategoryName}
          onChange={(event) => setNewSubcategoryName(event.target.value)}
          placeholder="Nombre de subcategoria (ej: Futbol)"
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
        />
        <input
          type="number"
          min="0"
          value={newSubcategorySortOrder}
          onChange={(event) => setNewSubcategorySortOrder(event.target.value)}
          placeholder="Orden"
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-[var(--color-primary)] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-dark)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          Crear
        </button>
      </form>

      <div className="mt-4 space-y-2">
        {visibleSubcategories.length === 0 ? (
          <p className="text-sm text-slate-500">
            Esta categoria no tiene subcategorias todavia.
          </p>
        ) : (
          visibleSubcategories.map((subcategory) => {
            const assignedCount = links.filter(
              (link) => link.subcategory_id === subcategory.id
            ).length;

            return (
              <div
                key={subcategory.id}
                className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2 ${
                  activeSubcategoryId === subcategory.id
                    ? "border-[var(--color-primary)] bg-slate-50"
                    : "border-slate-200"
                }`}
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800">
                    {subcategory.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {assignedCount} calco(s) asignadas
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setActiveSubcategoryId(subcategory.id)}
                    className="rounded-full border border-slate-300 px-3 py-1 text-slate-700 transition hover:bg-slate-100"
                  >
                    Asignar calcos
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteSubcategory(subcategory)}
                    className="rounded-full border border-rose-200 px-3 py-1 text-rose-600 transition hover:bg-rose-50"
                  >
                    Borrar
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {activeSubcategoryId ? (
        <div className="mt-5 rounded-2xl border border-slate-200 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-slate-800">
              Asignacion de calcos
            </p>
            <span className="text-xs text-slate-500">
              Seleccionadas: {selectedProductIds.length}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={productSearchTerm}
              onChange={(event) => setProductSearchTerm(event.target.value)}
              placeholder="Buscar calco por nombre"
              className="w-full max-w-xs rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleSelectVisibleProducts}
              className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Seleccionar visibles
            </button>
            <button
              type="button"
              onClick={handleClearSelectedProducts}
              className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Limpiar seleccion
            </button>
          </div>

          <div className="mt-3 max-h-72 space-y-2 overflow-y-auto rounded-xl border border-slate-100 p-2">
            {filteredProducts.length === 0 ? (
              <p className="px-1 py-2 text-sm text-slate-500">
                No hay calcos para esta categoria.
              </p>
            ) : (
              filteredProducts.map((product) => (
                <label
                  key={product.id}
                  className="flex items-center gap-2 rounded-lg border border-slate-100 px-2 py-2 text-sm text-slate-700"
                >
                  <input
                    type="checkbox"
                    checked={selectedProductIdsSet.has(product.id)}
                    onChange={() => toggleProductSelection(product.id)}
                    className="h-4 w-4 rounded border-slate-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                  />
                  <span className="truncate font-medium">{product.name}</span>
                </label>
              ))
            )}
          </div>

          <button
            type="button"
            onClick={handleSaveAssignments}
            disabled={savingAssignments}
            className="mt-3 rounded-full bg-[var(--color-primary)] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-dark)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Guardar asignacion
          </button>
        </div>
      ) : null}

      {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
      {message ? <p className="mt-3 text-sm text-slate-500">{message}</p> : null}
      {loading ? <p className="mt-3 text-xs text-slate-400">Cargando...</p> : null}
    </section>
  );
};

