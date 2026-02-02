import Link from "next/link";
import { getCategories } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const categories = await getCategories();

  return (
    <div className="space-y-12">
      <section className="card overflow-hidden px-6 py-12 text-center md:px-12">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-6">
          <p className="pill pill--accent w-fit">Edición limitada</p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Calcos premium listas para pegar donde quieras.
          </h1>
          <p className="text-lg text-slate-600">
            Diseños de alta definición, material resistente y envíos en 24hs.
            Armá tu carrito y coordinamos por WhatsApp.
          </p>
          <Link
            href="#catalogo"
            className="inline-flex items-center justify-center rounded-full bg-[var(--color-primary)] px-10 py-4 text-lg font-semibold text-white shadow-lg shadow-[rgba(1,34,161,0.35)] transition hover:-translate-y-0.5 hover:bg-[var(--color-primary-dark)]"
          >
            Ver catálogo
          </Link>
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

