import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CategoryProductsGrid } from "@/components/CategoryProductsGrid";
import {
  getCatalogProductsPage,
  getCategoryBySlug,
  getCategorySubcategoryFilters,
} from "@/lib/data";

type Props = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    return { title: "Categor\u00eda no encontrada" };
  }

  return { title: `${category.name} | Cat\u00e1logo` };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const [productsPage, subcategoryFilters] = await Promise.all([
    getCatalogProductsPage({
      categoryId: category.id,
      page: 1,
      pageSize: 24,
    }),
    getCategorySubcategoryFilters(category.id, { includeLinks: false }),
  ]);

  const categoryDescription =
    typeof category.description === "string" &&
    category.description.trim().length > 0
      ? category.description
      : "Agreg\u00e1 productos desde esta colecci\u00f3n. Los ver\u00e1s en tu carrito.";

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
      <div className="space-y-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
        >
          {"<- Volver"}
        </Link>

        <header className="space-y-3">
          <p className="pill">{"Categor\u00eda"}</p>
          <h1 className="text-4xl font-semibold">{category.name}</h1>
          <p className="text-slate-600">{categoryDescription}</p>
        </header>

        <CategoryProductsGrid
          categoryId={category.id}
          initialProducts={productsPage.items}
          initialTotal={productsPage.total}
          initialHasMore={productsPage.hasMore}
          pageSize={productsPage.pageSize}
          subcategories={subcategoryFilters.subcategories}
          displayMode={category.product_layout === "large" ? "large" : "compact"}
        />
      </div>
    </div>
  );
}
