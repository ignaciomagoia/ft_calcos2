"use client";

import Image from "next/image";
import Link from "next/link";
import { KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";

const WA_NUMBER = "3516183951";

type SheetTypeId = "con_laca" | "sin_laca" | "holo";
type SheetSizeId = "s45x15" | "s143x196" | "s195x274";
type SheetQuantity = 20 | 50 | 100 | 200;

const INFO_SLIDES = [
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

const TYPE_OPTIONS: Array<{ id: SheetTypeId; label: string }> = [
  { id: "con_laca", label: "Con laca" },
  { id: "sin_laca", label: "Sin laca" },
  { id: "holo", label: "Holográficas" },
];

const SIZE_OPTIONS: Array<{ id: SheetSizeId; label: string; waLabel: string }> = [
  { id: "s45x15", label: "4,5 x 15", waLabel: "4,5x15" },
  { id: "s143x196", label: "14,3 x 19,6", waLabel: "14,3x19,6" },
  { id: "s195x274", label: "19,5 x 27,4", waLabel: "19,5x27,4" },
];

const QUANTITY_OPTIONS_BY_SIZE: Record<SheetSizeId, SheetQuantity[]> = {
  s45x15: [20, 50, 100, 200],
  s143x196: [20, 50, 100, 200],
  s195x274: [20, 50, 100, 200],
};

const PRICE_TABLE: Record<
  SheetTypeId,
  Record<SheetSizeId, Record<SheetQuantity, number>>
> = {
  con_laca: {
    s45x15: { 20: 30000, 50: 79500, 100: 149000, 200: 278000 },
    s143x196: { 20: 62000, 50: 159000, 100: 309000, 200: 578000 },
    s195x274: { 20: 99000, 50: 249000, 100: 489000, 200: 918000 },
  },
  sin_laca: {
    s45x15: { 20: 26000, 50: 69000, 100: 129000, 200: 238000 },
    s143x196: { 20: 55000, 50: 139000, 100: 279000, 200: 518000 },
    s195x274: { 20: 87000, 50: 219000, 100: 429000, 200: 798000 },
  },
  holo: {
    s45x15: { 20: 39000, 50: 99000, 100: 189000, 200: 358000 },
    s143x196: { 20: 75000, 50: 189000, 100: 369000, 200: 698000 },
    s195x274: { 20: 119000, 50: 319000, 100: 599000, 200: 1118000 },
  },
};

const formatArs = (value: number) => `$${value.toLocaleString("es-AR")}`;

const PlanchasPersonalizadasConfigurator = () => {
  const [sheetType, setSheetType] = useState<SheetTypeId>("con_laca");
  const [sheetSize, setSheetSize] = useState<SheetSizeId>("s45x15");
  const [quantity, setQuantity] = useState<SheetQuantity>(20);
  const [activeSlide, setActiveSlide] = useState(0);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const slideRefs = useRef<Array<HTMLDivElement | null>>([]);

  const totalSlides = INFO_SLIDES.length;
  const quantityOptions = QUANTITY_OPTIONS_BY_SIZE[sheetSize];
  const selectedType = TYPE_OPTIONS.find((option) => option.id === sheetType)!;
  const selectedSize = SIZE_OPTIONS.find((option) => option.id === sheetSize)!;

  useEffect(() => {
    if (!quantityOptions.includes(quantity)) {
      setQuantity(quantityOptions[0]);
    }
  }, [quantity, quantityOptions]);

  const total = useMemo(
    () => PRICE_TABLE[sheetType][sheetSize][quantity],
    [quantity, sheetSize, sheetType]
  );
  const unitPrice = useMemo(() => total / quantity, [quantity, total]);

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
        Math.round(viewport.scrollLeft / viewport.clientWidth)
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

  const handleOpenWhatsapp = () => {
    const message = [
      "Pedido - Planchas personalizadas 🧾",
      "",
      `Tipo: ${selectedType.label}`,
      `Tamaño: ${selectedSize.waLabel}`,
      `Cantidad: ${quantity}`,
      `Total: ${formatArs(total)}`,
      "",
      "Importante: falta que te envíe la foto/diseño que quiero ✅",
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
              {INFO_SLIDES.map((slide, index) => (
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

          <div className="mt-3 flex items-center justify-center gap-2">
            {INFO_SLIDES.map((slide, index) => (
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
            <div className="space-y-2">
              <p className="pill w-fit">Planchas personalizadas</p>
              <h1 className="text-3xl font-semibold text-slate-900">
                Planchas personalizadas
              </h1>
            </div>

            <fieldset className="mt-6 space-y-3">
              <legend className="text-sm font-semibold text-slate-800">
                Tipo de plancha
              </legend>
              <div className="grid gap-2 sm:grid-cols-3">
                {TYPE_OPTIONS.map((option) => (
                  <label
                    key={option.id}
                    className={`cursor-pointer rounded-2xl border px-4 py-3 text-center text-sm font-semibold transition ${
                      sheetType === option.id
                        ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                        : "border-slate-200 text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      className="sr-only"
                      name="sheetType"
                      value={option.id}
                      checked={sheetType === option.id}
                      onChange={() => setSheetType(option.id)}
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="mt-6 space-y-3">
              <legend className="text-sm font-semibold text-slate-800">
                Tamaño de plancha
              </legend>
              <div className="grid gap-2 sm:grid-cols-3">
                {SIZE_OPTIONS.map((option) => (
                  <label
                    key={option.id}
                    className={`cursor-pointer rounded-2xl border px-4 py-3 text-center text-sm font-semibold transition ${
                      sheetSize === option.id
                        ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                        : "border-slate-200 text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      className="sr-only"
                      name="sheetSize"
                      value={option.id}
                      checked={sheetSize === option.id}
                      onChange={() => setSheetSize(option.id)}
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="mt-6 space-y-3">
              <legend className="text-sm font-semibold text-slate-800">
                Cantidad
              </legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {quantityOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setQuantity(option)}
                    className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                      quantity === option
                        ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                        : "border-slate-200 text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-[var(--color-secondary)]/10 p-4">
              <p className="text-xs font-medium text-slate-500">
                Precio según configuración elegida.
              </p>
              <div className="mt-2 flex flex-col gap-1 text-sm text-slate-700">
                <p>
                  <span className="font-semibold text-slate-900">Total:</span>{" "}
                  {formatArs(total)}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Precio c/u:</span>{" "}
                  {formatArs(Math.round(unitPrice))}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleOpenWhatsapp}
                className="inline-flex items-center justify-center rounded-full bg-[var(--color-primary)] px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-[rgba(1,34,161,0.35)] transition hover:-translate-y-0.5 hover:bg-[var(--color-primary-dark)]"
              >
                Consultar por WhatsApp
              </button>
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-full border border-slate-300 px-8 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Volver al inicio
              </Link>
            </div>
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

