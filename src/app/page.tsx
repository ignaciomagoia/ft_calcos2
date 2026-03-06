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

const fakePersonalizedCategory = {
  id: "fake-personalizados",
  name: "Personalizados",
  slug: "personalizados",
  image_url: "/personalizadas.png",
  sort_order: Number.MAX_SAFE_INTEGER,
};

const fakePlanchasPersonalizadasCategory = {
  id: "fake-planchas-personalizadas",
  name: "Planchas personalizadas",
  slug: "planchas-personalizadas",
  image_url: "/planchapersonalizada.png",
  sort_order: Number.MAX_SAFE_INTEGER,
};

const fakePersonalizadasMayorCategory = {
  id: "fake-personalizadas-por-mayor",
  name: "Personalizadas por mayor",
  slug: "personalizadas-por-mayor",
  image_url: "/personalizadaspormayor2.png",
  sort_order: Number.MAX_SAFE_INTEGER,
};

const getCategoryHref = (id: string, slug: string) => {
  if (id === fakePersonalizedCategory.id) return "/personalizados";
  if (id === fakePlanchasPersonalizadasCategory.id) {
    return "/planchas-personalizadas";
  }
  if (id === fakePersonalizadasMayorCategory.id) {
    return "/personalizadas-por-mayor";
  }
  return `/c/${slug}`;
};

export default async function HomePage() {
  const categories = await getCategories();
  const categoriesWithFake = [
    ...categories,
    fakePersonalizedCategory,
    fakePlanchasPersonalizadasCategory,
    fakePersonalizadasMayorCategory,
  ];

  return (
    <div className="space-y-0">
      <HeroCarousel />

      <section id="categorias" className="scroll-mt-24 w-full bg-white py-8 sm:scroll-mt-28">
        <div className="mx-auto w-full max-w-6xl space-y-6 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-2">
            <p className="pill">CATEGORÍAS</p>
            <h2 className="text-3xl font-semibold">Elegí tu categoría</h2>
            <p className="text-slate-600">
              Elegí entre las opciones que prefieras, envíanos tu pedido por WhatsApp y nosotros nos encargamos de todo lo demás.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {categoriesWithFake.map((category) => (
              <Link
                key={category.id}
                href={getCategoryHref(category.id, category.slug)}
                className="group flex h-[250px] flex-col overflow-hidden rounded-[26px] border border-[rgba(143,141,242,0.45)] bg-[var(--color-secondary)] px-3 pb-4 pt-3 shadow-[0_8px_18px_rgba(79,74,172,0.18)] transition hover:-translate-y-1 hover:shadow-[0_16px_30px_rgba(79,74,172,0.3)] sm:h-[280px]"
              >
                <div className="relative flex min-h-0 flex-1 items-center justify-center">
                  {category.image_url ? (
                    <img
                      src={category.image_url}
                      alt={category.name}
                      className="h-full w-full object-contain object-center transition duration-300 group-hover:scale-[1.03]"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center rounded-[20px] border border-white/35 bg-white/15">
                      <span className="rounded-full bg-white/90 px-4 py-2 text-xl font-semibold tracking-wide text-[var(--color-primary)] shadow-sm">
                        {getCategoryInitials(category.name)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="mt-2 flex h-12 items-end justify-center px-2 pb-1 text-center">
                  <h3 className="text-[1.05rem] font-semibold leading-tight tracking-tight break-words text-white sm:text-xl">
                    {category.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
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
