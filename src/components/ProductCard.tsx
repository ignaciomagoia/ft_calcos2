import Link from "next/link";
import type { Product } from "@/lib/types";
import { AddToCartButton } from "./AddToCartButton";
import { buildImagePlaceholder, formatCurrency } from "@/lib/utils";

type Props = {
  product: Product;
};

export const ProductCard = ({ product }: Props) => {
  const image = product.image_url || buildImagePlaceholder(product.name);

  return (
    <div className="card flex h-full flex-col gap-4 rounded-3xl p-4">
      <Link
        href={`/p/${product.id}`}
        className="group relative block overflow-hidden rounded-2xl bg-slate-100"
      >
        <img
          src={image}
          alt={product.name}
          className="h-64 w-full object-cover transition duration-300 group-hover:scale-105"
          loading="lazy"
        />
      </Link>

      <div className="flex flex-1 flex-col gap-3">
        <div className="space-y-1">
          <Link
            href={`/p/${product.id}`}
            className="text-lg font-semibold leading-tight text-slate-900"
          >
            {product.name}
          </Link>
          <p className="text-base font-medium text-slate-600">
            {formatCurrency(product.price)}
          </p>
        </div>

        <AddToCartButton product={product} />
      </div>
    </div>
  );
};
