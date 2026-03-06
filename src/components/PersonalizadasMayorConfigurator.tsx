"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { createOrderIntent } from "@/lib/orders";

const WA_NUMBER = "3516183951";

type PriceGroupId = "con_laca_uv" | "sin_laca_transp" | "holograficas_doradas";
type StickerTypeId =
  | "con_laca_uv_sectorizada"
  | "sin_laca"
  | "transparentes"
  | "holograficas"
  | "doradas";
type StickerSizeId = "s4" | "s6" | "s8";
type StickerQuantity = 50 | 100 | 200 | 500 | 1000;

const TYPE_OPTIONS: Array<{
  id: StickerTypeId;
  label: string;
  waLabel: string;
  priceGroup: PriceGroupId;
}> = [
  {
    id: "con_laca_uv_sectorizada",
    label: "Con laca UV sectorizada",
    waLabel: "Con laca UV sectorizada",
    priceGroup: "con_laca_uv",
  },
  {
    id: "sin_laca",
    label: "Sin laca",
    waLabel: "Sin laca",
    priceGroup: "sin_laca_transp",
  },
  {
    id: "transparentes",
    label: "Transparentes",
    waLabel: "Transparentes",
    priceGroup: "sin_laca_transp",
  },
  {
    id: "holograficas",
    label: "Holográficas",
    waLabel: "Holográficas",
    priceGroup: "holograficas_doradas",
  },
  {
    id: "doradas",
    label: "Doradas",
    waLabel: "Doradas",
    priceGroup: "holograficas_doradas",
  },
];

const SIZE_OPTIONS: Array<{ id: StickerSizeId; label: string; waLabel: string }> = [
  { id: "s4", label: "4 cm", waLabel: "4 cm" },
  { id: "s6", label: "6 cm", waLabel: "6 cm" },
  { id: "s8", label: "8 cm", waLabel: "8 cm" },
];

const QUANTITY_OPTIONS: StickerQuantity[] = [50, 100, 200, 500, 1000];

const PRICE_TABLE: Record<
  PriceGroupId,
  Record<StickerSizeId, Record<StickerQuantity, number>>
> = {
  con_laca_uv: {
    s4: { 50: 29250, 100: 55250, 200: 97500, 500: 227500, 1000: 422500 },
    s6: { 50: 40050, 100: 75650, 200: 133500, 500: 311500, 1000: 578500 },
    s8: { 50: 58050, 100: 109650, 200: 193500, 500: 451500, 1000: 838500 },
  },
  sin_laca_transp: {
    s4: { 50: 19000, 100: 35500, 200: 63000, 500: 147500, 1000: 270000 },
    s6: { 50: 29250, 100: 55000, 200: 98000, 500: 227500, 1000: 420000 },
    s8: { 50: 40000, 100: 75500, 200: 134000, 500: 318000, 1000: 580000 },
  },
  holograficas_doradas: {
    s4: { 50: 22500, 100: 42000, 200: 75000, 500: 170000, 1000: 310000 },
    s6: { 50: 36000, 100: 68000, 200: 122000, 500: 285000, 1000: 530000 },
    s8: { 50: 57500, 100: 108000, 200: 194000, 500: 450000, 1000: 830000 },
  },
};

const formatArs = (value: number) => `$${value.toLocaleString("es-AR")}`;

