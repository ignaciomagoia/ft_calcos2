import { Suspense } from "react";
import Link from "next/link";
import { getAdminLists, getSessionProfile } from "@/lib/data";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { LoginForm } from "@/components/admin/LoginForm";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [{ user, profile }, lists] = await Promise.all([
    getSessionProfile(),
    getAdminLists(),
  ]);

  if (!user) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-md space-y-6">
          <h1 className="text-3xl font-semibold">Panel EFETE</h1>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/coupons"
              className="inline-flex rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Admin &gt; Cupones
            </Link>
            <Link
              href="/admin/orders"
              className="inline-flex rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Admin &gt; Pedidos
            </Link>
          </div>
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
      <div className="mb-4 flex justify-end gap-2">
        <Link
          href="/admin/coupons"
          className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Admin &gt; Cupones
        </Link>
        <Link
          href="/admin/orders"
          className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Admin &gt; Pedidos
        </Link>
      </div>
      <Suspense fallback={<p>Cargando panel...</p>}>
        <AdminDashboard
          initialCategories={lists.categories}
          initialProducts={lists.products}
        />
      </Suspense>
    </div>
  );
}
