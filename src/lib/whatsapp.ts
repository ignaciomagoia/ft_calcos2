import type { CartItem } from "./cartStore";
import { formatCurrency } from "./utils";

const WHATSAPP_NUMBER = "5493516183951";

type WhatsAppPayload = {
  items: CartItem[];
  total: number;
  transferAlias: string;
};

export const buildWhatsAppCheckoutUrl = ({
  items,
  total,
  transferAlias,
}: WhatsAppPayload) => {
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
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
};
