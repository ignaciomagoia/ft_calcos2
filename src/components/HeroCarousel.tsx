"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";

type Slide = {
  id: string;
  layout: "split" | "center";
  badge: string;
  title: string;
  subtitle: string;
  description?: string;
  image: string;
  imageAlt: string;
  showCtas?: boolean;
};

const slides: Slide[] = [
  {
    id: "slide-1",
    layout: "split",
    badge: "FT CALCOS",
    title: "Pegá tu estilo",
    subtitle: "Calcos de vinilo premium súper resistentes para que decores tus cosas, potencies tu marca y lleves tus recuerdos con vos 🤩",
    image: "/termoprincipal.png",
    imageAlt: "Producto destacado FT Calcos",
    showCtas: true,
  },
  {
    id: "slide-2",
    layout: "center",
    badge: "PERSONALIZADOS",
    title: "Diseños que se pegan a vos",
    subtitle: "Mandanos tu idea y armamos tus calcos a medida.",
    description: "Ideal para regalos, packaging y objetos personales.",
    image: "/principal2.png",
    imageAlt: "Calcos personalizados FT",
    showCtas: false,
  },
];

const HeroCarousel = () => {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const slideRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const totalSlides = slides.length;

  const clampIndex = (index: number) =>
    (index + totalSlides) % totalSlides;

  const scrollTo = (index: number) => {
    const nextIndex = clampIndex(index);
    slideRefs.current[nextIndex]?.scrollIntoView({
      behavior: "smooth",
      inline: "start",
      block: "nearest",
    });
    setActiveIndex(nextIndex);
  };

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const onScroll = () => {
      const { scrollLeft, clientWidth } = viewport;
      if (!clientWidth) return;
      const nextIndex = clampIndex(Math.round(scrollLeft / clientWidth));
      setActiveIndex(nextIndex);
    };

    viewport.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => viewport.removeEventListener("scroll", onScroll);
  }, [totalSlides]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      scrollTo(activeIndex + 1);
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      scrollTo(activeIndex - 1);
    }
  };

  return (
    <section className="relative isolate -mt-16 overflow-hidden rounded-none border-b border-slate-200 bg-white pt-16 shadow-none sm:-mt-20 sm:rounded-[32px] sm:border sm:pt-20 sm:shadow-2xl">
      <div
        ref={viewportRef}
        className="no-scrollbar flex h-[520px] items-stretch snap-x snap-mandatory overflow-x-auto overflow-y-hidden bg-[var(--color-secondary)] scroll-smooth sm:h-[560px] lg:h-[600px]"
        tabIndex={0}
        onKeyDown={onKeyDown}
        role="region"
        aria-roledescription="carousel"
        aria-label="Hero principal"
      >
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            ref={(el) => {
              slideRefs.current[index] = el;
            }}
            className="h-full w-full shrink-0 snap-start"
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} de ${totalSlides}`}
          >
            {slide.layout === "split" ? (
              <div className="grid h-full grid-cols-2 bg-[var(--color-secondary)]">
                <div className="relative flex h-full flex-col justify-start gap-6 px-6 py-6 text-white sm:px-10 sm:py-12 lg:justify-between lg:gap-10">
                  <Sparkle className="pointer-events-none absolute bottom-16 right-8 hidden rotate-12 text-white/40 sm:block" />

                  <div className="space-y-4">
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-5 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/80">
                      {slide.badge}
                    </span>
                    {index === 0 ? (
                      <h1 className="text-4xl font-semibold leading-tight tracking-[0.01em] sm:text-6xl">
                        {slide.title}
                      </h1>
                    ) : (
                      <h2 className="text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
                        {slide.title}
                      </h2>
                    )}
                    <p className="text-base text-white/90 sm:text-lg">
                      {slide.subtitle}
                    </p>
                  </div>

                  {slide.showCtas && (
                    <div className="mt-auto flex flex-col gap-3 text-sm font-semibold sm:flex-row">
                    <Link
                      href="/#categorias"
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-full border border-[var(--color-primary)] bg-[var(--color-primary)] px-8 py-3 text-white transition hover:-translate-y-0.5 hover:bg-[var(--color-primary-dark)]"
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
                  )}
                </div>

                <div className="relative flex h-full items-stretch justify-center px-5 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
                  <div className="relative h-full w-full">
                    <Image
                      src="/termoprincipal.png"
                      alt={slide.imageAlt}
                      fill
                      sizes="(max-width: 1023px) 80vw, 45vw"
                      className="rounded-[26px] object-cover object-[82%_center] drop-shadow-[0_20px_50px_rgba(0,0,0,0.28)] animate-hero-in lg:hidden"
                      priority={index === 0}
                    />
                    <Image
                      src="/personalizadas.png"
                      alt={slide.imageAlt}
                      fill
                      sizes="(min-width: 1024px) 45vw, 60vw"
                      className="hidden rounded-[26px] object-cover object-[82%_center] drop-shadow-[0_20px_50px_rgba(0,0,0,0.28)] animate-hero-in lg:block"
                      priority={index === 0}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div
                className={`flex h-full flex-col items-center justify-start bg-[var(--color-secondary)] px-6 py-8 text-white sm:px-10 sm:py-10 ${
                  slide.id === "slide-2" ? "gap-2 sm:gap-5" : "gap-5"
                }`}
              >
                <div className="space-y-4 text-center">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-5 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/80">
                    {slide.badge}
                  </span>
                  {index === 0 ? (
                    <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
                      {slide.title}
                    </h1>
                  ) : (
                    <h2 className="text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
                      {slide.title}
                    </h2>
                  )}
                  <p className="text-base text-white/90 sm:text-lg">
                    {slide.id === "slide-2" ? (
                      <>
                        Mandanos tu idea y armamos{" "}
                        <br className="sm:hidden" />
                        tus calcos a medida.
                      </>
                    ) : (
                      slide.subtitle
                    )}
                  </p>
                  {slide.description && (
                    <p
                      className={`text-sm text-white/75 sm:text-base ${
                        slide.id === "slide-2" ? "hidden sm:block" : ""
                      }`}
                    >
                      {slide.id === "slide-2" ? (
                        <>
                          Ideal para regalos, packaging{" "}
                          <br className="sm:hidden" />y objetos personales.
                        </>
                      ) : (
                        slide.description
                      )}
                    </p>
                  )}
                </div>

                <div
                  className={`w-full ${
                    slide.id === "slide-2"
                      ? "max-w-5xl flex-1 min-h-[320px] sm:flex-none"
                      : "max-w-4xl"
                  }`}
                >
                  <div
                    className={`relative w-full ${
                      slide.id === "slide-2"
                        ? "h-full w-[152%] -ml-[26%] sm:ml-0 sm:w-full sm:-mt-4 sm:h-[320px] lg:-mt-24 lg:h-[490px]"
                        : "-mt-2 h-[260px] sm:-mt-4 sm:h-[320px] lg:h-[380px]"
                    }`}
                  >
                    {slide.id === "slide-2" ? (
                      <>
                        <Image
                          src={slide.image}
                          alt={slide.imageAlt}
                          fill
                          sizes="100vw"
                          className="rounded-[26px] object-contain object-bottom drop-shadow-[0_20px_50px_rgba(0,0,0,0.28)] animate-hero-in sm:hidden"
                          style={{
                            transform: "translateY(24px) scale(1.58)",
                            transformOrigin: "bottom center",
                          }}
                        />
                        <Image
                          src={slide.image}
                          alt={slide.imageAlt}
                          fill
                          sizes="(min-width: 640px) 90vw, (min-width: 1024px) 60vw"
                          className="hidden rounded-[26px] object-contain object-bottom drop-shadow-[0_20px_50px_rgba(0,0,0,0.28)] animate-hero-in sm:block lg:scale-[1.04] lg:-translate-y-10"
                        />
                      </>
                    ) : (
                      <Image
                        src={slide.image}
                        alt={slide.imageAlt}
                        fill
                        sizes="(min-width: 1024px) 60vw, 90vw"
                        className="rounded-[26px] object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.28)] animate-hero-in"
                      />
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="pointer-events-none absolute inset-y-0 left-0 right-0 hidden items-center justify-between px-4 lg:flex">
        <button
          type="button"
          onClick={() => scrollTo(activeIndex - 1)}
          className="pointer-events-auto inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/40 bg-white/80 text-slate-700 shadow-sm backdrop-blur transition hover:bg-white"
          aria-label="Slide anterior"
        >
          <ArrowIcon direction="left" />
        </button>
        <button
          type="button"
          onClick={() => scrollTo(activeIndex + 1)}
          className="pointer-events-auto inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/40 bg-white/80 text-slate-700 shadow-sm backdrop-blur transition hover:bg-white"
          aria-label="Slide siguiente"
        >
          <ArrowIcon direction="right" />
        </button>
      </div>

      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2 lg:bottom-6">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => scrollTo(index)}
            aria-label={`Ir al slide ${index + 1}`}
            aria-current={activeIndex === index}
            className={`h-2.5 w-2.5 rounded-full transition ${
              activeIndex === index ? "bg-white" : "bg-white/40"
            }`}
          />
        ))}
      </div>
    </section>
  );
};

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

const ArrowIcon = ({ direction }: { direction: "left" | "right" }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {direction === "left" ? (
      <polyline points="15 18 9 12 15 6" />
    ) : (
      <polyline points="9 18 15 12 9 6" />
    )}
  </svg>
);

export default HeroCarousel;
