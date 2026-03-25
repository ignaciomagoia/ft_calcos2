"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import type { Category, Product } from "@/lib/types";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { buildOptimizedImageUrl } from "@/lib/cloudinaryImage";
import {
  compareNamesWithTrailingNumber,
  extractTrailingNumber,
  formatCurrency,
  slugify,
} from "@/lib/utils";
import { SubcategoryManager } from "./SubcategoryManager";

type Props = {
  initialCategories: Category[];
  initialProducts: Product[];
};

type CategoryFormState = {
  id?: string;
  name: string;
  image_url: string;
  description: string;
  product_layout: "compact" | "large";
  file?: File | null;
  sort_order: string;
};

type PriceFieldsState = {
  legacy_price: number;
  size_4_enabled: boolean;
  size_4_price: string;
  size_6_enabled: boolean;
  size_6_price: string;
  size_8_enabled: boolean;
  size_8_price: string;
};

type ProductFormState = PriceFieldsState & {
  id?: string;
  name: string;
  description: string;
  category_id: string;
  image_url: string;
  file?: File | null;
};

type BulkPriceFormState = PriceFieldsState;

const emptyCategoryForm: CategoryFormState = {
  name: "",
  image_url: "",
  description: "",
  product_layout: "compact",
  file: null,
  sort_order: "0",
};

const createEmptyProductForm = (categoryId?: string): ProductFormState => ({
  name: "",
  description: "",
  category_id: categoryId ?? "",
  image_url: "",
  legacy_price: 0,
  size_4_enabled: false,
  size_4_price: "",
  size_6_enabled: false,
  size_6_price: "",
  size_8_enabled: false,
  size_8_price: "",
  file: null,
});

const emptyBulkPriceForm: BulkPriceFormState = {
  legacy_price: 0,
  size_4_enabled: false,
  size_4_price: "",
  size_6_enabled: false,
  size_6_price: "",
  size_8_enabled: false,
  size_8_price: "",
};

const MAX_PRODUCT_IMAGE_BYTES = 350 * 1024;
const ALLOWED_PRODUCT_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];
const BULK_UPLOAD_CONCURRENCY = 8;
const CLOUDINARY_PRODUCTS_FOLDER = "ft-calcos/products";
const CLOUDINARY_CATEGORIES_FOLDER = "ft-calcos/categories";

type BulkUploadStatus =
  | "pending"
  | "uploading"
  | "success"
  | "error"
  | "invalid"
  | "cancelled";

type BulkUploadItem = {
  id: string;
  file: File;
  name: string;
  status: BulkUploadStatus;
  message?: string;
};

type CloudinaryUploadApiPayload = {
  url: string;
};

type DeleteProductResult = {
  error: string | null;
};

const getBaseNameFromFile = (fileName: string) => {
  const baseName = fileName.replace(/\.[^/.]+$/, "").trim();
  return baseName || "calco";
};

const normalizeSearchText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const validateProductImageFile = (file: File | null | undefined): string | null => {
  if (!file) return null;

  if (!ALLOWED_PRODUCT_IMAGE_TYPES.includes(file.type)) {
    return "Formato no permitido. Usa JPG, PNG o WebP.";
  }

  if (file.size > MAX_PRODUCT_IMAGE_BYTES) {
    const fileSizeKb = Math.round(file.size / 1024);
    const maxSizeKb = Math.round(MAX_PRODUCT_IMAGE_BYTES / 1024);
    return `La imagen pesa ${fileSizeKb} KB. M\u00e1ximo permitido: ${maxSizeKb} KB. Reducila y prob\u00e1 de nuevo.`;
  }

  return null;
};

const parseCloudinaryUploadPayload = (
  payload: unknown
): CloudinaryUploadApiPayload | null => {
  if (!payload || typeof payload !== "object") return null;

  const raw = payload as { url?: unknown };
  if (typeof raw.url !== "string" || raw.url.trim().length === 0) {
    return null;
  }

  return {
    url: raw.url.trim(),
  };
};

const uploadImageViaAdminApi = async (file: File, folder: string) => {
  const formData = new FormData();
  formData.set("file", file);
  formData.set("folder", folder);

  const response = await fetch("/api/admin/cloudinary-upload", {
    method: "POST",
    body: formData,
  });

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  const parsed = parseCloudinaryUploadPayload(payload);

  if (!response.ok || !parsed) {
    const message =
      payload &&
      typeof payload === "object" &&
      typeof (payload as { error?: unknown }).error === "string"
        ? (payload as { error: string }).error
        : "No se pudo subir la imagen a Cloudinary.";
    throw new Error(message);
  }

  return parsed.url;
};

const parseOptionalSizePrice = (
  enabled: boolean,
  rawValue: string
): number | null => {
  if (!enabled) return null;
  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.round(parsed);
};

type SharedPricePayload = {
  price: number;
  price_4: number | null;
  price_6: number | null;
  price_8: number | null;
};

