"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  createCoupon,
  deleteCoupon,
  isCouponPercentInRange,
  listCoupons,
  normalizeCouponCode,
  type Coupon,
} from "@/lib/coupons";

export const CouponsAdminPanel = () => {
  const [couponCode, setCouponCode] = useState("");
  const [couponPercent, setCouponPercent] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const sortedCoupons = useMemo(
    () =>
      [...coupons].sort((a, b) =>
        a.code.localeCompare(b.code, "es", { sensitivity: "base" })
      ),
    [coupons]
  );

  const loadCoupons = async () => {
    setIsLoading(true);
    setListError(null);

    try {
      const nextCoupons = await listCoupons();
      setCoupons(nextCoupons);
    } catch (error: any) {
      setListError(error?.message ?? "No se pudieron cargar los cupones.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadCoupons();
  }, []);

  const handleCreateCoupon = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const normalizedCode = normalizeCouponCode(couponCode);
    const percent = Number(couponPercent);

    if (!normalizedCode) {
      setFormError("Ingresa un codigo.");
      return;
    }

    if (!isCouponPercentInRange(percent)) {
      setFormError("El descuento debe estar entre 1 y 100.");
      return;
    }

    setIsSaving(true);

    try {
      const createdCoupon = await createCoupon({ code: normalizedCode, percent });
      setCoupons((prev) => [
        createdCoupon,
        ...prev.filter((coupon) => coupon.id !== createdCoupon.id),
      ]);
      setCouponCode("");
      setCouponPercent("");
      setFormSuccess("Cupon creado.");
    } catch (error: any) {
      setFormError(error?.message ?? "No se pudo crear el cupon.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCoupon = async (coupon: Coupon) => {
    const confirmed = window.confirm(`Eliminar cupon ${coupon.code}?`);
    if (!confirmed) return;

    setFormError(null);
    setFormSuccess(null);

    try {
      await deleteCoupon(coupon.id);
      setCoupons((prev) => prev.filter((item) => item.id !== coupon.id));
      setFormSuccess("Cupon eliminado.");
    } catch (error: any) {
      setFormError(error?.message ?? "No se pudo eliminar el cupon.");
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr,1fr]">
      <section className="card rounded-3xl p-6">
        <h2 className="text-xl font-semibold text-slate-900">Crear cupon</h2>

        <form className="mt-4 grid gap-4" onSubmit={handleCreateCoupon}>
          <label className="grid gap-2 text-sm font-medium text-slate-600">
            Codigo
            <input
              type="text"
              value={couponCode}
              onChange={(event) => setCouponCode(event.target.value)}
              placeholder="Ej: HOTSALE20"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm uppercase focus:border-slate-400 focus:outline-none"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-slate-600">
            Descuento (%)
            <input
              type="number"
              min={1}
              max={100}
              step={1}
              value={couponPercent}
              onChange={(event) => setCouponPercent(event.target.value)}
              placeholder="1 - 100"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-400 focus:outline-none"
            />
          </label>

          <button
            type="submit"
            disabled={isSaving}
            className="rounded-full bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-dark)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Guardando..." : "Guardar cupon"}
          </button>

          {formError && <p className="text-sm text-rose-600">{formError}</p>}
          {formSuccess && <p className="text-sm text-emerald-700">{formSuccess}</p>}
        </form>
      </section>

      <section className="card rounded-3xl p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-slate-900">
            Cupones ({sortedCoupons.length})
          </h2>
          <button
            type="button"
            onClick={() => void loadCoupons()}
            className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Recargar
          </button>
        </div>

        {isLoading ? (
          <p className="mt-4 text-sm text-slate-500">Cargando cupones...</p>
        ) : listError ? (
          <p className="mt-4 text-sm text-rose-600">{listError}</p>
        ) : sortedCoupons.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No hay cupones creados.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {sortedCoupons.map((coupon) => (
              <li
                key={coupon.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">{coupon.code}</p>
                  <p className="text-xs text-slate-500">{coupon.percent}% off</p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleDeleteCoupon(coupon)}
                  className="rounded-full border border-rose-200 px-4 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                >
                  Eliminar
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};
