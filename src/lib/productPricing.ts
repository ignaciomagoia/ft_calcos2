import type { Product } from "./types";

export type ProductSizeCm = 4 | 6 | 8;

export type ProductSizeOption = {
  sizeCm: ProductSizeCm;
  price: number;
};

const toPositiveNumber = (value: number | null | undefined): number | null => {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return null;
  }
  return value;
};

export const getProductSizeOptions = (
  product: Pick<Product, "price_4" | "price_6" | "price_8">
): ProductSizeOption[] => {
  const options: ProductSizeOption[] = [];
  const price4 = toPositiveNumber(product.price_4);
  const price6 = toPositiveNumber(product.price_6);
  const price8 = toPositiveNumber(product.price_8);

  if (price4) options.push({ sizeCm: 4, price: price4 });
  if (price6) options.push({ sizeCm: 6, price: price6 });
  if (price8) options.push({ sizeCm: 8, price: price8 });

  return options;
};

export const getLegacyProductPrice = (
  product: Pick<Product, "price">
): number | null => toPositiveNumber(product.price);

