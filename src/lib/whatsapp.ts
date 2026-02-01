import type { CartItem } from "./cartStore";
import { formatCurrency } from "./utils";

type WhatsAppPayload = {
  items: CartItem[];
  total: number;
  transferAlias: string;
  whatsappNumber: string;
};

export const buildWhatsAppCheckoutUrl = ({
  items,
  total,
  transferAlias,
  whatsappNumber,
}: WhatsAppPayload) => {
  const number =
    whatsappNumber.replace(/[^0-9]/g, "") || "WHATSAPP_NUMBER".toUpperCase();
  const alias = transferAlias || "TRANSFER_ALIAS";

  const lines = [
    "Hola! Quiero confirmar mi pedido:",
    ...items.map(
      (item) =>
        `${item.quantity} x ${item.name} - ${formatCurrency(
          item.price * item.quantity
        )}`
    ),
    `Total: ${formatCurrency(total)}`,
    "Pago por transferencia, coordinamos por WhatsApp.",
    `Alias: ${alias}`,
    "CBU: 0000003100080790340964",
  ];

  const message = encodeURIComponent(lines.join("\n"));
  return `https://wa.me/${number}?text=${message}`;
};
