"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";

const WA_NUMBER = "3516183951";
const infoSlides = [
  {
    src: "/infoplanchapersonalizada3.png",
    alt: "Informacion de planchas personalizadas 1",
  },
  {
    src: "/infoplanchapersonalizada2.png",
    alt: "Informacion de planchas personalizadas 2",
  },
  {
    src: "/infoplanchapersonalizada.png",
    alt: "Informacion de planchas personalizadas 3",
  },
] as const;

const sizeOptions = [
  "15x4,5 - 4 calcos",
  "14,3x19,6 - 8 calcos",
  "19,5 x 27,4 - 12 calcos",
] as const;

type SizeValue = (typeof sizeOptions)[number];

const PlanchasPersonalizadasConfigurator = () => {
  const [size, setSize] = useState<SizeValue | "">("");
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState("");
  const [activeSlide, setActiveSlide] = useState(0);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const slideRefs = useRef<Array<HTMLDivElement | null>>([]);
  const totalSlides = infoSlides.length;

  const clampSlideIndex = (index: number) =>
    (index + totalSlides) % totalSlides;

  const goToSlide = (index: number) => {
    const nextIndex = clampSlideIndex(index);
    slideRefs.current[nextIndex]?.scrollIntoView({
      behavior: "smooth",
      inline: "start",
      block: "nearest",
    });
    setActiveSlide(nextIndex);
  };

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const onScroll = () => {
      if (!viewport.clientWidth) return;
      const nextIndex = clampSlideIndex(
        Math.round(viewport.scrollLeft / viewport.clientWidth),
      );
      setActiveSlide(nextIndex);
    };

    viewport.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => viewport.removeEventListener("scroll", onScroll);
  }, [totalSlides]);

  const onCarouselKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goToSlide(activeSlide - 1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      goToSlide(activeSlide + 1);
    }
  };

  const updateQuantity = (nextValue: number) => {
    if (Number.isNaN(nextValue)) return;
    setQuantity(Math.min(999, Math.max(1, Math.floor(nextValue))));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!size || quantity < 1) {
      setError("Elegí tamaño y cantidad mínima 1.");
      return;
    }

    setError("");

    const message = [
      "Hola! Quiero Planchas personalizadas",
      `Tamaño: ${size}`,
      `Cantidad de planchas: ${quantity}`,
      "",
      "Me falta enviarte el diseño/foto para imprimir. Gracias!",
    ].join("\n");

    const url = new URL("https://api.whatsapp.com/send");
    url.searchParams.set("phone", WA_NUMBER);
    url.searchParams.set("text", message);
    window.open(url.toString(), "_blank", "noopener,noreferrer");
  };

  return (
    <>
      <section className="w-full bg-white py-4 sm:py-6">
        <div className="mx-auto w-full max-w-4xl px-0 sm:px-6 lg:px-8">
          <div className="relative">
            <div
              ref={viewportRef}
              className="no-scrollbar flex h-[290px] w-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden rounded-none touch-pan-x bg-white scroll-smooth sm:h-[340px] sm:rounded-2xl lg:h-[540px] xl:h-[600px]"
              tabIndex={0}
              onKeyDown={onCarouselKeyDown}
              role="region"
              aria-roledescription="carousel"
              aria-label="Informacion de planchas personalizadas"
            >
              {infoSlides.map((slide, index) => (
                <div
                  key={slide.src}
                  ref={(element) => {
                    slideRefs.current[index] = element;
                  }}
                  className="relative h-full w-full shrink-0 snap-start"
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${index + 1} de ${totalSlides}`}
                >
                  <Image
                    src={slide.src}
                    alt={slide.alt}
                    width={2226}
                    height={1696}
                    sizes="(max-width: 639px) 100vw, (max-width: 1023px) 100vw, 1100px"
                    priority={index === 0}
                    className="block h-full w-full select-none object-contain object-center"
                  />
                </div>
              ))}
            </div>

            <div className="pointer-events-none absolute inset-y-0 left-0 right-0 hidden items-center justify-between px-2 lg:flex">
              <button
                type="button"
                onClick={() => goToSlide(activeSlide - 1)}
                className="pointer-events-auto inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
                aria-label="Slide anterior"
              >
                <ArrowIcon direction="left" />
              </button>
              <button
                type="button"
                onClick={() => goToSlide(activeSlide + 1)}
                className="pointer-events-auto inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
                aria-label="Slide siguiente"
              >
                <ArrowIcon direction="right" />
              </button>
            </div>
          </div>

          <div className="mt-3 hidden items-center justify-center gap-2 sm:flex">
            {infoSlides.map((slide, index) => (
              <button
                key={slide.src}
                type="button"
                onClick={() => goToSlide(index)}
                aria-label={`Ir a la imagen ${index + 1}`}
                aria-current={activeSlide === index}
                className={`h-2.5 w-2.5 rounded-full transition ${
                  activeSlide === index
                    ? "bg-[var(--color-primary)]"
                    : "bg-slate-300"
                }`}
              />
            ))}
          </div>

          <div className="mt-4 flex justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </section>

      <section className="w-full bg-white py-8">
        <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="card rounded-3xl p-6 sm:p-8">
            <div className="space-y-3">
              <p className="pill w-fit">Planchas personalizadas</p>
              <h1 className="text-3xl font-semibold text-slate-900">
                Planchas personalizadas
              </h1>
              <p className="text-slate-600">
                Te recordamos que tenemos una demora de 7 a 10 días hábiles, si
                están antes te avisamos (:
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-6">
              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold text-slate-800">
                  Elegí el tamaño de tu plancha
                </legend>
                <div className="grid gap-2 sm:grid-cols-3">
                  {sizeOptions.map((option) => (
                    <label
                      key={option}
                      className={`cursor-pointer rounded-2xl border px-4 py-3 text-center text-sm font-semibold transition ${
                        size === option
                          ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                          : "border-slate-200 text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="size"
                        value={option}
                        checked={size === option}
                        onChange={() => setSize(option)}
                        className="sr-only"
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="space-y-3">
                <label
                  htmlFor="quantity"
                  className="text-sm font-semibold text-slate-800"
                >
                  Cantidad de planchas
                </label>
                <div className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-2">
                  <button
                    type="button"
                    onClick={() => updateQuantity(quantity - 1)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-lg font-semibold text-slate-700 transition hover:bg-slate-50"
                    aria-label="Disminuir cantidad"
                  >
                    -
                  </button>
                  <input
                    id="quantity"
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(event) =>
                      updateQuantity(Number(event.target.value))
                    }
                    className="w-16 border-0 bg-transparent text-center text-base font-semibold text-slate-900 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => updateQuantity(quantity + 1)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-lg font-semibold text-slate-700 transition hover:bg-slate-50"
                    aria-label="Aumentar cantidad"
                  >
                    +
                  </button>
                </div>
              </div>

              {error ? <p className="text-sm text-rose-600">{error}</p> : null}

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-full bg-[var(--color-primary)] px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-[rgba(1,34,161,0.35)] transition hover:-translate-y-0.5 hover:bg-[var(--color-primary-dark)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
                >
                  Pedir por WhatsApp 💬📦
                </button>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center rounded-full border border-slate-300 px-8 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Volver al inicio
                </Link>
              </div>
            </form>
          </div>
        </div>
      </section>
    </>
  );
};

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

export default PlanchasPersonalizadasConfigurator;
