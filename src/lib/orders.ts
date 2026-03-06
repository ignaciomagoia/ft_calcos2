import { createSupabaseBrowserClient } from "./supabaseClient";

export type Order = {
  id: string;
  created_at: string;
  summary: string;
  total: number;
  whatsapp_message: string;
  order_details: unknown;
  source: string | null;
};

export type OrderIntentInput = {
  summary: string;
  total: number;
  whatsappMessage: string;
  orderDetails: unknown;
  source?: "web";
};

const parseOrderRow = (value: unknown): Order | null => {
  if (!value || typeof value !== "object") return null;

  const raw = value as {
    id?: unknown;
    created_at?: unknown;
    summary?: unknown;
    total?: unknown;
    whatsapp_message?: unknown;
    order_details?: unknown;
    source?: unknown;
  };

  const id = typeof raw.id === "string" ? raw.id : "";
  const createdAt = typeof raw.created_at === "string" ? raw.created_at : "";
  const summary = typeof raw.summary === "string" ? raw.summary : "";
  const total = typeof raw.total === "number" ? raw.total : Number(raw.total);
  const whatsappMessage =
    typeof raw.whatsapp_message === "string" ? raw.whatsapp_message : "";

  if (!id || !createdAt || !summary || !Number.isFinite(total) || !whatsappMessage) {
    return null;
  }

  return {
    id,
    created_at: createdAt,
    summary,
    total,
    whatsapp_message: whatsappMessage,
    order_details: raw.order_details ?? null,
    source: typeof raw.source === "string" ? raw.source : null,
  };
};

const normalizeOrderIntentInput = (input: OrderIntentInput) => {
  const summary = input.summary.trim();
  const whatsappMessage = input.whatsappMessage.trim();
  const source = input.source ?? "web";
  const total = Math.max(0, Math.round(Number(input.total)));

  if (!summary) {
    throw new Error("Resumen de pedido invalido.");
  }

  if (!whatsappMessage) {
    throw new Error("Mensaje de WhatsApp invalido.");
  }

  if (!Number.isFinite(total)) {
    throw new Error("Total de pedido invalido.");
  }

  return {
    summary,
    total,
    whatsapp_message: whatsappMessage,
    order_details: input.orderDetails ?? null,
    source,
  };
};

export const createOrderIntent = async (input: OrderIntentInput): Promise<Order> => {
  const supabase = createSupabaseBrowserClient();
  const payload = normalizeOrderIntentInput(input);

  const { data, error } = await supabase
    .from("orders")
    .insert(payload)
    .select(
      "id, created_at, summary, total, whatsapp_message, order_details, source"
    )
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const order = parseOrderRow(data);
  if (!order) {
    throw new Error("No se pudo guardar el pedido.");
  }

  return order;
};

export const listOrders = async (): Promise<Order[]> => {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, created_at, summary, total, whatsapp_message, order_details, source"
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? [])
    .map(parseOrderRow)
    .filter((order): order is Order => order !== null);
};

export const deleteOrder = async (id: string) => {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.from("orders").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
};
