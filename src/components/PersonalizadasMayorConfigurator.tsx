"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

const WA_NUMBER = "3516183951";

const sizeOptions = ["4 cm", "6 cm", "8 cm"] as const;

const bulkQuantityOptions = {
  con_laca: [50, 100, 200, 500],
  sin_laca: [50, 100, 200, 500, 1000],
} as const;

const bulkPrices = {
  con_laca: {
    "4 cm": {
      50: { total: 20000, unit: 400 },
      100: { total: 38000, unit: 380 },
      200: { total: 68000, unit: 340 },
      500: { total: 125000, unit: 250 },
    },
    "6 cm": {
      50: { total: 30000, unit: 600 },
      100: { total: 58000, unit: 580 },
      200: { total: 110000, unit: 550 },
      500: { total: 250000, unit: 500 },
    },
    "8 cm": {
      50: { total: 45000, unit: 900 },
      100: { total: 88000, unit: 880 },
      200: { total: 170000, unit: 850 },
      500: { total: 400000, unit: 800 },
    },
  },
  sin_laca: {
    "4 cm": {
      50: { total: 15000, unit: 300 },
      100: { total: 28000, unit: 280 },
      200: { total: 50000, unit: 250 },
      500: { total: 100000, unit: 200 },
      1000: { total: 150000, unit: 150 },
    },
    "6 cm": {
      50: { total: 25000, unit: 500 },
      100: { total: 48000, unit: 480 },
      200: { total: 90000, unit: 450 },
      500: { total: 200000, unit: 400 },
      1000: { total: 350000, unit: 350 },
    },
    "8 cm": {
      50: { total: 40000, unit: 800 },
      100: { total: 78000, unit: 780 },
      200: { total: 150000, unit: 750 },
      500: { total: 350000, unit: 700 },
      1000: { total: 650000, unit: 650 },
    },
  },
} as const;

const vinylOptions = [
  {
    value: "blanco_con_laca",
    label: "Blanco con laca UV sectorizada",
    priceGroup: "con_laca",
  },
  {
    value: "blanco_sin_laca",
    label: "Blanco común (sin laca UV)",
    priceGroup: "sin_laca",
  },
  {
    value: "transparente",
    label: "Transparente (sin laca UV)",
    priceGroup: "sin_laca",
  },
  {
    value: "holografico",
    label: "Holográfico (sin laca UV)",
    priceGroup: "sin_laca",
  },
  {
    value: "dorado",
    label: "Dorado (sin laca UV)",
    priceGroup: "sin_laca",
  },
] as const;

type SizeValue = (typeof sizeOptions)[number];
type PriceGroup = keyof typeof bulkPrices;
type VinylValue = (typeof vinylOptions)[number]["value"];

const formatArs = (value: number) => `$ ${value.toLocaleString("es-AR")}`;

const PersonalizedMayorConfigurator = () => {
  const [vinylType, setVinylType] = useState<VinylValue>("blanco_con_laca");
  const [size, setSize] = useState<SizeValue>("4 cm");
  const [quantityBulk, setQuantityBulk] = useState<number>(50);
  const [error, setError] = useState("");

  const selectedVinyl = useMemo(
    () => vinylOptions.find((option) => option.value === vinylType) ?? vinylOptions[0],
    [vinylType],
  );

  const priceGroup = selectedVinyl.priceGroup as PriceGroup;
  const bulkOptions = bulkQuantityOptions[priceGroup];

  useEffect(() => {
    if (!bulkOptions.includes(quantityBulk as never)) {
      setQuantityBulk(bulkOptions[0]);
    }
  }, [bulkOptions, quantityBulk]);

  const pricing = useMemo(() => {
    const selectedBulk =
      bulkPrices[priceGroup][size][quantityBulk as keyof (typeof bulkPrices)[PriceGroup][SizeValue]] ??
      bulkPrices[priceGroup][size][bulkOptions[0] as keyof (typeof bulkPrices)[PriceGroup][SizeValue]];

    return {
      unit: selectedBulk.unit,
      total: selectedBulk.total,
    };
  }, [bulkOptions, priceGroup, quantityBulk, size]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!bulkOptions.includes(quantityBulk as never)) {
      setError("Elegí una cantidad válida (desde 50 unidades).");
      return;
    }

    setError("");

    const message = [
      "Hola! Quiero cotizar personalizadas por mayor.",
      `Tipo de vinilo: ${selectedVinyl.label}`,
      `Tamaño: ${size}`,
      `Cantidad: ${quantityBulk}`,
      `Precio unitario: ${formatArs(pricing.unit)}`,
      `Precio total: ${formatArs(pricing.total)}`,
      "",
      "Falta que me envíes el diseño/foto del calco y si lo querés con fondo o sin fondo.",
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
          <div className="overflow-hidden rounded-none bg-white sm:rounded-2xl">
            <Image
              src="/personalizadamarca.jpeg"
              alt="Personalizadas por mayor"
              width={2226}
              height={1696}
              sizes="(max-width: 639px) 100vw, (max-width: 1023px) 100vw, 1100px"
              className="block h-auto w-full select-none object-contain object-center"
              priority
            />
          </div>

          <div className="mt-4 flex justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Volver al catálogo
            </Link>
          </div>
        </div>
      </section>

      <section className="w-full bg-white py-8">
        <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="card rounded-3xl p-6 sm:p-8">
            <div className="space-y-3">
              <p className="pill w-fit">Personalizadas por mayor</p>
              <h1 className="text-3xl font-semibold text-slate-900">
                Configurá tus personalizadas por mayor
              </h1>
              <p className="text-slate-600">
                Elegí tipo de vinilo, tamaño y cantidad. El precio se calcula automáticamente para
                compras desde 50 unidades.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-6">
              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold text-slate-800">Tipo de vinilo</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {vinylOptions.map((option) => (
                    <label
                      key={option.value}
                      className={`cursor-pointer rounded-2xl border px-4 py-3 text-center text-sm font-semibold transition ${
                        vinylType === option.value
                          ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                          : "border-slate-200 text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="vinylType"
                        value={option.value}
                        checked={vinylType === option.value}
                        onChange={() => setVinylType(option.value)}
                        className="sr-only"
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold text-slate-800">Tamaño</legend>
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
                <p className="text-sm font-semibold text-slate-800">Cantidad</p>
                <select
                  value={quantityBulk}
                  onChange={(event) => setQuantityBulk(Number(event.target.value))}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[var(--color-primary)] sm:max-w-xs"
                >
                  {bulkOptions.map((quantity) => (
                    <option key={quantity} value={quantity}>
                      {quantity}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-[var(--color-secondary)]/10 p-4">
                <p className="text-xs font-medium text-slate-500">
                  El precio se calcula automáticamente.
                </p>
                <div className="mt-2 flex flex-col gap-1 text-sm text-slate-700">
                  <p>
                    <span className="font-semibold text-slate-900">Precio unitario:</span>{" "}
                    {formatArs(pricing.unit)}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-900">Precio total:</span>{" "}
                    {formatArs(pricing.total)}
                  </p>
                </div>
              </div>

              {error ? <p className="text-sm text-rose-600">{error}</p> : null}

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-full bg-[var(--color-primary)] px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-[rgba(1,34,161,0.35)] transition hover:-translate-y-0.5 hover:bg-[var(--color-primary-dark)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
                >
                  Pedir por WhatsApp
                </button>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center rounded-full border border-slate-300 px-8 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Volver al catálogo
                </Link>
              </div>
            </form>
          </div>
        </div>
      </section>
    </>
  );
};

export default PersonalizedMayorConfigurator;
