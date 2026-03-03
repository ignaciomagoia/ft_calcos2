import type { CartItem } from "./cartStore";
import { formatCurrency } from "./utils";

const WHATSAPP_NUMBER = "5493516183951";

type WhatsAppPayload = {
  items: CartItem[];
  total: number;
  subtotal?: number;
  discountAmount?: number;
  discountPercent?: number;
  couponCode?: string | null;
  transferAlias: string;
};

export const buildWhatsAppCheckoutUrl = ({
  items,
  total,
  subtotal,
  discountAmount = 0,
  discountPercent = 0,
  couponCode,
  transferAlias,
}: WhatsAppPayload) => {
  const alias = transferAlias || "TRANSFER_ALIAS";
  const hasDiscount = discountAmount > 0 && discountPercent > 0;

  const lines = [
    "Hola! Quiero confirmar mi pedido:",
    ...items.map(
      (item) => {
        const unitPrice = item.unitPrice ?? item.price ?? 0;
        const itemTotal = unitPrice * item.quantity;
        const sizePart = item.sizeCm ? ` | Tamaño: ${item.sizeCm} cm` : "";

        return `${item.name}${sizePart} | Cantidad: ${
          item.quantity
        } | Precio unitario: ${formatCurrency(unitPrice)} | Importe: ${formatCurrency(
          itemTotal
        )}`;
      }
    ),
    ...(hasDiscount
      ? [
          `Descuento (${discountPercent}%${
            couponCode ? ` - Cupón ${couponCode}` : ""
          }): -${formatCurrency(discountAmount)}`,
          `Total final: ${formatCurrency(total)}`,
        ]
      : [`Total final: ${formatCurrency(total)}`]),
    "Pago por transferencia, coordinamos por WhatsApp.",
    `Alias: ${alias}`,
    "CBU: 0000003100080790340964",
  ];

  const message = encodeURIComponent(lines.join("\n"));
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
};