const getSharedPricePayload = (
  form: PriceFieldsState
): { payload: SharedPricePayload | null; error: string | null } => {
  const uniquePrice = form.legacy_price > 0 ? Math.round(form.legacy_price) : 0;

  const enabledSizeFlags = [
    form.size_4_enabled,
    form.size_6_enabled,
    form.size_8_enabled,
  ];
  const hasAnyEnabledSize = enabledSizeFlags.some(Boolean);

  const price4 = parseOptionalSizePrice(form.size_4_enabled, form.size_4_price);
  const price6 = parseOptionalSizePrice(form.size_6_enabled, form.size_6_price);
  const price8 = parseOptionalSizePrice(form.size_8_enabled, form.size_8_price);

  const invalidEnabledSizes: string[] = [];
  if (form.size_4_enabled && price4 === null) invalidEnabledSizes.push("4 cm");
  if (form.size_6_enabled && price6 === null) invalidEnabledSizes.push("6 cm");
  if (form.size_8_enabled && price8 === null) invalidEnabledSizes.push("8 cm");

  if (uniquePrice > 0 && hasAnyEnabledSize) {
    return {
      payload: null,
      error: "Elegí una sola modalidad de precio: único o por tamaños.",
    };
  }

  if (uniquePrice <= 0 && !hasAnyEnabledSize) {
    return {
      payload: null,
      error: "Cargá un precio único o habilitá al menos un tamaño con precio.",
    };
  }

  if (invalidEnabledSizes.length > 0) {
    return {
      payload: null,
      error: `Completá precio mayor a 0 para: ${invalidEnabledSizes.join(", ")}.`,
    };
  }

  const sizePrices = [price4, price6, price8].filter(
    (value): value is number => value !== null
  );
  const fallbackLegacyPrice = uniquePrice > 0 ? uniquePrice : sizePrices[0] ?? 0;

  return {
    payload: {
      price: fallbackLegacyPrice,
      price_4: price4,
      price_6: price6,
      price_8: price8,
    },
    error: null,
  };
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
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [productLoading, setProductLoading] = useState(false);
  const [productMessage, setProductMessage] = useState<string | null>(null);
  const [productError, setProductError] = useState<string | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [bulkPriceForm, setBulkPriceForm] =
    useState<BulkPriceFormState>(emptyBulkPriceForm);
  const [bulkPriceLoading, setBulkPriceLoading] = useState(false);
  const [bulkCategoryId, setBulkCategoryId] = useState(
    initialCategories[0]?.id ?? ""
  );
  const [bulkItems, setBulkItems] = useState<BulkUploadItem[]>([]);
  const [bulkRunning, setBulkRunning] = useState(false);
  const [bulkCancelRequested, setBulkCancelRequested] = useState(false);
  const bulkCancelRef = useRef(false);
  const bulkItemsRef = useRef<BulkUploadItem[]>([]);
  const filteredAndSortedProducts = useMemo(() => {
    const filteredByCategory =
      selectedCategoryId === "all"
        ? products
        : products.filter((product) => product.category_id === selectedCategoryId);

    const normalizedSearch = normalizeSearchText(productSearchTerm);
    const filtered =
      normalizedSearch.length === 0
        ? filteredByCategory
        : filteredByCategory.filter((product) =>
            normalizeSearchText(product.name).includes(normalizedSearch)
          );

    return [...filtered].sort((a, b) =>
      compareNamesWithTrailingNumber(a.name, b.name)
    );
  }, [products, selectedCategoryId, productSearchTerm]);
  const selectedProductIdsSet = useMemo(
    () => new Set(selectedProductIds),
    [selectedProductIds]
  );
  const selectedVisibleCount = useMemo(
    () =>
      filteredAndSortedProducts.reduce(
        (acc, product) => acc + (selectedProductIdsSet.has(product.id) ? 1 : 0),
        0
      ),
    [filteredAndSortedProducts, selectedProductIdsSet]
  );

  useEffect(() => {
    bulkItemsRef.current = bulkItems;
  }, [bulkItems]);

  useEffect(() => {
    bulkCancelRef.current = bulkCancelRequested;
  }, [bulkCancelRequested]);

  useEffect(() => {
    if (!bulkCategoryId && categories[0]?.id) {
      setBulkCategoryId(categories[0].id);
    }
  }, [bulkCategoryId, categories]);

  useEffect(() => {
    const productIds = new Set(products.map((product) => product.id));
    setSelectedProductIds((prev) => prev.filter((id) => productIds.has(id)));
  }, [products]);

  const updateBulkItem = (
    itemId: string,
    next: Partial<Pick<BulkUploadItem, "status" | "message">>
  ) => {
    setBulkItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              ...next,
            }
          : item
      )
    );
  };

  const bulkSummary = useMemo(() => {
    const doneStatuses: BulkUploadStatus[] = [
      "success",
      "error",
      "invalid",
      "cancelled",
    ];
    const total = bulkItems.length;
    const done = bulkItems.filter((item) => doneStatuses.includes(item.status)).length;
    const ok = bulkItems.filter((item) => item.status === "success").length;
    const failed = bulkItems.filter((item) => item.status === "error").length;
    const invalid = bulkItems.filter((item) => item.status === "invalid").length;
    const uploading = bulkItems.filter((item) => item.status === "uploading").length;
    return { total, done, ok, failed, invalid, uploading };
  }, [bulkItems]);

  const runBulkUpload = async (
    itemIds: string[],
    sharedPricing: SharedPricePayload
  ) => {
    if (!bulkCategoryId) {
      setProductError("Seleccion\u00e1 una categor\u00eda para la carga masiva.");
      return;
    }

    if (itemIds.length === 0) {
      setProductMessage("No hay archivos pendientes para subir.");
      return;
    }

    setProductError(null);
    setProductMessage(null);
    setBulkRunning(true);
    setBulkCancelRequested(false);
    bulkCancelRef.current = false;

    const queue = [...itemIds];
    let cursor = 0;

    const workerCount = Math.min(BULK_UPLOAD_CONCURRENCY, queue.length);

    const workers = Array.from({ length: workerCount }, async () => {
      while (true) {
        if (bulkCancelRef.current) return;

        const currentIndex = cursor;
        cursor += 1;
        const itemId = queue[currentIndex];
        if (!itemId) return;

        const item = bulkItemsRef.current.find((entry) => entry.id === itemId);
        if (!item || item.status === "invalid") continue;

        updateBulkItem(item.id, { status: "uploading", message: "Subiendo..." });

        try {
          const imageUrl = await uploadImageViaAdminApi(
            item.file,
            CLOUDINARY_PRODUCTS_FOLDER
          );

          const payload = {
            name: item.name,
            sort_number: extractTrailingNumber(item.name),
            price: sharedPricing.price,
            price_4: sharedPricing.price_4,
            price_6: sharedPricing.price_6,
            price_8: sharedPricing.price_8,
            category_id: bulkCategoryId,
            image_url: imageUrl,
            active: true,
          };

          const { data: created, error: insertError } = await supabase
            .from("products")
            .insert(payload)
            .select("*")
            .single();

          if (insertError || !created) {
            throw new Error(insertError?.message ?? "No se pudo crear el producto.");
          }

          setProducts((prev) => [created, ...prev]);
          updateBulkItem(item.id, { status: "success", message: "OK" });
        } catch (error: any) {
          updateBulkItem(item.id, {
            status: "error",
            message: error?.message ?? "Error al subir",
          });
        }
      }
    });

    await Promise.all(workers);

    if (bulkCancelRef.current) {
      setBulkItems((prev) =>
        prev.map((item) =>
          itemIds.includes(item.id) && item.status === "pending"
            ? { ...item, status: "cancelled", message: "Cancelado" }
            : item
        )
      );
      setProductMessage("Carga masiva cancelada.");
    } else {
      setProductMessage("Carga masiva finalizada.");
    }

    setBulkRunning(false);
    setBulkCancelRequested(false);
  };

  const handleBulkSelectFiles = (files: FileList | null) => {
    if (!files) return;

    const incoming: BulkUploadItem[] = Array.from(files).map((file) => {
      const validationError = validateProductImageFile(file);
      return {
        id: crypto.randomUUID(),
        file,
        name: getBaseNameFromFile(file.name),
        status: validationError ? "invalid" : "pending",
        message: validationError ?? "En cola",
      };
    });

    setBulkItems((prev) => [...prev, ...incoming]);
  };

  const handleStartBulkUpload = async () => {
    if (bulkRunning) return;

    const priceTemplate = getSharedPricePayload(productForm);
    if (!priceTemplate.payload) {
      setProductError(
        priceTemplate.error ??
          "Definí precio único o precios por tamaño para aplicar a todas las calcos."
      );
      return;
    }

    const pendingIds = bulkItemsRef.current
      .filter((item) => item.status === "pending")
      .map((item) => item.id);

    await runBulkUpload(pendingIds, priceTemplate.payload);
  };

  const handleCancelBulkUpload = () => {
    if (!bulkRunning) return;
    setBulkCancelRequested(true);
    bulkCancelRef.current = true;
  };

  const handleRetryFailedBulkUploads = async () => {
    if (bulkRunning) return;

    const priceTemplate = getSharedPricePayload(productForm);
    if (!priceTemplate.payload) {
      setProductError(
        priceTemplate.error ??
          "Definí precio único o precios por tamaño para aplicar a todas las calcos."
      );
      return;
    }

    const failedIds = bulkItemsRef.current
      .filter((item) => item.status === "error")
      .map((item) => item.id);

    if (failedIds.length === 0) return;

    setBulkItems((prev) =>
      prev.map((item) =>
        failedIds.includes(item.id)
          ? { ...item, status: "pending", message: "En cola" }
          : item
      )
    );

    await runBulkUpload(failedIds, priceTemplate.payload);
  };

  const handleRemoveBulkItem = (itemId: string) => {
    setBulkItems((prev) => {
      const target = prev.find((item) => item.id === itemId);
      if (!target) return prev;
      if (bulkRunning && target.status === "uploading") {
        return prev;
      }
      return prev.filter((item) => item.id !== itemId);
    });
  };

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
      setCategoryMessage("Ingres\u00e1 un nombre v\u00e1lido.");
      setCategoryLoading(false);
      return;
    }

    const slug = await ensureUniqueCategorySlug(
      trimmedName,
      categoryForm.id
    );

    let imageUrl = categoryForm.image_url.trim();

    if (categoryForm.file) {
      try {
        imageUrl = await uploadImageViaAdminApi(
          categoryForm.file,
          CLOUDINARY_CATEGORIES_FOLDER
        );
      } catch (error: unknown) {
        setCategoryMessage(
          error instanceof Error ? error.message : "No se pudo subir la imagen."
        );
        setCategoryLoading(false);
        return;
      }
    }

    const payload = {
      name: trimmedName,
      slug,
      image_url: imageUrl || null,
      description: categoryForm.description.trim() || null,
      product_layout: categoryForm.product_layout === "large" ? "large" : "compact",
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
      description: category.description ?? "",
      product_layout: category.product_layout === "large" ? "large" : "compact",
      file: null,
      sort_order: String(category.sort_order ?? 0),
    });
  };

  const handleDeleteCategory = async (id: string) => {
    const confirmed = window.confirm(
      "\u00bfEliminar la categor\u00eda? Los productos asociados quedar\u00e1n hu\u00e9rfanos."
    );
    if (!confirmed) return;

    const { error } = await supabase.from("categories").delete().eq("id", id);

    if (error) {
      setCategoryMessage(error.message);
    } else {
      setCategories((prev) => prev.filter((cat) => cat.id !== id));
      setCategoryMessage("Categor\u00eda eliminada.");
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

    const priceTemplate = getSharedPricePayload(productForm);
    if (!priceTemplate.payload) {
      setProductError(priceTemplate.error);
      setProductLoading(false);
      return;
    }

    let imageUrl = productForm.image_url;

    if (!imageUrl && !productForm.file) {
      setProductError("Subi una imagen del producto.");
      setProductLoading(false);
      return;
    }

    if (productForm.file) {
      let uploadedUrl = "";
      try {
        uploadedUrl = await uploadImageViaAdminApi(
          productForm.file,
          CLOUDINARY_PRODUCTS_FOLDER
        );
      } catch (error: unknown) {
        setProductError(
          error instanceof Error ? error.message : "No se pudo subir la imagen."
        );
        setProductLoading(false);
        return;
      }
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
      sort_number: extractTrailingNumber(productForm.name),
      description: productForm.description.trim() || null,
      price: priceTemplate.payload.price,
      price_4: priceTemplate.payload.price_4,
      price_6: priceTemplate.payload.price_6,
      price_8: priceTemplate.payload.price_8,
      category_id: productForm.category_id,
      image_url: imageUrl,
    };

    const query = productForm.id
      ? supabase
          .from("products")
          .update(payload)
          .eq("id", productForm.id)
          .select("*")
          .single()
      : supabase
          .from("products")
          .insert({ ...payload, active: true })
          .select("*")
          .single();

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
      description: product.description ?? "",
      category_id: product.category_id,
      image_url: product.image_url ?? "",
      legacy_price: product.price ?? 0,
      size_4_enabled: typeof product.price_4 === "number" && product.price_4 > 0,
      size_4_price:
        typeof product.price_4 === "number" && product.price_4 > 0
          ? String(product.price_4)
          : "",
      size_6_enabled: typeof product.price_6 === "number" && product.price_6 > 0,
      size_6_price:
        typeof product.price_6 === "number" && product.price_6 > 0
          ? String(product.price_6)
          : "",
      size_8_enabled: typeof product.price_8 === "number" && product.price_8 > 0,
      size_8_price:
        typeof product.price_8 === "number" && product.price_8 > 0
          ? String(product.price_8)
          : "",
      file: null,
    });
    setProductMessage(null);
  };

  const deleteProductRecord = async (product: Product): Promise<DeleteProductResult> => {
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", product.id);

    return {
      error: error?.message ?? null,
    };
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!window.confirm("¿Eliminar el producto?")) return;
    setProductError(null);
    const { error } = await deleteProductRecord(product);

    if (error) {
      setProductError(error);
    } else {
      setProducts((prev) => prev.filter((prod) => prod.id !== product.id));
      setProductMessage("Producto eliminado.");
    }
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectVisibleProducts = () => {
    const visibleIds = filteredAndSortedProducts.map((product) => product.id);
    setSelectedProductIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
  };

  const handleClearSelectedProducts = () => {
    setSelectedProductIds([]);
  };

  const handleDeleteSelectedProducts = async () => {
    if (selectedProductIds.length === 0) return;

    const selectedProducts = products.filter((product) =>
      selectedProductIdsSet.has(product.id)
    );

    if (selectedProducts.length === 0) {
      setSelectedProductIds([]);
      return;
    }

    const confirmed = window.confirm(
      `¿Eliminar ${selectedProducts.length} productos seleccionados?`
    );
    if (!confirmed) return;

    setProductError(null);
    setProductMessage(null);

    const deletedIds: string[] = [];
    const failedIds: string[] = [];

    for (const product of selectedProducts) {
      const { error } = await deleteProductRecord(product);

      if (error) {
        failedIds.push(product.id);
      } else {
        deletedIds.push(product.id);
      }
    }

    if (deletedIds.length > 0) {
      const deletedSet = new Set(deletedIds);
      setProducts((prev) => prev.filter((product) => !deletedSet.has(product.id)));
      setSelectedProductIds((prev) => prev.filter((id) => !deletedSet.has(id)));
    }

    if (failedIds.length > 0) {
      setProductError(
        `No se pudieron eliminar ${failedIds.length} producto(s). Intentá de nuevo.`
      );
    }

    if (deletedIds.length > 0) {
      setProductMessage(`${deletedIds.length} producto(s) eliminado(s).`);
    }
  };

  const updateSelectedProductsPrices = async (payload: SharedPricePayload) => {
    const selectedProducts = products.filter((product) =>
      selectedProductIdsSet.has(product.id)
    );

    const updatedIds: string[] = [];
    const failedIds: string[] = [];

    for (const product of selectedProducts) {
      const { error } = await supabase
        .from("products")
        .update(payload)
        .eq("id", product.id);

      if (error) {
        failedIds.push(product.id);
      } else {
        updatedIds.push(product.id);
      }
    }

    if (updatedIds.length > 0) {
      const updatedSet = new Set(updatedIds);
      setProducts((prev) =>
        prev.map((product) =>
          updatedSet.has(product.id)
            ? {
                ...product,
                price: payload.price,
                price_4: payload.price_4,
                price_6: payload.price_6,
                price_8: payload.price_8,
              }
            : product
        )
      );
    }

    return {
      updatedCount: updatedIds.length,
      failedCount: failedIds.length,
    };
  };

  const handleApplyProductFormPricesToSelected = async () => {
    if (selectedProductIds.length === 0) {
      setProductError("Seleccioná al menos una calco para editar.");
      return;
    }

    const priceTemplate = getSharedPricePayload(productForm);
    if (!priceTemplate.payload) {
      setProductError(priceTemplate.error ?? "Configuración de precio inválida.");
      return;
    }

    const confirmed = window.confirm(
      `¿Aplicar los precios cargados arriba a ${selectedProductIds.length} producto(s)?`
    );
    if (!confirmed) return;

    setBulkPriceLoading(true);
    setProductError(null);
    setProductMessage(null);

    const { updatedCount, failedCount } = await updateSelectedProductsPrices(
      priceTemplate.payload
    );

    if (updatedCount > 0) {
      setProductMessage(`Precios actualizados para ${updatedCount} producto(s).`);
    }

    if (failedCount > 0) {
      setProductError(
        `No se pudieron actualizar ${failedCount} producto(s). Intentá de nuevo.`
      );
    }

    setBulkPriceLoading(false);
  };

  const handleBulkPriceUpdate = async () => {
    if (selectedProductIds.length === 0) {
      setProductError("Seleccioná al menos una calco para editar.");
      return;
    }

    const priceTemplate = getSharedPricePayload(bulkPriceForm);
    if (!priceTemplate.payload) {
      setProductError(priceTemplate.error ?? "Configuración de precio inválida.");
      return;
    }

    const confirmed = window.confirm(
      `¿Aplicar estos precios a ${selectedProductIds.length} producto(s)?`
    );
    if (!confirmed) return;

    setBulkPriceLoading(true);
    setProductError(null);
    setProductMessage(null);

    const { updatedCount, failedCount } = await updateSelectedProductsPrices(
      priceTemplate.payload
    );

    if (updatedCount > 0) {
      setProductMessage(`Precios actualizados para ${updatedCount} producto(s).`);
    }

    if (failedCount > 0) {
      setProductError(
        `No se pudieron actualizar ${failedCount} producto(s). Intentá de nuevo.`
      );
    }

    setBulkPriceForm(emptyBulkPriceForm);
    setBulkPriceLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const formatProductPriceSummary = (product: Product) => {
    const chunks: string[] = [];

    if (typeof product.price_4 === "number" && product.price_4 > 0) {
      chunks.push(`4cm ${formatCurrency(product.price_4)}`);
    }
    if (typeof product.price_6 === "number" && product.price_6 > 0) {
      chunks.push(`6cm ${formatCurrency(product.price_6)}`);
    }
    if (typeof product.price_8 === "number" && product.price_8 > 0) {
      chunks.push(`8cm ${formatCurrency(product.price_8)}`);
    }

    if (chunks.length > 0) {
      return chunks.join(" | ");
    }

    if (typeof product.price === "number" && product.price > 0) {
      return formatCurrency(product.price);
    }

    return "Solo WhatsApp";
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
          {"Cerrar sesi\u00f3n"}
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
            <textarea
              placeholder="Texto de la categoría (se muestra en la página pública)"
              value={categoryForm.description}
              onChange={(event) =>
                setCategoryForm((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))
              }
              rows={3}
              className="w-full resize-y rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-400 focus:outline-none"
            />
            <select
              value={categoryForm.product_layout}
              onChange={(event) =>
                setCategoryForm((prev) => ({
                  ...prev,
                  product_layout:
                    event.target.value === "large" ? "large" : "compact",
                }))
              }
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-400 focus:outline-none"
            >
              <option value="compact">Vista normal: 3 mobile / 6 desktop</option>
              <option value="large">Calcos grandes: 1 por fila (sin abrir modal)</option>
            </select>
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
              {"Subir imagen de categor\u00eda (opcional)"}
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
              <p className="text-slate-500">{"Sin categor\u00edas."}</p>
            ) : (
              categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-100 px-4 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    {category.image_url ? (
                      <img
                        src={
                          buildOptimizedImageUrl(category.image_url, {
                            width: 120,
                            height: 120,
                            crop: "fill",
                          }) ?? category.image_url
                        }
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
                    <p className="text-xs text-slate-400">
                      {category.product_layout === "large"
                        ? "Vista: 1 por fila grande"
                        : "Vista: 3 mobile / 6 desktop"}
                    </p>
                    {category.description ? (
                      <p className="mt-1 text-xs text-slate-500">
                        {category.description}
                      </p>
                    ) : null}
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
            <textarea
              rows={2}
              placeholder="Descripción breve (opcional)"
              value={productForm.description}
              onChange={(event) =>
                setProductForm((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))
              }
              className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-400 focus:outline-none"
            />
            <div className="rounded-2xl border border-slate-200 p-3">
              <label className="block text-sm font-semibold text-slate-700">
                {"Precio \u00fanico (sin tama\u00f1os)"}
              </label>
              <p className="mt-1 text-xs text-slate-500">
                {"Usalo para productos sin selector de tama\u00f1o (ej: planchas"}
                {" tem\u00e1ticas). No lo combines con precios por tama\u00f1o."}
              </p>
              <input
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                placeholder="Precio en ARS"
                value={productForm.legacy_price > 0 ? productForm.legacy_price : ""}
                onChange={(event) =>
                  setProductForm((prev) => ({
                    ...prev,
                    legacy_price:
                      event.target.value === ""
                        ? 0
                        : Math.max(Number(event.target.value), 0),
                  }))
                }
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
              />
            </div>
            <div className="rounded-2xl border border-slate-200 p-3">
              <p className="text-sm font-semibold text-slate-700">
                {"Tama\u00f1os opcionales con precio (ARS)"}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {"Eleg\u00ed esta modalidad solo si no cargaste precio \u00fanico."}
              </p>
              <div className="mt-3 space-y-2">
                <label className="grid grid-cols-[auto,1fr,120px] items-center gap-3 rounded-xl border border-slate-100 px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={productForm.size_4_enabled}
                    onChange={(event) =>
                      setProductForm((prev) => ({
                        ...prev,
                        size_4_enabled: event.target.checked,
                      }))
                    }
                  />
                  <span className="font-medium text-slate-700">4 cm</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    inputMode="numeric"
                    placeholder="$"
                    value={productForm.size_4_price}
                    onChange={(event) =>
                      setProductForm((prev) => ({
                        ...prev,
                        size_4_price: event.target.value,
                      }))
                    }
                    disabled={!productForm.size_4_enabled}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                </label>

                <label className="grid grid-cols-[auto,1fr,120px] items-center gap-3 rounded-xl border border-slate-100 px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={productForm.size_6_enabled}
                    onChange={(event) =>
                      setProductForm((prev) => ({
                        ...prev,
                        size_6_enabled: event.target.checked,
                      }))
                    }
                  />
                  <span className="font-medium text-slate-700">6 cm</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    inputMode="numeric"
                    placeholder="$"
                    value={productForm.size_6_price}
                    onChange={(event) =>
                      setProductForm((prev) => ({
                        ...prev,
                        size_6_price: event.target.value,
                      }))
                    }
                    disabled={!productForm.size_6_enabled}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                </label>

                <label className="grid grid-cols-[auto,1fr,120px] items-center gap-3 rounded-xl border border-slate-100 px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={productForm.size_8_enabled}
                    onChange={(event) =>
                      setProductForm((prev) => ({
                        ...prev,
                        size_8_enabled: event.target.checked,
                      }))
                    }
                  />
                  <span className="font-medium text-slate-700">8 cm</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    inputMode="numeric"
                    placeholder="$"
                    value={productForm.size_8_price}
                    onChange={(event) =>
                      setProductForm((prev) => ({
                        ...prev,
                        size_8_price: event.target.value,
                      }))
                    }
                    disabled={!productForm.size_8_enabled}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                </label>
              </div>
            </div>
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
              <option value="">{`Seleccion\u00e1 categor\u00eda`}</option>
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

            <div className="rounded-2xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-800">
                  Subir muchas calcos
                </p>
                <p className="text-xs text-slate-500">
                  {bulkSummary.done} de {bulkSummary.total} subidas
                </p>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <select
                  value={bulkCategoryId}
                  onChange={(event) => setBulkCategoryId(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                >
                  <option value="">Seleccioná categoría para todas estas imágenes</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>

                <label className="w-full">
                  <span className="sr-only">Seleccionar imágenes</span>
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) => {
                      handleBulkSelectFiles(event.target.files);
                      event.currentTarget.value = "";
                    }}
                    className="w-full rounded-xl border border-dashed border-slate-300 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                  />
                </label>
              </div>

              <p className="mt-2 text-xs text-slate-500">
                Máx 350 KB por archivo (JPG/PNG/WebP)
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Usa la configuración de precio de este formulario y se aplica a todas las calcos del lote.
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleStartBulkUpload}
                  disabled={bulkRunning}
                  className="rounded-full bg-[var(--color-primary)] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[var(--color-primary-dark)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Iniciar carga
                </button>
                <button
                  type="button"
                  onClick={handleCancelBulkUpload}
                  disabled={!bulkRunning}
                  className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleRetryFailedBulkUploads}
                  disabled={bulkRunning || bulkSummary.failed === 0}
                  className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Reintentar fallidas
                </button>
              </div>

              {bulkItems.length > 0 ? (
                <div className="mt-3 max-h-56 space-y-2 overflow-y-auto rounded-xl border border-slate-100 p-2">
                  {bulkItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 px-3 py-2 text-xs"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-800">
                          {item.file.name}
                        </p>
                        <p className="truncate text-slate-500">{item.message}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`shrink-0 rounded-full px-2 py-1 font-semibold ${
                            item.status === "success"
                              ? "bg-emerald-100 text-emerald-700"
                              : item.status === "error" || item.status === "invalid"
                              ? "bg-rose-100 text-rose-700"
                              : item.status === "uploading"
                              ? "bg-amber-100 text-amber-700"
                              : item.status === "cancelled"
                              ? "bg-slate-200 text-slate-600"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {item.status === "pending"
                            ? "pendiente"
                            : item.status === "uploading"
                            ? "subiendo"
                            : item.status === "success"
                            ? "ok"
                            : item.status === "invalid"
                            ? "rechazado"
                            : item.status === "cancelled"
                            ? "cancelado"
                            : "error"}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveBulkItem(item.id)}
                          disabled={bulkRunning && item.status === "uploading"}
                          className="rounded-full border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                className="rounded-full bg-[var(--color-primary)] px-6 py-3 text-white hover:bg-[var(--color-primary-dark)]"
                disabled={productLoading || bulkPriceLoading}
              >
                {productForm.id ? "Actualizar producto" : "Crear producto"}
              </button>
              <button
                type="button"
                onClick={handleApplyProductFormPricesToSelected}
                disabled={
                  selectedProductIds.length === 0 ||
                  productLoading ||
                  bulkPriceLoading
                }
                className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Aplicar estos precios a seleccionados ({selectedProductIds.length})
              </button>
            </div>
            {selectedProductIds.length > 0 ? (
              <p className="text-xs text-slate-500">
                Este botón usa solo los precios cargados arriba. No modifica nombre ni
                imagen ni descripción.
              </p>
            ) : null}
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
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={productSearchTerm}
                onChange={(event) => setProductSearchTerm(event.target.value)}
                placeholder="Buscar calco por nombre"
                className="w-[210px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
              />
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
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 px-2">
            <button
              type="button"
              onClick={handleSelectVisibleProducts}
              disabled={filteredAndSortedProducts.length === 0}
              className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Seleccionar visibles
            </button>
            <button
              type="button"
              onClick={handleClearSelectedProducts}
              disabled={selectedProductIds.length === 0}
              className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Limpiar selección
            </button>
            <button
              type="button"
              onClick={handleDeleteSelectedProducts}
              disabled={selectedProductIds.length === 0}
              className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Borrar seleccionados ({selectedProductIds.length})
            </button>
            {selectedProductIds.length > 0 ? (
              <span className="text-xs text-slate-500">
                Visibles seleccionados: {selectedVisibleCount}
              </span>
            ) : null}
          </div>
          <div className="mt-3 rounded-2xl border border-slate-200 p-3">
            <p className="text-sm font-semibold text-slate-800">
              Editar precios seleccionados
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Aplicá un mismo precio a una o varias calcos. Elegí precio único o por
              tamaños.
            </p>

            <div className="mt-3 space-y-3">
              <div className="rounded-xl border border-slate-100 p-3">
                <label className="block text-xs font-semibold text-slate-700">
                  Precio único
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  placeholder="Precio en ARS"
                  value={bulkPriceForm.legacy_price > 0 ? bulkPriceForm.legacy_price : ""}
                  onChange={(event) =>
                    setBulkPriceForm((prev) => ({
                      ...prev,
                      legacy_price:
                        event.target.value === ""
                          ? 0
                          : Math.max(Number(event.target.value), 0),
                    }))
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                />
              </div>

              <div className="rounded-xl border border-slate-100 p-3">
                <p className="text-xs font-semibold text-slate-700">Precios por tamaño</p>
                <div className="mt-2 space-y-2">
                  <label className="grid grid-cols-[auto,1fr,110px] items-center gap-2 rounded-lg border border-slate-100 px-2 py-2 text-xs">
                    <input
                      type="checkbox"
                      checked={bulkPriceForm.size_4_enabled}
                      onChange={(event) =>
                        setBulkPriceForm((prev) => ({
                          ...prev,
                          size_4_enabled: event.target.checked,
                        }))
                      }
                    />
                    <span className="font-medium text-slate-700">4 cm</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      inputMode="numeric"
                      placeholder="$"
                      value={bulkPriceForm.size_4_price}
                      onChange={(event) =>
                        setBulkPriceForm((prev) => ({
                          ...prev,
                          size_4_price: event.target.value,
                        }))
                      }
                      disabled={!bulkPriceForm.size_4_enabled}
                      className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs focus:border-slate-400 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
                    />
                  </label>
                  <label className="grid grid-cols-[auto,1fr,110px] items-center gap-2 rounded-lg border border-slate-100 px-2 py-2 text-xs">
                    <input
                      type="checkbox"
                      checked={bulkPriceForm.size_6_enabled}
                      onChange={(event) =>
                        setBulkPriceForm((prev) => ({
                          ...prev,
                          size_6_enabled: event.target.checked,
                        }))
                      }
                    />
                    <span className="font-medium text-slate-700">6 cm</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      inputMode="numeric"
                      placeholder="$"
                      value={bulkPriceForm.size_6_price}
                      onChange={(event) =>
                        setBulkPriceForm((prev) => ({
                          ...prev,
                          size_6_price: event.target.value,
                        }))
                      }
                      disabled={!bulkPriceForm.size_6_enabled}
                      className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs focus:border-slate-400 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
                    />
                  </label>
                  <label className="grid grid-cols-[auto,1fr,110px] items-center gap-2 rounded-lg border border-slate-100 px-2 py-2 text-xs">
                    <input
                      type="checkbox"
                      checked={bulkPriceForm.size_8_enabled}
                      onChange={(event) =>
                        setBulkPriceForm((prev) => ({
                          ...prev,
                          size_8_enabled: event.target.checked,
                        }))
                      }
                    />
                    <span className="font-medium text-slate-700">8 cm</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      inputMode="numeric"
                      placeholder="$"
                      value={bulkPriceForm.size_8_price}
                      onChange={(event) =>
                        setBulkPriceForm((prev) => ({
                          ...prev,
                          size_8_price: event.target.value,
                        }))
                      }
                      disabled={!bulkPriceForm.size_8_enabled}
                      className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs focus:border-slate-400 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
                    />
                  </label>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleBulkPriceUpdate}
                  disabled={selectedProductIds.length === 0 || bulkPriceLoading}
                  className="rounded-full bg-[var(--color-primary)] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[var(--color-primary-dark)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Aplicar precios a seleccionados
                </button>
                <button
                  type="button"
                  onClick={() => setBulkPriceForm(emptyBulkPriceForm)}
                  disabled={bulkPriceLoading}
                  className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Limpiar precios
                </button>
              </div>
            </div>
          </div>
          <div className="mt-3 space-y-3">
            {filteredAndSortedProducts.length === 0 ? (
              <p className="text-sm text-slate-500">
                {productSearchTerm.trim()
                  ? "No hay productos con ese nombre."
                  : "Sin productos cargados."}
              </p>
            ) : (
              filteredAndSortedProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex flex-col gap-2 rounded-2xl border border-slate-100 px-3 py-3 text-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedProductIdsSet.has(product.id)}
                        onChange={() => toggleProductSelection(product.id)}
                        className="h-4 w-4 rounded border-slate-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                      />
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{product.name}</p>
                        {product.description ? (
                          <p className="truncate text-xs text-slate-500">
                            {product.description}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <span className="text-slate-500">
                      {formatProductPriceSummary(product)}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => handleEditProduct(product)}
                      className="text-slate-500 hover:text-slate-900"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
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

      <SubcategoryManager categories={categories} products={products} />
    </div>
  );
};



