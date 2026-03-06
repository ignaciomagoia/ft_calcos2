import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "@/components/admin/LoginForm";
import { OrdersAdminPanel } from "@/components/admin/OrdersAdminPanel";
import { getSessionProfile } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const { user, profile } = await getSessionProfile();

  if (!user) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-md space-y-6">
          <h1 className="text-3xl font-semibold">Panel EFETE</h1>
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    );
  }

  if (profile?.role !== "admin") {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-rose-200 bg-white p-8 text-center text-rose-600">
          <p className="text-lg font-semibold">Acceso denegado</p>
          <p className="mt-2 text-sm text-rose-500">
            Tu usuario no tiene el rol <strong>admin</strong>. Pedile a un
            administrador que actualice tu perfil en Supabase.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <nav className="text-sm text-slate-500">
          <Link href="/admin" className="hover:text-slate-900">
            Admin
          </Link>
          <span className="mx-2">/</span>
          <span className="font-medium text-slate-900">Pedidos</span>
        </nav>

        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold">Admin &gt; Pedidos</h1>
            <p className="mt-1 text-sm text-slate-500">
              Pedidos generados desde la web antes de abrir WhatsApp.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/coupons"
              className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Ir a Cupones
            </Link>
            <Link
              href="/admin"
              className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Volver a Admin
            </Link>
          </div>
        </header>

        <OrdersAdminPanel />
      </div>
    </div>
  );
}
