import { type User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "./supabaseServer";
import type {
  AdminLists,
  Category,
  Product,
  ProductSubcategoryLink,
  Profile,
  Subcategory,
} from "./types";
import { compareNamesWithTrailingNumber } from "./utils";

const orderCategories = (query: any) =>
  query.order("sort_order", { ascending: true, nullsFirst: false }).order(
    "name",
    { ascending: true }
  );

const orderSubcategories = (query: any) =>
  query.order("sort_order", { ascending: true, nullsFirst: false }).order(
    "name",
    { ascending: true }
  );

const isMissingTableError = (error: any) => error?.code === "42P01";
const isMissingColumnError = (error: any, columnName: string) =>
  error?.code === "42703" &&
  String(error?.message ?? "")
    .toLowerCase()
    .includes(columnName.toLowerCase());
const PRODUCTS_PAGE_SIZE = 1000;
const PUBLIC_PRODUCTS_DEFAULT_PAGE_SIZE = 24;
const PUBLIC_PRODUCTS_MAX_PAGE_SIZE = 30;

const clampPublicProductsPageSize = (value?: number) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return PUBLIC_PRODUCTS_DEFAULT_PAGE_SIZE;
  }

  return Math.min(PUBLIC_PRODUCTS_MAX_PAGE_SIZE, Math.floor(parsed));
};

const fetchAllRows = async <T extends Record<string, unknown>>(
  buildQuery: () => any
): Promise<{ data: T[]; error: any }> => {
  const allRows: T[] = [];
  let from = 0;

  while (true) {
    const to = from + PRODUCTS_PAGE_SIZE - 1;
    const { data, error } = await buildQuery().range(from, to);

    if (error) {
      return { data: [], error };
    }

    const currentPage = (data ?? []) as T[];
    allRows.push(...currentPage);

    if (currentPage.length < PRODUCTS_PAGE_SIZE) {
      break;
    }

    from += PRODUCTS_PAGE_SIZE;
  }

  return { data: allRows, error: null };
};

const applyProductSortOrder = (query: any, withSortNumber = true) => {
  let sortableQuery = query;

  if (withSortNumber) {
    sortableQuery = sortableQuery.order("sort_number", {
      ascending: true,
      nullsFirst: false,
    });
  }

  return sortableQuery
    .order("name", { ascending: true })
    .order("id", { ascending: true });
};

export const getCategories = async (): Promise<Category[]> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await orderCategories(
    supabase.from("categories").select("*")
  );

  if (error) {
    console.error("Error fetching categories", error);
    return [];
  }

  return data ?? [];
};

export const getCategoryBySlug = async (
  slug: string
): Promise<Category | null> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("Error fetching category", error);
    return null;
  }

  return data;
};

export const getProductsByCategoryId = async (
  categoryId: string
): Promise<Product[]> => {
  const supabase = await createSupabaseServerClient();
  const buildBaseQuery = (withSortNumber: boolean) =>
    applyProductSortOrder(
      supabase
        .from("products")
        .select("*")
        .eq("category_id", categoryId)
        .eq("active", true),
      withSortNumber
    );

  let { data, error } = await fetchAllRows<Product>(() => buildBaseQuery(true));

  if (error && isMissingColumnError(error, "sort_number")) {
    const fallback = await fetchAllRows<Product>(() => buildBaseQuery(false));
    data = fallback.data;
    error = fallback.error;
  }

  if (error) {
    console.error("Error fetching products", error);
    return [];
  }

  return [...(data ?? [])].sort((a, b) =>
    compareNamesWithTrailingNumber(a.name, b.name)
  );
};

