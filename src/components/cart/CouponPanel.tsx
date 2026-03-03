"use client";

import type { AppliedCoupon } from "@/lib/coupons";

type CouponPanelProps = {
  couponInput: string;
  onCouponInputChange: (value: string) => void;
  onApplyCoupon: () => void;
  onRemoveCoupon: () => void;
  appliedCoupon: AppliedCoupon | null;
  isApplying: boolean;
  feedback: { type: "success" | "error"; message: string } | null;
};

export const CouponPanel = ({
  couponInput,
  onCouponInputChange,
  onApplyCoupon,
  onRemoveCoupon,
  appliedCoupon,
  isApplying,
  feedback,
}: CouponPanelProps) => (
  <section className="rounded-2xl border border-slate-200 p-4">
    <h3 className="text-sm font-semibold text-slate-900">Cupon</h3>

    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
      <input
        type="text"
        value={couponInput}
        onChange={(event) => onCouponInputChange(event.target.value)}
        placeholder="Codigo de cupon"
        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm uppercase focus:border-slate-400 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
        disabled={isApplying}
      />
      <button
        type="button"
        onClick={onApplyCoupon}
        disabled={isApplying}
        className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isApplying ? "Validando..." : "Aplicar"}
      </button>
    </div>

    {feedback && (
      <p
        className={`mt-2 text-xs ${
          feedback.type === "success" ? "text-emerald-700" : "text-rose-600"
        }`}
      >
        {feedback.message}
      </p>
    )}

    {appliedCoupon && (
      <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-emerald-50 px-3 py-2">
        <p className="text-xs font-semibold text-emerald-700">
          Activo: {appliedCoupon.code} ({appliedCoupon.percent}%)
        </p>
        <button
          type="button"
          onClick={onRemoveCoupon}
          className="rounded-full border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
        >
          Quitar cupon
        </button>
      </div>
    )}
  </section>
);
