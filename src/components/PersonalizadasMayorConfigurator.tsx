"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createOrderIntent } from "@/lib/orders";
import { openWhatsAppConversation } from "@/lib/whatsapp";
import {
  isValidCustomerEmail,
  isValidCustomerPhone,
  normalizeCustomerEmail,
  normalizeCustomerName,
  normalizeCustomerPhone,
} from "@/lib/utils";

const WA_NUMBER = "3516183951";

type PriceGroupId = "con_laca_uv" | "sin_laca_transp" | "holograficas_doradas";
type StickerTypeId =
  | "con_laca_uv_sectorizada"
  | "dtf_uv"
  | "sin_laca"
  | "transparentes"
  | "holograficas"
  | "doradas";
type StickerSizeId = "s4" | "s6" | "s8";
type StickerQuantity = 20 | 50 | 100 | 200 | 500 | 1000;
type StickerMinQuantity = 20 | 50;

const TYPE_OPTIONS: Array<{
  id: StickerTypeId;
  label: string;
  waLabel: string;
  priceGroup: PriceGroupId;
  minQuantity: StickerMinQuantity;
}> = [
  {
    id: "con_laca_uv_sectorizada",
    label: "Con laca UV sectorizada",
    waLabel: "Con laca UV sectorizada",
    priceGroup: "con_laca_uv",
    minQuantity: 50,
  },
  {
    id: "dtf_uv",
    label: "DTF UV",
    waLabel: "DTF UV",
    priceGroup: "con_laca_uv",
    minQuantity: 20,
  },
  {
    id: "sin_laca",
    label: "Sin laca",
    waLabel: "Sin laca",
    priceGroup: "sin_laca_transp",
    minQuantity: 50,
  },
  {
    id: "transparentes",
    label: "Transparentes",
    waLabel: "Transparentes",
    priceGroup: "sin_laca_transp",
    minQuantity: 50,
  },
  {
    id: "holograficas",
    label: "Holográficas",
    waLabel: "Holográficas",
    priceGroup: "holograficas_doradas",
    minQuantity: 50,
  },
  {
    id: "doradas",
    label: "Doradas",
    waLabel: "Doradas",
    priceGroup: "holograficas_doradas",
    minQuantity: 50,
  },
];

const SIZE_OPTIONS: Array<{ id: StickerSizeId; label: string; waLabel: string }> = [
  { id: "s4", label: "4 cm", waLabel: "4 cm" },
  { id: "s6", label: "6 cm", waLabel: "6 cm" },
  { id: "s8", label: "8 cm", waLabel: "8 cm" },
];

const QUANTITY_OPTIONS_BY_MINIMUM: Record<
  StickerMinQuantity,
  StickerQuantity[]
> = {
  20: [20, 50, 100, 200, 500, 1000],
  50: [50, 100, 200, 500, 1000],
};

const PRICE_TABLE: Record<
  PriceGroupId,
  Record<StickerSizeId, Record<StickerQuantity, number>>
> = {
  con_laca_uv: {
    s4: { 20: 11700, 50: 29250, 100: 55250, 200: 97500, 500: 227500, 1000: 422500 },
    s6: { 20: 16020, 50: 40050, 100: 75650, 200: 133500, 500: 311500, 1000: 578500 },
    s8: { 20: 23220, 50: 58050, 100: 109650, 200: 193500, 500: 451500, 1000: 838500 },
  },
  sin_laca_transp: {
    s4: { 20: 0, 50: 26500, 100: 50000, 200: 88500, 500: 206500, 1000: 383500 },
    s6: { 20: 0, 50: 33000, 100: 62000, 200: 109500, 500: 255500, 1000: 474500 },
    s8: { 20: 0, 50: 43500, 100: 82500, 200: 145500, 500: 339500, 1000: 630500 },
  },
  holograficas_doradas: {
    s4: { 20: 0, 50: 30500, 100: 58000, 200: 102000, 500: 238000, 1000: 442000 },
    s6: { 20: 0, 50: 38000, 100: 71500, 200: 126000, 500: 294000, 1000: 546000 },
    s8: { 20: 0, 50: 59000, 100: 111500, 200: 196500, 500: 458500, 1000: 851500 },
  },
};

const formatArs = (value: number) => `$${value.toLocaleString("es-AR")}`;

