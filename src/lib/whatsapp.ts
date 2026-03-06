import type { CartItem } from "./cartStore";
import { compareNamesWithTrailingNumber, formatCurrency } from "./utils";

const WHATSAPP_NUMBER = "5493516183951";
const ICON_HEART_HANDS = String.fromCodePoint(0x1faf6);

type WhatsAppPayload = {
  items: CartItem[];
  total: number;
  subtotal?: number;
  discountAmount?: number;
  discountPercent?: number;
  couponCode?: string | null;
  transferAlias: string;
};

export const buildWhatsAppCheckoutMessage = ({
  items,
  total,
  subtotal: _subtotal,
  discountAmount: _discountAmount = 0,
  discountPercent: _discountPercent = 0,
  couponCode: _couponCode,
  transferAlias: _transferAlias,
}: WhatsAppPayload) => {
  const alias = "efete.calcos";
  const orderedItems = [...items].sort((a, b) => {
    const byName = compareNamesWithTrailingNumber(a.name, b.name);
    if (byName !== 0) return byName;

    const aSize =
      typeof a.sizeCm === "number" ? a.sizeCm : Number.MAX_SAFE_INTEGER;
    const bSize =
      typeof b.sizeCm === "number" ? b.sizeCm : Number.MAX_SAFE_INTEGER;
    if (aSize !== bSize) return aSize - bSize;

    return a.id.localeCompare(b.id, "es", { sensitivity: "base" });
  });

  const itemLines = orderedItems.map((item) => {
    const hasSize = typeof item.sizeCm === "number";
    const parts = [item.name];

    if (hasSize) {
      parts.push(`tam: ${item.sizeCm} cm`);
      if (item.quantity > 1) {
        parts.push(`cant: ${item.quantity}`);
      }
    }

    return parts.join(" | ");
  });

  const lines = [
    "Hola! Quiero confirmar mi pedido:",
    ...itemLines,
    "",
    `Total: ${formatCurrency(total)}`,
    `Alias: ${alias}`,
    "",
    `Mandanos tu comprobante para poner en marcha tu pedido${ICON_HEART_HANDS}`,
  ];

  return lines.join("\n");
};

export const buildWhatsAppCheckoutPayload = (payload: WhatsAppPayload) => {
  const message = buildWhatsAppCheckoutMessage(payload);

  const url = new URL("https://api.whatsapp.com/send");
  url.searchParams.set("phone", WHATSAPP_NUMBER);
  url.searchParams.set("text", message);

  return {
    url: url.toString(),
    message,
  };
};

export const buildWhatsAppCheckoutUrl = (payload: WhatsAppPayload) => {
  return buildWhatsAppCheckoutPayload(payload).url;
};
