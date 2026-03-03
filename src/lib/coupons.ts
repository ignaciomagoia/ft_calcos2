import { createSupabaseBrowserClient } from "./supabaseClient";

export type Coupon = {
  id: string;
  code: string;
  percent: number;
  created_at?: string | null;
};

export type AppliedCoupon = Pick<Coupon, "code" | "percent">;

export const APPLIED_COUPON_STORAGE_KEY = "appliedCoupon";

const isBrowser = () => typeof window !== "undefined";

export const normalizeCouponCode = (value: string) => value.trim().toUpperCase();

export const isCouponPercentInRange = (value: number) =>
  Number.isFinite(value) && value >= 1 && value <= 100;

const parseAppliedCoupon = (value: unknown): AppliedCoupon | null => {
  if (!value || typeof value !== "object") return null;

  const raw = value as { code?: unknown; percent?: unknown };
  const code = normalizeCouponCode(typeof raw.code === "string" ? raw.code : "");
  const percent = typeof raw.percent === "number" ? raw.percent : Number(raw.percent);

  if (!code || !isCouponPercentInRange(percent)) return null;

  return { code, percent };
};

const parseCouponRow = (value: unknown): Coupon | null => {
  if (!value || typeof value !== "object") return null;

  const raw = value as {
    id?: unknown;
    code?: unknown;
    percent?: unknown;
    created_at?: unknown;
  };

  const id = typeof raw.id === "string" ? raw.id : "";
  const parsed = parseAppliedCoupon(raw);
  if (!id || !parsed) return null;

  return {
    id,
    code: parsed.code,
    percent: parsed.percent,
    created_at: typeof raw.created_at === "string" ? raw.created_at : null,
  };
};

export const listCoupons = async (): Promise<Coupon[]> => {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("coupons")
    .select("id, code, percent, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(parseCouponRow).filter((coupon): coupon is Coupon => !!coupon);
};

export const createCoupon = async (input: AppliedCoupon): Promise<Coupon> => {
  const code = normalizeCouponCode(input.code);
  const percent = Number(input.percent);

  if (!code) {
    throw new Error("Ingresa un codigo valido.");
  }

  if (!isCouponPercentInRange(percent)) {
    throw new Error("El descuento debe estar entre 1 y 100.");
  }

  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("coupons")
    .insert({ code, percent })
    .select("id, code, percent, created_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("Ese cupon ya existe.");
    }

    throw new Error(error.message);
  }

  const coupon = parseCouponRow(data);
  if (!coupon) {
    throw new Error("No se pudo guardar el cupon.");
  }

  return coupon;
};

export const deleteCoupon = async (id: string) => {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.from("coupons").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
};

export const validateCouponCode = async (
  rawCode: string
): Promise<AppliedCoupon | null> => {
  const code = normalizeCouponCode(rawCode);
  if (!code) return null;

  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("validate_coupon", {
    input_code: code,
  });

  if (error) {
    throw new Error(error.message);
  }

  const row = Array.isArray(data) ? data[0] : data;
  return parseAppliedCoupon(row);
};

export const getAppliedCoupon = (): AppliedCoupon | null => {
  if (!isBrowser()) return null;

  try {
    const raw = window.localStorage.getItem(APPLIED_COUPON_STORAGE_KEY);
    if (!raw) return null;
    return parseAppliedCoupon(JSON.parse(raw));
  } catch {
    return null;
  }
};

export const setAppliedCoupon = (coupon: AppliedCoupon) => {
  if (!isBrowser()) return;

  const normalized = parseAppliedCoupon(coupon);
  if (!normalized) return;

  window.localStorage.setItem(
    APPLIED_COUPON_STORAGE_KEY,
    JSON.stringify(normalized)
  );
};

export const clearAppliedCoupon = () => {
  if (!isBrowser()) return;
  window.localStorage.removeItem(APPLIED_COUPON_STORAGE_KEY);
};
