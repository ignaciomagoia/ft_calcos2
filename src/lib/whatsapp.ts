import type { CartItem } from "./cartStore";
import { compareNamesWithTrailingNumber, formatCurrency } from "./utils";

const WHATSAPP_NUMBER = "5493516183951";
const ICON_HEART_HANDS = String.fromCodePoint(0x1faf6);
const MOBILE_UA_REGEX =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

type WhatsAppPayload = {
  items: CartItem[];
  customerName: string;
  total: number;
  subtotal?: number;
  discountAmount?: number;
  discountPercent?: number;
  couponCode?: string | null;
  transferAlias: string;
};

type OpenWhatsAppOptions = {
  phone: string;
  message: string;
};

const buildWhatsAppWebUrl = (phone: string, message: string) => {
  const url = new URL("https://api.whatsapp.com/send");
  url.searchParams.set("phone", phone);
  url.searchParams.set("text", message);
  return url.toString();
};

const buildWhatsAppDeepLink = (phone: string, message: string) => {
  const url = new URL("whatsapp://send");
  url.searchParams.set("phone", phone);
  url.searchParams.set("text", message);
  return url.toString();
};

const isMobileDevice = () => {
  if (typeof navigator === "undefined") return false;
  return MOBILE_UA_REGEX.test(navigator.userAgent);
};

export const openWhatsAppConversation = ({ phone, message }: OpenWhatsAppOptions) => {
  if (typeof window === "undefined") return;

  if (isMobileDevice()) {
    // On mobile, opening the app link directly avoids the intermediate WhatsApp web page.
    window.location.assign(buildWhatsAppDeepLink(phone, message));
    return;
  }

  const webUrl = buildWhatsAppWebUrl(phone, message);
  window.open(webUrl, "_blank", "noopener,noreferrer");
};

export const openCheckoutWhatsAppConversation = (message: string) => {
  openWhatsAppConversation({ phone: WHATSAPP_NUMBER, message });
};

export const buildWhatsAppCheckoutMessage = ({
  items,
  customerName,
  total,
  subtotal,
  discountAmount = 0,
  discountPercent = 0,
  couponCode,
  transferAlias,
}: WhatsAppPayload) => {
  const alias = transferAlias.trim() || "TRANSFER_ALIAS";
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
    }

    if (item.quantity > 1) {
      parts.push(`cant: ${item.quantity}`);
    }

    return parts.join(" | ");
  });

  const hasCoupon =
    typeof couponCode === "string" &&
    couponCode.trim().length > 0 &&
    discountAmount > 0;
  const normalizedCouponCode = hasCoupon ? couponCode.trim() : null;
  const summaryLines = hasCoupon
    ? [
        typeof subtotal === "number" ? `Subtotal: ${formatCurrency(subtotal)}` : null,
        `Cupon usado: ${normalizedCouponCode}`,
        discountPercent > 0
          ? `Descuento (${discountPercent}%): -${formatCurrency(discountAmount)}`
          : `Descuento: -${formatCurrency(discountAmount)}`,
        `Total final: ${formatCurrency(total)}`,
      ].filter((line): line is string => Boolean(line))
    : [`Total: ${formatCurrency(total)}`];

  const lines = [
    "Hola! Quiero confirmar mi pedido:",
    `Nombre: ${customerName}`,
    ...itemLines,
    "",
    ...summaryLines,
    `Alias: ${alias}`,
    "",
    `Mandanos tu comprobante para poner en marcha tu pedido${ICON_HEART_HANDS}`,
  ];

  return lines.join("\n");
};

export const buildWhatsAppCheckoutPayload = (payload: WhatsAppPayload) => {
  const message = buildWhatsAppCheckoutMessage(payload);

  return {
    url: buildWhatsAppWebUrl(WHATSAPP_NUMBER, message),
    message,
  };
};

export const buildWhatsAppCheckoutUrl = (payload: WhatsAppPayload) => {
  return buildWhatsAppCheckoutPayload(payload).url;
};
