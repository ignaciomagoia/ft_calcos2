"use client";

import { FormEvent, useMemo, useState } from "react";
import type { Category, Product } from "@/lib/types";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { formatCurrency, slugify } from "@/lib/utils";

type Props = {
  initialCategories: Category[];
  initialProducts: Product[];
};

type CategoryFormState = {
  id?: string;
  name: string;
  image_url: string;
  file?: File | null;
  sort_order: string;
};

type ProductFormState = {
  id?: string;
  name: string;
  price: string;
  category_id: string;
  image_url: string;
  active: boolean;
  file?: File | null;
};

const emptyCategoryForm: CategoryFormState = {
  name: "",
  image_url: "",
  file: null,
  sort_order: "0",
};

const createEmptyProductForm = (categoryId?: string): ProductFormState => ({
  name: "",
  price: "",
  category_id: categoryId ?? "",
  image_url: "",
  active: true,
  file: null,
});

const MAX_PRODUCT_IMAGE_BYTES = 350 * 1024;
const ALLOWED_PRODUCT_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const validateProductImageFile = (file: File | null | undefined): string | null => {
  if (!file) return null;

  if (!ALLOWED_PRODUCT_IMAGE_TYPES.includes(file.type)) {
    return "Formato no permitido. Usá JPG, PNG o WebP.";
  }

  if (file.size > MAX_PRODUCT_IMAGE_BYTES) {
    const fileSizeKb = Math.round(file.size / 1024);
    const maxSizeKb = Math.round(MAX_PRODUCT_IMAGE_BYTES / 1024);
    return `La imagen pesa ${fileSizeKb} KB. Máximo permitido: ${maxSizeKb} KB. Reducila y probá de nuevo.`;
  }

  return null;
};

const getStoragePathsFromImageValue = (
  imageValue: string | null | undefined
): string[] => {
  if (!imageValue) return [];

  const cleanValue = imageValue.trim();
  if (!cleanValue) return [];

  const marker = "/storage/v1/object/public/products/";
  const candidates = new Set<string>();
  const normalizePath = (path: string) => {
    const withoutQuery = path.split("?")[0].split("#")[0];
    const normalized = withoutQuery.replace(/^\/+/, "");
    if (
      normalized.startsWith("uploads/") ||
      normalized.startsWith("categories/")
    ) {
      return decodeURIComponent(normalized);
    }
    return null;
  };

  const directPath = normalizePath(cleanValue);
  if (directPath) candidates.add(directPath);

  try {
    const parsedUrl = new URL(cleanValue);
    const markerIndex = parsedUrl.pathname.indexOf(marker);
    if (markerIndex >= 0) {
      const fromMarker = normalizePath(
        parsedUrl.pathname.slice(markerIndex + marker.length)
      );
      if (fromMarker) candidates.add(fromMarker);
    }

    const uploadsIndex = parsedUrl.pathname.indexOf("/uploads/");
    if (uploadsIndex >= 0) {
      const uploadsPath = normalizePath(
        parsedUrl.pathname.slice(uploadsIndex + 1)
      );
      if (uploadsPath) candidates.add(uploadsPath);
    }

    const categoriesIndex = parsedUrl.pathname.indexOf("/categories/");
    if (categoriesIndex >= 0) {
      const categoriesPath = normalizePath(
        parsedUrl.pathname.slice(categoriesIndex + 1)
      );
      if (categoriesPath) candidates.add(categoriesPath);
    }
  } catch {
    const markerIndex = cleanValue.indexOf(marker);
    if (markerIndex >= 0) {
      const fromMarker = normalizePath(cleanValue.slice(markerIndex + marker.length));
      if (fromMarker) candidates.add(fromMarker);
    }

    const uploadsIndex = cleanValue.indexOf("uploads/");
    if (uploadsIndex >= 0) {
      const uploadsPath = normalizePath(cleanValue.slice(uploadsIndex));
      if (uploadsPath) candidates.add(uploadsPath);
    }

    const categoriesIndex = cleanValue.indexOf("categories/");
    if (categoriesIndex >= 0) {
      const categoriesPath = normalizePath(cleanValue.slice(categoriesIndex));
      if (categoriesPath) candidates.add(categoriesPath);
    }
  }

  return Array.from(candidates);
};

