import Link from "next/link";
import { getCategories } from "@/lib/data";
import PersonalizedSection from "@/components/PersonalizedSection";
import WholesalePersonalizedSection from "@/components/WholesalePersonalizedSection";
import HowToPersonalized from "@/components/HowToPersonalized";
import SizesSection from "@/components/SizesSection";
import PremiumQualitySection from "@/components/PremiumQualitySection";
import HeroCarousel from "@/components/HeroCarousel";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const categories = await getCategories();

  return (
    <div className="space-y-0">
      <HeroCarousel />

      <section id="catalogo" className="w-full bg-white py-8">
        <div className="mx-auto w-full max-w-6xl space-y-6 px-4 sm:px-6 lg:px-8">
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
        </div>
      </section>

      <div className="space-y-0">
        <PersonalizedSection />
        <WholesalePersonalizedSection />
        <SizesSection />
        <PremiumQualitySection />
        <HowToPersonalized />
      </div>
    </div>
  );
}

