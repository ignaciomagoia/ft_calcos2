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

const fetchAllProducts = async (
  buildQuery: () => any
): Promise<{ data: Product[]; error: any }> => {
  const allProducts: Product[] = [];
  let from = 0;

  while (true) {
    const to = from + PRODUCTS_PAGE_SIZE - 1;
    const { data, error } = await buildQuery().range(from, to);

    if (error) {
      return { data: [], error };
    }

    const currentPage = (data ?? []) as Product[];
    allProducts.push(...currentPage);

    if (currentPage.length < PRODUCTS_PAGE_SIZE) {
      break;
    }

    from += PRODUCTS_PAGE_SIZE;
  }

  return { data: allProducts, error: null };
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
  const { data, error } = await fetchAllProducts(() =>
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

type CategorySubcategoryFilters = {
  subcategories: Subcategory[];
  links: ProductSubcategoryLink[];
};

export const getCategorySubcategoryFilters = async (
  categoryId: string
): Promise<CategorySubcategoryFilters> => {
  const supabase = await createSupabaseServerClient();

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
    fetchAllProducts(() =>
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
