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

const individualPrices = {
  con_laca: {
    "4 cm": 500,
    "6 cm": 700,
    "8 cm": 1000,
  },
  sin_laca: {
    "4 cm": 350,
    "6 cm": 550,
    "8 cm": 850,
  },
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

type SizeValue = (typeof sizeOptions)[number];
type CalcoType = keyof typeof individualPrices;
type Modality = "individual" | "mayor";
type SpecialFinish = "ninguna" | "transparente" | "dorada" | "holografica";

const specialFinishOptions: Array<{ label: string; value: SpecialFinish }> = [
  { label: "Ninguna", value: "ninguna" },
  { label: "Transparente", value: "transparente" },
  { label: "Dorada", value: "dorada" },
  { label: "Holográfica", value: "holografica" },
];

const specialFinishClarifications: Record<Exclude<SpecialFinish, "ninguna">, string> = {
  transparente: "Transparente = sin laca UV.",
  dorada: "Dorada = con laca UV sectorizada.",
  holografica: "Holográfica = con laca UV sectorizada.",
};

const formatArs = (value: number) => `$ ${value.toLocaleString("es-AR")}`;

const PersonalizedMayorConfigurator = () => {
  const [calcoType, setCalcoType] = useState<CalcoType>("con_laca");
  const [modality, setModality] = useState<Modality>("individual");
  const [size, setSize] = useState<SizeValue>("4 cm");
  const [quantityIndividual, setQuantityIndividual] = useState(1);
  const [quantityBulk, setQuantityBulk] = useState<number>(50);
  const [specialFinish, setSpecialFinish] = useState<SpecialFinish>("ninguna");
  const [error, setError] = useState("");

  const bulkOptions = bulkQuantityOptions[calcoType];

  useEffect(() => {
    if (modality === "mayor" && !bulkOptions.includes(quantityBulk as never)) {
      setQuantityBulk(bulkOptions[0]);
    }
  }, [bulkOptions, modality, quantityBulk]);

  const selectedQuantity = modality === "individual" ? quantityIndividual : quantityBulk;

  const pricing = useMemo(() => {
    if (modality === "individual") {
      const unit = individualPrices[calcoType][size];
      return { unit, total: unit * quantityIndividual };
    }

    const selectedBulk =
      bulkPrices[calcoType][size][quantityBulk as keyof (typeof bulkPrices)[CalcoType][SizeValue]] ??
      bulkPrices[calcoType][size][bulkOptions[0] as keyof (typeof bulkPrices)[CalcoType][SizeValue]];

    return {
      unit: selectedBulk.unit,
      total: selectedBulk.total,
    };
  }, [bulkOptions, calcoType, modality, quantityBulk, quantityIndividual, size]);

  const updateIndividualQuantity = (nextValue: number) => {
    if (Number.isNaN(nextValue)) return;
    setQuantityIndividual(Math.min(9999, Math.max(1, Math.floor(nextValue))));
  };

  const onCalcoTypeChange = (nextType: CalcoType) => {
    setCalcoType(nextType);

    if (nextType === "sin_laca" && (specialFinish === "dorada" || specialFinish === "holografica")) {
      setSpecialFinish("ninguna");
    }
    if (nextType === "con_laca" && specialFinish === "transparente") {
      setSpecialFinish("ninguna");
    }
  };

  const onSpecialFinishChange = (finish: SpecialFinish) => {
    setSpecialFinish(finish);

    if (finish === "transparente") setCalcoType("sin_laca");
    if (finish === "dorada" || finish === "holografica") setCalcoType("con_laca");
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (modality === "individual" && quantityIndividual < 1) {
      setError("La cantidad mínima es 1.");
      return;
    }

    if (modality === "mayor" && !bulkOptions.includes(quantityBulk as never)) {
      setError("Elegí una cantidad válida para la modalidad mayorista.");
      return;
    }

    setError("");

    const calcoTypeLabel =
      calcoType === "con_laca" ? "Con laca UV sectorizada" : "Sin laca UV";
    const modalityLabel =
      modality === "individual" ? "Individual (por menor)" : "Por mayor (mayorista)";
    const specialLabel =
      specialFinish === "ninguna"
        ? ""
        : ` (${specialFinishOptions.find((option) => option.value === specialFinish)?.label})`;
    const specialClarification =
      specialFinish === "ninguna"
        ? ""
        : specialFinishClarifications[specialFinish as Exclude<SpecialFinish, "ninguna">];

    const message = [
      "Hola! Quiero cotizar personalizadas por mayor.",
      `Tipo: ${calcoTypeLabel}${specialLabel}`,
      specialClarification ? `Aclaración: ${specialClarification}` : "",
      `Modalidad: ${modalityLabel}`,
      `Tamaño: ${size}`,
      `Cantidad: ${selectedQuantity}`,
      `Precio unitario: ${formatArs(pricing.unit)}`,
      `Precio total: ${formatArs(pricing.total)}`,
      "",
      "Falta que me envíes el diseño/foto del calco y si lo querés con fondo o sin fondo.",
    ]
      .filter(Boolean)
      .join("\n");

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
              Elegí opciones, modalidad y cantidad. El precio se calcula automáticamente.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            <fieldset className="space-y-3">
              <legend className="text-sm font-semibold text-slate-800">Tipo de calco</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                <label
                  className={`cursor-pointer rounded-2xl border px-4 py-3 text-center text-sm font-semibold transition ${
                    calcoType === "con_laca"
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                      : "border-slate-200 text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="calcoType"
                    value="con_laca"
                    checked={calcoType === "con_laca"}
                    onChange={() => onCalcoTypeChange("con_laca")}
                    className="sr-only"
                  />
                  Con laca UV sectorizada
                </label>
                <label
                  className={`cursor-pointer rounded-2xl border px-4 py-3 text-center text-sm font-semibold transition ${
                    calcoType === "sin_laca"
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                      : "border-slate-200 text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="calcoType"
                    value="sin_laca"
                    checked={calcoType === "sin_laca"}
                    onChange={() => onCalcoTypeChange("sin_laca")}
                    className="sr-only"
                  />
                  Sin laca UV
                </label>
              </div>
              <p className="text-xs text-slate-500">
                Nota: transparentes = sin laca. Doradas y holográficas = con laca.
              </p>
            </fieldset>

            <fieldset className="space-y-3">
              <legend className="text-sm font-semibold text-slate-800">Aclaración de material (opcional)</legend>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {specialFinishOptions.map((option) => (
                  <label
                    key={option.value}
                    className={`cursor-pointer rounded-2xl border px-4 py-3 text-center text-sm font-semibold transition ${
                      specialFinish === option.value
                        ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                        : "border-slate-200 text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="specialFinish"
                      value={option.value}
                      checked={specialFinish === option.value}
                      onChange={() => onSpecialFinishChange(option.value)}
                      className="sr-only"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="space-y-3">
              <legend className="text-sm font-semibold text-slate-800">Modalidad</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                <label
                  className={`cursor-pointer rounded-2xl border px-4 py-3 text-center text-sm font-semibold transition ${
                    modality === "individual"
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                      : "border-slate-200 text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="modality"
                    value="individual"
                    checked={modality === "individual"}
                    onChange={() => setModality("individual")}
                    className="sr-only"
                  />
                  Individual (por menor)
                </label>
                <label
                  className={`cursor-pointer rounded-2xl border px-4 py-3 text-center text-sm font-semibold transition ${
                    modality === "mayor"
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                      : "border-slate-200 text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="modality"
                    value="mayor"
                    checked={modality === "mayor"}
                    onChange={() => setModality("mayor")}
                    className="sr-only"
                  />
                  Por mayor (mayorista)
                </label>
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
              {modality === "individual" ? (
                <div className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-2">
                  <button
                    type="button"
                    onClick={() => updateIndividualQuantity(quantityIndividual - 1)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-lg font-semibold text-slate-700 transition hover:bg-slate-50"
                    aria-label="Disminuir cantidad"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={quantityIndividual}
                    onChange={(event) => updateIndividualQuantity(Number(event.target.value))}
                    className="w-20 border-0 bg-transparent text-center text-base font-semibold text-slate-900 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => updateIndividualQuantity(quantityIndividual + 1)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-lg font-semibold text-slate-700 transition hover:bg-slate-50"
                    aria-label="Aumentar cantidad"
                  >
                    +
                  </button>
                </div>
              ) : (
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
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-[var(--color-secondary)]/10 p-4">
              <p className="text-xs font-medium text-slate-500">El precio se calcula automáticamente.</p>
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
                Pedir por WhatsApp 📲✨
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