export const AdminDashboard = ({
  initialCategories,
  initialProducts,
}: Props) => {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [categoryForm, setCategoryForm] =
    useState<CategoryFormState>(emptyCategoryForm);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [categoryMessage, setCategoryMessage] = useState<string | null>(null);

  const [productForm, setProductForm] = useState<ProductFormState>(
    createEmptyProductForm(initialCategories[0]?.id)
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");
  const [productLoading, setProductLoading] = useState(false);
  const [productMessage, setProductMessage] = useState<string | null>(null);
  const [productError, setProductError] = useState<string | null>(null);
  const filteredAndSortedProducts = useMemo(() => {
    const filtered =
      selectedCategoryId === "all"
        ? products
        : products.filter((product) => product.category_id === selectedCategoryId);

    return [...filtered].sort((a, b) =>
      a.name.localeCompare(b.name, "es", { sensitivity: "base" })
    );
  }, [products, selectedCategoryId]);

  const ensureUniqueCategorySlug = async (name: string, id?: string) => {
    const base = slugify(name) || "categoria";
    const { data, error } = await supabase
      .from("categories")
      .select("id, slug")
      .ilike("slug", `${base}%`);

    if (error || !data) {
      console.error("Error validating slug", error);
      return base;
    }

    const existing = data
      .filter((category) => category.id !== id)
      .map((category) => category.slug);

    if (!existing.includes(base)) {
      return base;
    }

    let counter = 2;
    let candidate = `${base}-${counter}`;

    while (existing.includes(candidate)) {
      counter += 1;
      candidate = `${base}-${counter}`;
    }

    return candidate;
  };

  const handleCategorySubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCategoryLoading(true);
    setCategoryMessage(null);

    const trimmedName = categoryForm.name.trim();
    if (!trimmedName) {
      setCategoryMessage("Ingresá un nombre válido.");
      setCategoryLoading(false);
      return;
    }

    const slug = await ensureUniqueCategorySlug(
      trimmedName,
      categoryForm.id
    );

    let imageUrl = categoryForm.image_url.trim();

    if (categoryForm.file) {
      const fileExt = categoryForm.file.name.split(".").pop() ?? "jpg";
      const path = `categories/${crypto.randomUUID()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("products")
        .upload(path, categoryForm.file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        setCategoryMessage(uploadError.message);
        setCategoryLoading(false);
        return;
      }

      const { data } = supabase.storage.from("products").getPublicUrl(path);
      imageUrl = data.publicUrl;
    }

    const payload = {
      name: trimmedName,
      slug,
      image_url: imageUrl || null,
      sort_order: Number(categoryForm.sort_order ?? 0),
    };

    const query = categoryForm.id
      ? supabase
          .from("categories")
          .update(payload)
          .eq("id", categoryForm.id)
          .select("*")
          .single()
      : supabase.from("categories").insert(payload).select("*").single();

    const { data, error } = await query;

    if (error) {
      setCategoryMessage(error.message);
    } else if (data) {
      setCategories((prev) => {
        const filtered = prev.filter((item) => item.id !== data.id);
        return [...filtered, data].sort(
          (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
        );
      });
      setCategoryForm(emptyCategoryForm);
      setCategoryMessage("Guardado correctamente.");
    }

    setCategoryLoading(false);
  };

  const handleEditCategory = (category: Category) => {
    setCategoryForm({
      id: category.id,
      name: category.name,
      image_url: category.image_url ?? "",
      file: null,
      sort_order: String(category.sort_order ?? 0),
    });
  };

  const handleDeleteCategory = async (id: string) => {
    const confirmed = window.confirm(
      "¿Eliminar la categoría? Los productos asociados quedarán huérfanos."
    );
    if (!confirmed) return;

    const { error } = await supabase.from("categories").delete().eq("id", id);

    if (error) {
      setCategoryMessage(error.message);
    } else {
      setCategories((prev) => prev.filter((cat) => cat.id !== id));
      setCategoryMessage("Categoría eliminada.");
    }
  };

  const handleCancelCategory = () => {
    setCategoryForm(emptyCategoryForm);
    setCategoryMessage(null);
  };

  const handleProductSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProductLoading(true);
    setProductMessage(null);
    setProductError(null);

    const fileValidationError = validateProductImageFile(productForm.file);
    if (fileValidationError) {
      setProductError(fileValidationError);
      setProductLoading(false);
      return;
    }

    let imageUrl = productForm.image_url;

    if (!imageUrl && !productForm.file) {
      setProductError("Subí una imagen del producto.");
      setProductLoading(false);
      return;
    }

    if (productForm.file) {
      const fileExt = productForm.file.name.split(".").pop() ?? "jpg";
      const path = `uploads/${crypto.randomUUID()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("products")
        .upload(path, productForm.file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        setProductError(uploadError.message);
        setProductLoading(false);
        return;
      }

      const { data } = supabase.storage.from("products").getPublicUrl(path);
      const uploadedUrl = data.publicUrl;
      imageUrl = uploadedUrl;
      setProductForm((prev) => ({
        ...prev,
        image_url: uploadedUrl,
        file: null,
      }));
    }

    if (!imageUrl) {
      setProductError("No se pudo obtener la URL de la imagen.");
      setProductLoading(false);
      return;
    }

    const payload = {
      name: productForm.name,
      price: Number(productForm.price),
      category_id: productForm.category_id,
      image_url: imageUrl,
      active: productForm.active,
    };

    const query = productForm.id
      ? supabase
          .from("products")
          .update(payload)
          .eq("id", productForm.id)
          .select("*")
          .single()
      : supabase.from("products").insert(payload).select("*").single();

    const { data, error } = await query;

    if (error || !data) {
      setProductError(error?.message ?? "Error guardando producto");
    } else {
      const currentProduct = productForm.id
        ? products.find((prod) => prod.id === productForm.id)
        : null;
      let warning: string | null = null;

      const previousPaths = getStoragePathsFromImageValue(
        currentProduct?.image_url
      );
      const nextPaths = new Set(getStoragePathsFromImageValue(imageUrl));
      const pathsToRemove = previousPaths.filter((path) => !nextPaths.has(path));

      if (pathsToRemove.length > 0) {
        const { error: oldImageError } = await supabase.storage
          .from("products")
          .remove(pathsToRemove);
        if (oldImageError) {
          warning =
            "Producto guardado. No se pudo borrar la imagen anterior del storage.";
        }
      }

      setProducts((prev) => {
        const filtered = prev.filter((prod) => prod.id !== data.id);
        return [data, ...filtered];
      });
      setProductForm(createEmptyProductForm(productForm.category_id));
      setProductMessage(warning ?? "Producto guardado.");
    }

    setProductLoading(false);
  };

  const handleEditProduct = (product: Product) => {
    setProductForm({
      id: product.id,
      name: product.name,
      price: String(product.price),
      category_id: product.category_id,
      image_url: product.image_url ?? "",
      active: product.active,
      file: null,
    });
    setProductMessage(null);
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!window.confirm("¿Eliminar el producto?")) return;
    setProductError(null);

    let warning: string | null = null;
    const storagePaths = getStoragePathsFromImageValue(product.image_url);

    if (storagePaths.length > 0) {
      const { error: storageError } = await supabase.storage
        .from("products")
        .remove(storagePaths);
      if (storageError) {
        warning =
          "No se pudo borrar la imagen del storage, pero el producto se eliminara igual.";
      }
    }

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", product.id);
    if (error) {
      setProductError(error.message);
    } else {
      setProducts((prev) => prev.filter((prod) => prod.id !== product.id));
      setProductMessage(warning ?? "Producto eliminado.");
    }
  };

  const handleToggleProduct = async (product: Product) => {
    const { data, error } = await supabase
      .from("products")
      .update({ active: !product.active })
      .eq("id", product.id)
      .select("*")
      .single();

    if (error) {
      setProductError(error.message);
    } else if (data) {
      setProducts((prev) =>
        prev.map((item) => (item.id === product.id ? data : item))
      );
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="pill">Admin</p>
          <h1 className="mt-2 text-3xl font-semibold">Panel de control</h1>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          Cerrar sesión
        </button>
      </header>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="card rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Categorías</h2>
            <button
              type="button"
              onClick={handleCancelCategory}
              className="text-sm text-slate-500 underline-offset-2 hover:text-slate-900 hover:underline"
            >
              Nueva
            </button>
          </div>
          <form className="mt-4 space-y-4" onSubmit={handleCategorySubmit}>
            <input
              type="text"
              required
              placeholder="Nombre"
              value={categoryForm.name}
              onChange={(event) =>
                setCategoryForm((prev) => ({
                  ...prev,
                  name: event.target.value,
                }))
              }
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-400 focus:outline-none"
            />
            <input
              type="number"
              placeholder="Orden"
              value={categoryForm.sort_order}
              onChange={(event) =>
                setCategoryForm((prev) => ({
                  ...prev,
                  sort_order: event.target.value,
                }))
              }
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-400 focus:outline-none"
            />
            <input
              type="url"
              placeholder="URL de imagen (opcional)"
              value={categoryForm.image_url}
              onChange={(event) =>
                setCategoryForm((prev) => ({
                  ...prev,
                  image_url: event.target.value,
                }))
              }
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-400 focus:outline-none"
            />
            <label className="text-sm font-medium text-slate-600">
              Subir imagen de categoría (opcional)
              <input
                type="file"
                accept="image/*"
                onChange={(event) =>
                  setCategoryForm((prev) => ({
                    ...prev,
                    file: event.target.files?.[0] ?? null,
                  }))
                }
                className="mt-2 w-full rounded-2xl border border-dashed border-slate-200 px-4 py-3 text-sm focus:border-slate-400 focus:outline-none"
              />
            </label>
            <button
              type="submit"
              className="w-full rounded-full bg-[var(--color-primary)] px-6 py-3 text-white hover:bg-[var(--color-primary-dark)]"
              disabled={categoryLoading}
            >
              {categoryForm.id ? "Actualizar" : "Crear"}
            </button>
            {categoryMessage && (
              <p className="text-sm text-slate-500">{categoryMessage}</p>
            )}
          </form>
        </div>

        <div className="card rounded-3xl p-6">
          <h3 className="text-lg font-semibold text-slate-900">Listado</h3>
          <div className="mt-4 space-y-3 text-sm">
            {categories.length === 0 ? (
              <p className="text-slate-500">Sin categorías.</p>
            ) : (
              categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-100 px-4 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    {category.image_url ? (
                      <img
                        src={category.image_url}
                        alt={category.name}
                        className="h-10 w-10 rounded-xl object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-[10px] font-semibold text-slate-500">
                        IMG
                      </div>
                    )}
                    <div className="min-w-0">
                    <p className="font-semibold">{category.name}</p>
                    <p className="text-xs text-slate-400">{category.slug}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <button
                      onClick={() => handleEditCategory(category)}
                      className="text-slate-500 hover:text-slate-900"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className="text-rose-500 hover:text-rose-700"
                    >
                      Borrar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.3fr,1fr]">
        <div className="card rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Productos</h2>
            <button
              type="button"
              onClick={() =>
                setProductForm(createEmptyProductForm(categories[0]?.id))
              }
              className="text-sm text-slate-500 underline-offset-2 hover:text-slate-900 hover:underline"
            >
              Nuevo
            </button>
          </div>

          <form className="mt-4 grid gap-4" onSubmit={handleProductSubmit}>
            <input
              type="text"
              required
              placeholder="Nombre del producto"
              value={productForm.name}
              onChange={(event) =>
                setProductForm((prev) => ({
                  ...prev,
                  name: event.target.value,
                }))
              }
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-400 focus:outline-none"
            />
            <input
              type="number"
              min="0"
              placeholder="Precio en ARS"
              value={productForm.price}
              onChange={(event) =>
                setProductForm((prev) => ({
                  ...prev,
                  price: event.target.value,
                }))
              }
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-400 focus:outline-none"
            />
            <select
              required
              value={productForm.category_id}
              onChange={(event) =>
                setProductForm((prev) => ({
                  ...prev,
                  category_id: event.target.value,
                }))
              }
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-400 focus:outline-none"
            >
              <option value="">Seleccioná categoría</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <label className="text-sm font-medium text-slate-600">
              Subir imagen al bucket
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => {
                  const selectedFile = event.target.files?.[0] ?? null;
                  const fileValidationError = validateProductImageFile(selectedFile);

                  setProductForm((prev) => ({
                    ...prev,
                    file: selectedFile,
                  }));

                  setProductError(fileValidationError);
                }}
                className="mt-2 w-full rounded-2xl border border-dashed border-slate-200 px-4 py-3 text-sm focus:border-slate-400 focus:outline-none"
              />
              <span className="mt-2 block text-xs text-slate-500">
                Máx 350 KB (JPG/PNG/WebP)
              </span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={productForm.active}
                onChange={(event) =>
                  setProductForm((prev) => ({
                    ...prev,
                    active: event.target.checked,
                  }))
                }
              />
              Activo
            </label>

            <button
              type="submit"
              className="rounded-full bg-[var(--color-primary)] px-6 py-3 text-white hover:bg-[var(--color-primary-dark)]"
              disabled={productLoading}
            >
              {productForm.id ? "Actualizar producto" : "Crear producto"}
            </button>
            {productError && (
              <p className="text-sm text-rose-600">{productError}</p>
            )}
            {productMessage && (
              <p className="text-sm text-slate-500">{productMessage}</p>
            )}
          </form>
        </div>

        <div className="card max-h-[600px] overflow-y-auto rounded-3xl p-4">
          <div className="flex flex-wrap items-center justify-between gap-3 px-2">
            <h3 className="text-lg font-semibold text-slate-900">
              Productos ({filteredAndSortedProducts.length})
            </h3>
            <select
              value={selectedCategoryId}
              onChange={(event) => setSelectedCategoryId(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
            >
              <option value="all">Todas</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-3 space-y-3">
            {filteredAndSortedProducts.length === 0 ? (
              <p className="text-sm text-slate-500">Sin productos cargados.</p>
            ) : (
              filteredAndSortedProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex flex-col gap-2 rounded-2xl border border-slate-100 px-3 py-3 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{product.name}</p>
                    <span className="text-slate-500">
                      {formatCurrency(product.price)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {product.active ? "Activo" : "Inactivo"}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
                    <button
                      onClick={() => handleEditProduct(product)}
                      className="text-slate-500 hover:text-slate-900"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleToggleProduct(product)}
                      className="text-amber-600 hover:text-amber-700"
                    >
                      {product.active ? "Pausar" : "Activar"}
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product)}
                      className="text-rose-500 hover:text-rose-700"
                    >
                      Borrar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