const PersonalizedMayorConfigurator = () => {
  const [stickerType, setStickerType] = useState<StickerTypeId>(
    "con_laca_uv_sectorizada"
  );
  const [stickerSize, setStickerSize] = useState<StickerSizeId>("s4");
  const [quantity, setQuantity] = useState<StickerQuantity>(50);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const selectedType = TYPE_OPTIONS.find((option) => option.id === stickerType)!;
  const selectedSize = SIZE_OPTIONS.find((option) => option.id === stickerSize)!;

  const total = useMemo(
    () => PRICE_TABLE[selectedType.priceGroup][stickerSize][quantity],
    [quantity, selectedType.priceGroup, stickerSize]
  );
  const unitPrice = useMemo(() => total / quantity, [quantity, total]);

  const handleOpenWhatsapp = async () => {
    setSubmitError("");
    setIsSubmitting(true);

    const message = [
      "Pedido - Personalizadas por mayor 🧾",
      "",
      `Tipo: ${selectedType.waLabel}`,
      `Tamaño: ${selectedSize.waLabel}`,
      `Cantidad: ${quantity}`,
      `Total: ${formatArs(total)}`,
      "Alias: efete.calcos",
      "",
      "Importante: falta que te envíe la foto/diseño del calco que quiero ✅",
    ].join("\n");

    const url = new URL("https://api.whatsapp.com/send");
    url.searchParams.set("phone", WA_NUMBER);
    url.searchParams.set("text", message);

    try {
      await createOrderIntent({
        summary: `Mayor: ${selectedType.waLabel} | ${selectedSize.waLabel} | ${quantity}u`,
        total,
        whatsappMessage: message,
        source: "web",
        orderDetails: {
          flow: "personalizadas_por_mayor",
          items: [
            {
              name: "Calco personalizado por mayor",
              type: selectedType.waLabel,
              size: selectedSize.waLabel,
              quantity,
              unitPrice: Math.round(unitPrice),
              lineTotal: total,
            },
          ],
        },
      });

      window.open(url.toString(), "_blank", "noopener,noreferrer");
    } catch (submitError: unknown) {
      setSubmitError(
        submitError instanceof Error
          ? submitError.message
          : "No se pudo guardar el pedido. Reintentá."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <section className="w-full bg-white py-4 sm:py-6">
        <div className="mx-auto w-full max-w-4xl px-0 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-none bg-[var(--color-secondary)] sm:rounded-2xl">
            <div className="px-4 pb-5 pt-8 sm:px-8 sm:pb-8 sm:pt-10">
              <p className="text-center whitespace-nowrap text-[0.95rem] font-extrabold leading-tight tracking-tight text-[var(--color-primary)] sm:text-[1.65rem]">
                PERSONALIZADAS PARA TU MARCA
              </p>

              <Image
                src="/personalizadaspormayor2.png"
                alt="Personalizadas para tu marca"
                width={540}
                height={540}
                sizes="(max-width: 639px) 90vw, (max-width: 1023px) 80vw, 540px"
                className="mx-auto mt-3 block h-auto w-full max-w-[285px] max-h-[420px] select-none object-contain object-center sm:mt-2 sm:max-w-[320px] sm:max-h-[470px]"
                priority
              />
            </div>
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
              <p className="pill w-fit">Personalizadas por mayor</p>
              <h1 className="text-3xl font-semibold text-slate-900">
                Personalizadas por mayor
              </h1>
              <p className="text-sm text-slate-600">
                Cantidad mínima: 50 unidades.
              </p>
            </div>

            <fieldset className="mt-6 space-y-3">
              <legend className="text-sm font-semibold text-slate-800">
                Tipo de calco
              </legend>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {TYPE_OPTIONS.map((option) => (
                  <label
                    key={option.id}
                    className={`cursor-pointer rounded-2xl border px-4 py-3 text-center text-sm font-semibold transition ${
                      stickerType === option.id
                        ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                        : "border-slate-200 text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      className="sr-only"
                      name="stickerType"
                      value={option.id}
                      checked={stickerType === option.id}
                      onChange={() => setStickerType(option.id)}
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="mt-6 space-y-3">
              <legend className="text-sm font-semibold text-slate-800">
                Tamaño
              </legend>
              <div className="grid gap-2 sm:grid-cols-3">
                {SIZE_OPTIONS.map((option) => (
                  <label
                    key={option.id}
                    className={`cursor-pointer rounded-2xl border px-4 py-3 text-center text-sm font-semibold transition ${
                      stickerSize === option.id
                        ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                        : "border-slate-200 text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      className="sr-only"
                      name="stickerSize"
                      value={option.id}
                      checked={stickerSize === option.id}
                      onChange={() => setStickerSize(option.id)}
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
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {QUANTITY_OPTIONS.map((option) => (
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
                disabled={isSubmitting}
                className="inline-flex items-center justify-center rounded-full bg-[var(--color-primary)] px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-[rgba(1,34,161,0.35)] transition hover:-translate-y-0.5 hover:bg-[var(--color-primary-dark)]"
              >
                {isSubmitting ? "Guardando pedido..." : "Consultar por WhatsApp"}
              </button>
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-full border border-slate-300 px-8 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Volver al inicio
              </Link>
            </div>
            {submitError ? (
              <p className="mt-3 text-sm text-rose-600">{submitError}</p>
            ) : null}
          </div>
        </div>
      </section>
    </>
  );
};

export default PersonalizedMayorConfigurator;



