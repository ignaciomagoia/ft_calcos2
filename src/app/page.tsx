import Image from "next/image";
import Link from "next/link";
import { getCategories } from "@/lib/data";
import PersonalizedSection from "@/components/PersonalizedSection";
import WholesalePersonalizedSection from "@/components/WholesalePersonalizedSection";
import HowToPersonalized from "@/components/HowToPersonalized";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const categories = await getCategories();

  return (
    <div className="space-y-0 -mx-4 sm:-mx-6 lg:-mx-8">
      <section className="relative -mt-6 isolate overflow-hidden rounded-none border-b border-slate-200 bg-white shadow-none sm:mt-0 sm:rounded-[32px] sm:border sm:shadow-2xl">
        <div className="grid min-h-0 grid-cols-2 lg:min-h-[560px] lg:grid-cols-2">
          <div className="relative flex flex-col justify-start gap-6 bg-[var(--color-primary)] px-6 py-6 text-white sm:px-10 sm:py-12 lg:justify-between lg:gap-10">
            <Sparkle className="pointer-events-none absolute bottom-16 right-8 hidden rotate-12 text-white/40 sm:block" />

            <div className="space-y-6">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-5 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/80">
                FT CALCOS
              </span>
              <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
                Pegá tu estilo.
              </h1>
              <p className="text-base text-white/90 sm:text-lg">
                Calcos premium, resistentes y con envíos en 24hs. Curá tu
                catálogo y coordiná todo por WhatsApp.
              </p>
            </div>

            <div className="flex flex-col gap-3 text-sm font-semibold sm:flex-row">
              <Link
                href="#catalogo"
                className="inline-flex items-center justify-center rounded-full bg-[var(--color-accent)] px-8 py-3 text-[var(--color-primary)] transition hover:-translate-y-0.5"
              >
                Ver catálogo
              </Link>
              <Link
                href="/cart"
                className="inline-flex items-center justify-center rounded-full border border-white/40 px-8 py-3 text-white transition hover:-translate-y-0.5 hover:bg-white/10"
              >
                Ir al carrito
              </Link>
            </div>
          </div>

          <div className="relative flex items-stretch justify-stretch bg-[var(--color-primary)] px-0 py-0 lg:px-4 lg:py-6">
            <div className="relative h-full w-full min-h-[320px] overflow-hidden rounded-none border-l border-white/20 bg-gradient-to-br from-[var(--color-secondary)]/15 via-white to-white shadow-none lg:min-h-0 lg:rounded-[32px] lg:border lg:border-white/60 lg:shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-tr from-[var(--color-secondary)]/30 to-transparent" />
              <Image
                src="/imagendetermo.webp"
                alt="Placeholder de producto FT Calcos, reemplazar con imagen real"
                fill
                sizes="(min-width: 1024px) 50vw, 50vw"
                priority
                className="object-cover"
              />
              <div className="pointer-events-none absolute bottom-6 left-6 rounded-full bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-700">
                Próxima colección
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="catalogo" className="space-y-6 px-4 pt-8 sm:px-6 lg:px-8">
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
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-5">
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

      <div className="space-y-0">
        <PersonalizedSection />
        <WholesalePersonalizedSection />
        <HowToPersonalized />
      </div>
    </div>
  );
}

const Sparkle = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 40 40"
    width="48"
    height="48"
    fill="currentColor"
  >
    <path d="M20 0c1.2 6.6 6.6 11.8 13.2 13C26.6 14.2 21.4 19.4 20 26c-1.4-6.6-6.6-11.8-13.2-13C13.4 11.8 18.6 6.6 20 0zm0 14c.8 4.1 4.1 7.4 8.2 8.1-4.1.7-7.4 4-8.2 8.1-.8-4.1-4.1-7.4-8.2-8.1 4.1-.7 7.4-4 8.2-8.1z" />
  </svg>
);
