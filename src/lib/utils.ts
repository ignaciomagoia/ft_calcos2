const pesosFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const TRAILING_NUMBER_REGEX = /(\d+)\s*$/;

export const formatCurrency = (amount: number) =>
  pesosFormatter.format(amount ?? 0);

export const buildImagePlaceholder = (name: string) => {
  const initials = name
    .split(" ")
    .map((chunk) => chunk[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return `https://placehold.co/600x600?text=${encodeURIComponent(initials)}`;
};

export const slugify = (value: string) => {
  if (!value) return "";
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
};

export const extractTrailingNumber = (value: string): number | null => {
  const normalized = value.trim();
  const match = normalized.match(TRAILING_NUMBER_REGEX);
  if (!match) return null;

  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : null;
};

export const compareNamesWithTrailingNumber = (
  aName: string,
  bName: string
) => {
  const aNumber = extractTrailingNumber(aName);
  const bNumber = extractTrailingNumber(bName);

  if (aNumber !== null && bNumber !== null && aNumber !== bNumber) {
    return aNumber - bNumber;
  }

  if (aNumber !== null && bNumber === null) return -1;
  if (aNumber === null && bNumber !== null) return 1;

  return aName.localeCompare(bName, "es", { sensitivity: "base" });
};

export const normalizeCustomerName = (value: string) =>
  value
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);

export const normalizeCustomerPhone = (value: string) =>
  value
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 30);

export const isValidCustomerPhone = (value: string) => {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 8;
};

export const normalizeCustomerEmail = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .slice(0, 120);

export const isValidCustomerEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
