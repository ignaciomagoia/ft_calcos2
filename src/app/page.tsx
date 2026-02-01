import Link from "next/link";
import { getCategories } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const categories = await getCategories();

  return (
    <div className="space-y-12">
      <section className="card grid gap-10 overflow-hidden px-6 py-10 md:grid-cols-2 md:px-12 md:py-14">
        <div className="space-y-6">
          <p className="pill pill--accent w-fit">Edición limitada</p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Calcos premium listas para pegar donde quieras.
          </h1>
          <p className="text-lg text-slate-600">
            Diseños de alta definición, material resistente y envíos en 24hs.
            Armá tu carrito y coordinamos por WhatsApp.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="#catalogo"
              className="inline-flex items-center justify-center rounded-full bg-[var(--color-primary)] px-6 py-3 text-white shadow-lg shadow-[rgba(1,34,161,0.35)] transition hover:-translate-y-0.5 hover:bg-[var(--color-primary-dark)]"
            >
              Ver catálogo
            </Link>
            <Link
              href="/cart"
              className="inline-flex items-center justify-center rounded-full border border-slate-200 px-6 py-3 text-slate-900 transition hover:bg-slate-50"
            >
              Ir al carrito
            </Link>
          </div>
        </div>
        <div className="relative">
          <div className="absolute inset-0 translate-x-6 translate-y-6 rounded-3xl bg-gradient-to-br from-slate-100 to-slate-200" />
          <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-600 p-6 text-white shadow-2xl">
            <p className="text-sm uppercase tracking-[0.4em] text-white/60">
              EFETE
            </p>
            <h2 className="mt-6 text-3xl font-semibold">Calcos coleccionables</h2>
            <p className="mt-4 text-white/80">
              Material premium, apto exterior e interior. Cortes precisos y
              terminaciones brillantes.
            </p>
            <div className="mt-10 grid grid-cols-3 gap-4 text-sm">
              {["Vinilo premium", "Resistentes al agua", "Envíos 24hs"].map(
                (feature) => (
                  <div key={feature} className="rounded-2xl bg-white/10 p-3">
                    {feature}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </section>

      <section id="catalogo" className="space-y-6">
        <div className="flex flex-col gap-2">
          <p className="pill">Catálogo</p>
          <h2 className="text-3xl font-semibold">Elegí tu categoría</h2>
          <p className="text-slate-600">
            Navegá por las colecciones para ver todos los productos disponibles.
          </p>
        </div>

        {categories.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
            Aún no hay categorías cargadas en Supabase.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/c/${category.slug}`}
                className="card flex flex-col gap-4 rounded-3xl p-6 transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="h-2 w-16 rounded-full bg-[color:rgba(143,141,242,0.9)]" />
                <div className="space-y-2">
                  <p className="text-sm uppercase tracking-[0.3em] text-slate-400">
                    Colección
                  </p>
                  <h3 className="text-2xl font-semibold">{category.name}</h3>
                </div>
                <p className="text-sm text-slate-500">
                  Ver productos y agregar al carrito.
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
