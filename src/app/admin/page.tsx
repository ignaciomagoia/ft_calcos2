import { Suspense } from "react";
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
      <div className="mx-auto max-w-md space-y-6">
        <h1 className="text-3xl font-semibold">Panel EFETE</h1>
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    );
  }

  if (profile?.role !== "admin") {
    return (
      <div className="rounded-3xl border border-rose-200 bg-white p-8 text-center text-rose-600">
        <p className="text-lg font-semibold">Acceso denegado</p>
        <p className="mt-2 text-sm text-rose-500">
          Tu usuario no tiene el rol <strong>admin</strong>. Pedile a un
          administrador que actualice tu perfil en Supabase.
        </p>
      </div>
    );
  }

  return (
    <Suspense fallback={<p>Cargando panel...</p>}>
      <AdminDashboard
        initialCategories={lists.categories}
        initialProducts={lists.products}
      />
    </Suspense>
  );
}
