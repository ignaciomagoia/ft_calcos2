import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CategoryProductsGrid } from "@/components/CategoryProductsGrid";
import {
  getCategoryBySlug,
  getCategorySubcategoryFilters,
  getProductsByCategoryId,
} from "@/lib/data";

type Props = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    return { title: "Categoría no encontrada" };
  }

  return { title: `${category.name} | Catálogo` };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const [products, subcategoryFilters] = await Promise.all([
    getProductsByCategoryId(category.id),
    getCategorySubcategoryFilters(category.id),
  ]);

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
          <p className="pill">Categoría</p>
          <h1 className="text-4xl font-semibold">{category.name}</h1>
          <p className="text-slate-600">
            Agregá productos desde esta colección. Los verás en tu carrito.
          </p>
        </header>

        <CategoryProductsGrid
          products={products}
          subcategories={subcategoryFilters.subcategories}
          links={subcategoryFilters.links}
        />
      </div>
    </div>
  );
}