const PersonalizedMayorConfigurator = () => {
  const [stickerType, setStickerType] = useState<StickerTypeId>(
    "con_laca_uv_sectorizada"
  );
  const [stickerSize, setStickerSize] = useState<StickerSizeId>("s4");
  const [quantity, setQuantity] = useState<StickerQuantity>(50);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const selectedType = TYPE_OPTIONS.find((option) => option.id === stickerType)!;
  const selectedSize = SIZE_OPTIONS.find((option) => option.id === stickerSize)!;
  const quantityOptions =
    QUANTITY_OPTIONS_BY_MINIMUM[selectedType.minQuantity];

  useEffect(() => {
    if (!quantityOptions.includes(quantity)) {
      setQuantity(quantityOptions[0]);
    }
  }, [quantity, quantityOptions]);

  const total = useMemo(
    () => PRICE_TABLE[selectedType.priceGroup][stickerSize][quantity],
    [quantity, selectedType.priceGroup, stickerSize]
  );
  const unitPrice = useMemo(() => total / quantity, [quantity, total]);
  const hasCustomerName = normalizeCustomerName(customerName).length > 0;
  const hasCustomerPhone = isValidCustomerPhone(
    normalizeCustomerPhone(customerPhone)
  );
  const hasCustomerEmail = isValidCustomerEmail(
    normalizeCustomerEmail(customerEmail)
  );

  const handleOpenWhatsapp = async () => {
    const normalizedCustomerName = normalizeCustomerName(customerName);
    const normalizedCustomerPhone = normalizeCustomerPhone(customerPhone);
    const normalizedCustomerEmail = normalizeCustomerEmail(customerEmail);
    if (!normalizedCustomerName) {
      setSubmitError("Escribí tu nombre para continuar.");
      return;
    }
    if (!isValidCustomerPhone(normalizedCustomerPhone)) {
      setSubmitError("Escribí un teléfono válido para continuar.");
      return;
    }
    if (!isValidCustomerEmail(normalizedCustomerEmail)) {
      setSubmitError("Escribí un mail válido para continuar.");
      return;
    }

    setSubmitError("");
    setIsSubmitting(true);

    const message = [
      "Pedido - Personalizadas por mayor 🧾",
      "",
      `Nombre: ${normalizedCustomerName}`,
      `Tipo: ${selectedType.waLabel}`,
      `Tamaño: ${selectedSize.waLabel}`,
      `Cantidad: ${quantity}`,
      `Total: ${formatArs(total)}`,
      "Alias: ft.calcos",
      "",
      "Importante: falta que te envíe la foto/diseño del calco que quiero ✅",
    ].join("\n");

    try {
      await createOrderIntent({
        summary: `${normalizedCustomerName} - Mayor: ${selectedType.waLabel} | ${selectedSize.waLabel} | ${quantity}u`,
        total,
        whatsappMessage: message,
        source: "web",
        orderDetails: {
          flow: "personalizadas_por_mayor",
          customerName: normalizedCustomerName,
          customerPhone: normalizedCustomerPhone,
          customerEmail: normalizedCustomerEmail,
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
      setCustomerName(normalizedCustomerName);
      setCustomerPhone(normalizedCustomerPhone);
      setCustomerEmail(normalizedCustomerEmail);

      openWhatsAppConversation({ phone: WA_NUMBER, message });
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
                {selectedType.minQuantity === 20
                  ? "Cantidad mínima para DTF UV: 20 unidades."
                  : "Cantidad mínima: 50 unidades."}
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
              <div
                className={`grid grid-cols-2 gap-2 ${
                  quantityOptions.length > 5 ? "sm:grid-cols-3 lg:grid-cols-6" : "sm:grid-cols-5"
                }`}
              >
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

            <div className="mt-6 space-y-2 rounded-2xl border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-800">
                Datos de contacto
              </p>
              <input
                id="customer-name-mayor"
                type="text"
                value={customerName}
                onChange={(event) => {
                  setCustomerName(event.target.value);
                  if (submitError) setSubmitError("");
                }}
                placeholder="Nombre (ej: Juan Perez)"
                className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[var(--color-primary)]"
              />
              <input
                id="customer-phone-mayor"
                type="tel"
                value={customerPhone}
                onChange={(event) => {
                  setCustomerPhone(event.target.value);
                  if (submitError) setSubmitError("");
                }}
                placeholder="Telefono (ej: 351 1234567)"
                className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[var(--color-primary)]"
              />
              <input
                id="customer-email-mayor"
                type="email"
                value={customerEmail}
                onChange={(event) => {
                  setCustomerEmail(event.target.value);
                  if (submitError) setSubmitError("");
                }}
                placeholder="Mail (ej: cliente@mail.com)"
                className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[var(--color-primary)]"
              />
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleOpenWhatsapp}
                disabled={
                  isSubmitting ||
                  !hasCustomerName ||
                  !hasCustomerPhone ||
                  !hasCustomerEmail
                }
                className="inline-flex items-center justify-center rounded-full bg-[var(--color-primary)] px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-[rgba(1,34,161,0.35)] transition hover:-translate-y-0.5 hover:bg-[var(--color-primary-dark)] disabled:cursor-not-allowed disabled:opacity-60"
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



