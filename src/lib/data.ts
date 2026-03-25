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
  const { data, error } = await fetchAllRows<Product>(() =>
    supabase
      .from("products")
      .select("*")
      .eq("category_id", categoryId)
      .eq("active", true)
      .order("name", { ascending: true })
      .order("id", { ascending: true })
  );

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

const getCatalogProductsSortColumns = (withSubcategoryJoin: boolean) => {
  const baseColumns = "id, name";

  if (withSubcategoryJoin) {
    return `${baseColumns}, product_subcategories!inner(subcategory_id)`;
  }

  return baseColumns;
};

type CatalogProductSortRow = {
  id: string;
  name: string;
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
  const normalizedSubcategoryId =
    typeof subcategoryId === "string" && subcategoryId.trim().length > 0
      ? subcategoryId.trim()
      : null;

  const withSubcategoryJoin = Boolean(normalizedSubcategoryId);

  const { data: sortRowsRaw, error: sortRowsError } = await fetchAllRows<any>(() => {
    let sortQuery: any = supabase
      .from("products")
      .select(getCatalogProductsSortColumns(withSubcategoryJoin))
      .eq("category_id", categoryId)
      .eq("active", true)
      .order("id", { ascending: true });

    if (normalizedSubcategoryId) {
      sortQuery = sortQuery.eq(
        "product_subcategories.subcategory_id",
        normalizedSubcategoryId
      );
    }

    return sortQuery;
  });

  if (sortRowsError) {
    console.error("Error fetching catalog sort rows", sortRowsError);
    return {
      items: [],
      total: 0,
      page: safePage,
      pageSize: safePageSize,
      hasMore: false,
    };
  }

  const sortRows = (sortRowsRaw ?? [])
    .map((row): CatalogProductSortRow | null => {
      const id = typeof row.id === "string" ? row.id : "";
      const name = typeof row.name === "string" ? row.name : "";
      if (!id || !name) return null;
      return { id, name };
    })
    .filter((row): row is CatalogProductSortRow => row !== null)
    .sort((a, b) => {
      const byName = compareNamesWithTrailingNumber(a.name, b.name);
      if (byName !== 0) return byName;
      return a.id.localeCompare(b.id, "es", { sensitivity: "base" });
    });

  const orderedIds: string[] = [];
  const seenIds = new Set<string>();
  for (const row of sortRows) {
    if (seenIds.has(row.id)) continue;
    seenIds.add(row.id);
    orderedIds.push(row.id);
  }

  const total = orderedIds.length;
  if (total === 0) {
    return {
      items: [],
      total: 0,
      page: safePage,
      pageSize: safePageSize,
      hasMore: false,
    };
  }

  const pageIds = orderedIds.slice(from, from + safePageSize);
  if (pageIds.length === 0) {
    return {
      items: [],
      total,
      page: safePage,
      pageSize: safePageSize,
      hasMore: false,
    };
  }

  let pageQuery: any = supabase
    .from("products")
    .select(getCatalogProductsSelectColumns(withSubcategoryJoin))
    .eq("category_id", categoryId)
    .eq("active", true)
    .in("id", pageIds);

  if (normalizedSubcategoryId) {
    pageQuery = pageQuery.eq(
      "product_subcategories.subcategory_id",
      normalizedSubcategoryId
    );
  }

  const { data: pageRows, error: pageRowsError } = await pageQuery;

  if (pageRowsError) {
    console.error("Error fetching paginated catalog products", pageRowsError);
    return {
      items: [],
      total,
      page: safePage,
      pageSize: safePageSize,
      hasMore: false,
    };
  }

  const pageItems = ((pageRows ?? []) as Array<Record<string, unknown>>).map((row) => {
    const { product_subcategories: _subcategories, ...product } = row;
    return product as Product;
  });
  const productsById = new Map<string, Product>(
    pageItems.map((product) => [product.id, product])
  );
  const orderedItems = pageIds
    .map((id) => productsById.get(id))
    .filter((product): product is Product => Boolean(product));

  return {
    items: orderedItems,
    total,
    page: safePage,
    pageSize: safePageSize,
    hasMore: from + orderedItems.length < total,
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

  const [categoriesResult, productsResult] = await Promise.all([
    orderCategories(supabase.from("categories").select("*")),
    fetchAllRows<Product>(() =>
      supabase
        .from("products")
        .select("*")
        .order("name", { ascending: true })
        .order("id", { ascending: true })
    ),
  ]);

  if (categoriesResult.error) {
    console.error("Error fetching categories for admin", categoriesResult.error);
  }

  if (productsResult.error) {
    console.error("Error fetching products for admin", productsResult.error);
  }

  return {
    categories: categoriesResult.data ?? [],
    products: [...(productsResult.data ?? [])].sort((a, b) =>
      compareNamesWithTrailingNumber(a.name, b.name)
    ),
  };
};
