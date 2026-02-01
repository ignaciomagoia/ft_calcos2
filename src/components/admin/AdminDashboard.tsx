"use client";

import { FormEvent, useMemo, useState } from "react";
import type { Category, Product } from "@/lib/types";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { formatCurrency } from "@/lib/utils";

type Props = {
  initialCategories: Category[];
  initialProducts: Product[];
};

type CategoryFormState = {
  id?: string;
  name: string;
  slug: string;
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
  slug: "",
  sort_order: "0",
};

const createEmptyProductForm = (categoryId?: string): ProductFormState => ({
  name: "",
  price: "",
  category_id: categoryId ?? "",
  image_url: "",
  active: true,
});

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
  const [productLoading, setProductLoading] = useState(false);
  const [productMessage, setProductMessage] = useState<string | null>(null);
  const [productError, setProductError] = useState<string | null>(null);

  const handleCategorySubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setCategoryLoading(true);
    setCategoryMessage(null);

    const payload = {
      name: categoryForm.name,
      slug: categoryForm.slug,
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
      slug: category.slug,
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

    let imageUrl = productForm.image_url;

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
      imageUrl = data.publicUrl;
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
      setProducts((prev) => {
        const filtered = prev.filter((prod) => prod.id !== data.id);
        return [data, ...filtered];
      });
      setProductForm(createEmptyProductForm(productForm.category_id));
      setProductMessage("Producto guardado.");
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
    });
    setProductMessage(null);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm("¿Eliminar el producto?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      setProductError(error.message);
    } else {
      setProducts((prev) => prev.filter((prod) => prod.id !== id));
      setProductMessage("Producto eliminado.");
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
              type="text"
              required
              placeholder="Slug (sin espacios)"
              value={categoryForm.slug}
              onChange={(event) =>
                setCategoryForm((prev) => ({
                  ...prev,
                  slug: event.target.value,
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
                  <div>
                    <p className="font-semibold">{category.name}</p>
                    <p className="text-xs text-slate-400">{category.slug}</p>
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
            <input
              type="url"
              placeholder="URL de imagen"
              value={productForm.image_url}
              onChange={(event) =>
                setProductForm((prev) => ({
                  ...prev,
                  image_url: event.target.value,
                }))
              }
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-400 focus:outline-none"
            />
            <label className="text-sm font-medium text-slate-600">
              Subir imagen al bucket
              <input
                type="file"
                accept="image/*"
                onChange={(event) =>
                  setProductForm((prev) => ({
                    ...prev,
                    file: event.target.files?.[0],
                  }))
                }
                className="mt-2 w-full rounded-2xl border border-dashed border-slate-200 px-4 py-3 text-sm focus:border-slate-400 focus:outline-none"
              />
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
          <h3 className="px-2 text-lg font-semibold text-slate-900">
            Productos ({products.length})
          </h3>
          <div className="mt-3 space-y-3">
            {products.length === 0 ? (
              <p className="text-sm text-slate-500">Sin productos cargados.</p>
            ) : (
              products.map((product) => (
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
                      onClick={() => handleDeleteProduct(product.id)}
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
