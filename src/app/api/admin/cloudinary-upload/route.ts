import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { uploadImageToCloudinary } from "@/lib/cloudinaryServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_UPLOAD_BYTES = 6 * 1024 * 1024;
const DEFAULT_FOLDER = "ft-calcos/products";
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const asString = (value: FormDataEntryValue | null) =>
  typeof value === "string" ? value.trim() : "";

const sanitizeFolder = (value: string) =>
  value
    .trim()
    .replace(/[^a-zA-Z0-9/_-]/g, "")
    .replace(/\/{2,}/g, "/")
    .replace(/^\/+|\/+$/g, "");

const assertAdminSession = async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false as const, status: 401, message: "No autenticado." };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return {
      ok: false as const,
      status: 500,
      message: "No se pudo validar el rol de admin.",
    };
  }

  if (profile?.role !== "admin") {
    return {
      ok: false as const,
      status: 403,
      message: "No autorizado.",
    };
  }

  return { ok: true as const };
};

export async function POST(request: Request) {
  const auth = await assertAdminSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  const formData = await request.formData();
  const fileEntry = formData.get("file");

  if (!(fileEntry instanceof File)) {
    return NextResponse.json(
      { error: "Falta el archivo de imagen." },
      { status: 400 }
    );
  }

  if (!ALLOWED_MIME_TYPES.has(fileEntry.type)) {
    return NextResponse.json(
      { error: "Formato no permitido. Usa JPG, PNG o WebP." },
      { status: 400 }
    );
  }

  if (fileEntry.size <= 0 || fileEntry.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: "La imagen supera el tamaño máximo permitido (6 MB)." },
      { status: 400 }
    );
  }

  const requestedFolder = sanitizeFolder(asString(formData.get("folder")));
  const folder = requestedFolder || DEFAULT_FOLDER;

  try {
    const uploaded = await uploadImageToCloudinary({
      file: fileEntry,
      folder,
    });

    return NextResponse.json(
      {
        url: uploaded.secureUrl,
        secureUrl: uploaded.secureUrl,
        publicId: uploaded.publicId,
        width: uploaded.width,
        height: uploaded.height,
        bytes: uploaded.bytes,
        format: uploaded.format,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "No se pudo subir la imagen.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

