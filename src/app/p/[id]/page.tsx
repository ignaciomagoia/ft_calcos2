import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/ProductDetail";
import { getProductWithCategory } from "@/lib/data";

type Props = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductWithCategory(id);
  if (!product) {
    return { title: "Producto no encontrado" };
  }

  return {
    title: product.name,
    description: `Comprá ${product.name} en EFETE Calcos`,
  };
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const product = await getProductWithCategory(id);

  if (!product) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
      <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <Link
          href={product.category ? `/c/${product.category.slug}` : "/"}
          className="text-sm font-medium text-slate-500 transition hover:text-slate-900"
        >
          ← Volver
        </Link>
        {product.category && (
          <Link
            href={`/c/${product.category.slug}`}
            className="pill"
          >
            {product.category.name}
          </Link>
        )}
      </div>

      <ProductDetail product={product} />
      </div>
    </div>
  );
}
