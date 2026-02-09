import Link from "next/link";
import { getCategories } from "@/lib/data";
import PersonalizedSection from "@/components/PersonalizedSection";
import WholesalePersonalizedSection from "@/components/WholesalePersonalizedSection";
import HowToPersonalized from "@/components/HowToPersonalized";
import SizesSection from "@/components/SizesSection";
import PremiumQualitySection from "@/components/PremiumQualitySection";
import HeroCarousel from "@/components/HeroCarousel";

export const dynamic = "force-dynamic";

const getCategoryInitials = (name: string) =>
  name
    .split(" ")
    .map((chunk) => chunk[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

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
              Navegá por las colecciones para ver todos los productos
              disponibles.
            </p>
          </div>

          {categories.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
              Aún no hay categorías cargadas en Supabase.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/c/${category.slug}`}
                  className="group grid h-[250px] grid-rows-[1fr_auto] overflow-hidden rounded-[26px] border border-[rgba(143,141,242,0.45)] bg-[var(--color-secondary)] transition hover:-translate-y-1 hover:shadow-[0_16px_30px_rgba(79,74,172,0.3)] sm:h-[280px]"
                >
                  <div className="relative min-h-0 overflow-hidden px-3 pt-3">
                    {category.image_url ? (
                      <img
                        src={category.image_url}
                        alt={category.name}
                        className="h-full w-full object-contain object-center drop-shadow-[0_8px_18px_rgba(15,23,42,0.28)] transition duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center rounded-2xl border border-white/35 bg-white/15">
                        <span className="rounded-full bg-white/90 px-4 py-2 text-xl font-semibold tracking-wide text-[var(--color-primary)] shadow-sm">
                          {getCategoryInitials(category.name)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="px-3 pb-4 pt-2 text-center">
                    <h3 className="text-[1.05rem] font-semibold leading-tight tracking-tight text-white break-words sm:text-xl">
                      {category.name}
                    </h3>
                  </div>
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