export type CatalogProductsPage = {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

type CatalogProductsPageParams = {
  categoryId: string;
  subcategoryId?: string | null;
  page?: number;
  pageSize?: number;
};

const getCatalogProductsSelectColumns = (withSubcategoryJoin: boolean) => {
  const baseColumns =
    "id, name, description, price, price_4, price_6, price_8, category_id, image_url, created_at";

  if (withSubcategoryJoin) {
    return `${baseColumns}, product_subcategories!inner(subcategory_id)`;
  }

  return baseColumns;
};

export const getCatalogProductsPage = async ({
  categoryId,
  subcategoryId = null,
  page = 1,
  pageSize = PUBLIC_PRODUCTS_DEFAULT_PAGE_SIZE,
}: CatalogProductsPageParams): Promise<CatalogProductsPage> => {
  const supabase = await createSupabaseServerClient();
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const safePageSize = clampPublicProductsPageSize(pageSize);
  const from = (safePage - 1) * safePageSize;
  const to = from + safePageSize - 1;
  const normalizedSubcategoryId =
    typeof subcategoryId === "string" && subcategoryId.trim().length > 0
      ? subcategoryId.trim()
      : null;

  const withSubcategoryJoin = Boolean(normalizedSubcategoryId);

  const runQuery = async (withSortNumber: boolean) => {
    let query: any = supabase
      .from("products")
      .select(getCatalogProductsSelectColumns(withSubcategoryJoin), {
        count: "exact",
      })
      .eq("category_id", categoryId)
      .eq("active", true);

    if (normalizedSubcategoryId) {
      query = query.eq(
        "product_subcategories.subcategory_id",
        normalizedSubcategoryId
      );
    }

    return applyProductSortOrder(query, withSortNumber).range(from, to);
  };

  let { data, error, count } = await runQuery(true);

  if (error && isMissingColumnError(error, "sort_number")) {
    const fallback = await runQuery(false);
    data = fallback.data;
    error = fallback.error;
    count = fallback.count;
  }

  if (error) {
    console.error("Error fetching paginated catalog products", error);
    return {
      items: [],
      total: 0,
      page: safePage,
      pageSize: safePageSize,
      hasMore: false,
    };
  }

  const items = ((data ?? []) as Array<Record<string, unknown>>).map((row) => {
    const { product_subcategories: _subcategories, ...product } = row;
    return product as Product;
  });
  const total = Number.isFinite(count) ? Number(count) : items.length;

  return {
    items,
    total,
    page: safePage,
    pageSize: safePageSize,
    hasMore: from + items.length < total,
  };
};

type CategorySubcategoryFilters = {
  subcategories: Subcategory[];
  links: ProductSubcategoryLink[];
};

export const getCategorySubcategoryFilters = async (
  categoryId: string,
  options: {
    includeLinks?: boolean;
  } = {}
): Promise<CategorySubcategoryFilters> => {
  const supabase = await createSupabaseServerClient();
  const includeLinks = options.includeLinks ?? true;

  const subcategoriesResult = await orderSubcategories(
    supabase.from("subcategories").select("*").eq("category_id", categoryId)
  );

  if (subcategoriesResult.error) {
    if (!isMissingTableError(subcategoriesResult.error)) {
      console.error(
        "Error fetching subcategories for category",
        subcategoriesResult.error
      );
    }
    return { subcategories: [], links: [] };
  }

  const subcategories: Subcategory[] = (subcategoriesResult.data ??
    []) as Subcategory[];
  if (subcategories.length === 0) {
    return { subcategories: [], links: [] };
  }

  if (!includeLinks) {
    return { subcategories, links: [] };
  }

  const subcategoryIds = subcategories.map((subcategory) => subcategory.id);
  const linksResult = await supabase
    .from("product_subcategories")
    .select("subcategory_id, product_id")
    .in("subcategory_id", subcategoryIds);

  if (linksResult.error) {
    if (!isMissingTableError(linksResult.error)) {
      console.error(
        "Error fetching product subcategory links for category",
        linksResult.error
      );
    }
    return { subcategories, links: [] };
  }

  return {
    subcategories,
    links: linksResult.data ?? [],
  };
};

export const getProductWithCategory = async (
  id: string
): Promise<Product | null> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, categories(id, name, slug)")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Error fetching product", error);
    return null;
  }

  if (!data) {
    return null;
  }

  const category = Array.isArray((data as any).categories)
    ? (data as any).categories[0]
    : (data as any).categories;

  const product: Product = {
    ...data,
    category: category ?? null,
  };

  return product;
};

type SessionProfile = {
  user: User | null;
  profile: Profile | null;
};

export const getSessionProfile = async (): Promise<SessionProfile> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { user: null, profile: null };
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Error fetching profile", error);
    return { user, profile: null };
  }

  return { user, profile };
};

export const getAdminLists = async (): Promise<AdminLists> => {
  const supabase = await createSupabaseServerClient();

  const categoriesPromise = orderCategories(supabase.from("categories").select("*"));
  const productsPromise = fetchAllRows<Product>(() =>
    applyProductSortOrder(supabase.from("products").select("*"), true)
  );

  const [categoriesResult, productsResultRaw] = await Promise.all([
    categoriesPromise,
    productsPromise,
  ]);

  let productsResult = productsResultRaw;
  if (
    productsResult.error &&
    isMissingColumnError(productsResult.error, "sort_number")
  ) {
    productsResult = await fetchAllRows<Product>(() =>
      applyProductSortOrder(supabase.from("products").select("*"), false)
    );
  }

  if (categoriesResult.error) {
    console.error("Error fetching categories for admin", categoriesResult.error);
  }

  if (productsResult.error) {
    console.error("Error fetching products for admin", productsResult.error);
  }

  return {
    categories: categoriesResult.data ?? [],
    products: productsResult.data ?? [],
  };
};
