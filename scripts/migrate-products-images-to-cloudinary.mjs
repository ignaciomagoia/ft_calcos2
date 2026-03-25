import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const ROOT_DIR = process.cwd();
const DEFAULT_BATCH_SIZE = 200;
const DEFAULT_FOLDER = "ft-calcos/products/migrated";

const MIME_EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const normalizeBoolFlag = (name) => {
  const raw = process.argv.includes(name);
  return Boolean(raw);
};

const DRY_RUN = normalizeBoolFlag("--dry-run");
const MIGRATE_ALL_REMOTE = normalizeBoolFlag("--all-remote");

const parseEnvFile = (filePath) => {
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^['"]|['"]$/g, "");

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
};

const readRequiredEnv = (name) => {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`Falta variable de entorno: ${name}`);
  }
  return value.trim();
};

const asPositiveInt = (value, fallback) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
};

const sanitizeFolder = (folder) =>
  folder
    .trim()
    .replace(/[^a-zA-Z0-9/_-]/g, "")
    .replace(/\/{2,}/g, "/")
    .replace(/^\/+|\/+$/g, "");

const isCloudinaryUrl = (rawUrl) => {
  try {
    const parsed = new URL(rawUrl);
    return /(^|\.)res\.cloudinary\.com$/i.test(parsed.hostname);
  } catch {
    return false;
  }
};

const isSupabaseStorageUrl = (rawUrl) => {
  if (!rawUrl) return false;
  return (
    rawUrl.includes("/storage/v1/object/public/") ||
    rawUrl.includes("/storage/v1/object/sign/") ||
    rawUrl.includes(".supabase.co/storage/v1/object/")
  );
};

const getExtensionFromUrl = (rawUrl) => {
  try {
    const parsed = new URL(rawUrl);
    const fileName = parsed.pathname.split("/").pop() ?? "";
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (ext && ext.length <= 5) return ext;
  } catch {
    return null;
  }

  return null;
};

const buildCloudinarySignature = (params, apiSecret) => {
  const base = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return createHash("sha1")
    .update(`${base}${apiSecret}`)
    .digest("hex");
};

const uploadToCloudinary = async ({
  cloudName,
  apiKey,
  apiSecret,
  buffer,
  mimeType,
  fileName,
  folder,
}) => {
  const timestamp = Math.floor(Date.now() / 1000);
  const signatureParams = { folder, timestamp };
  const signature = buildCloudinarySignature(signatureParams, apiSecret);

  const formData = new FormData();
  formData.set(
    "file",
    new Blob([buffer], { type: mimeType || "application/octet-stream" }),
    fileName
  );
  formData.set("folder", folder);
  formData.set("timestamp", String(timestamp));
  formData.set("api_key", apiKey);
  formData.set("signature", signature);

  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  const response = await fetch(endpoint, {
    method: "POST",
    body: formData,
    cache: "no-store",
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message =
      payload &&
      typeof payload === "object" &&
      typeof payload?.error?.message === "string"
        ? payload.error.message
        : `Cloudinary devolvio HTTP ${response.status}`;
    throw new Error(message);
  }

  if (!payload || typeof payload.secure_url !== "string") {
    throw new Error("Cloudinary no devolvio secure_url.");
  }

  return payload.secure_url;
};

const shouldMigrateImage = (imageUrl) => {
  if (!imageUrl || typeof imageUrl !== "string") return false;
  const clean = imageUrl.trim();
  if (!clean) return false;
  if (isCloudinaryUrl(clean)) return false;
  if (isSupabaseStorageUrl(clean)) return true;
  return MIGRATE_ALL_REMOTE && /^https?:\/\//i.test(clean);
};

const fetchProductsBatch = async (supabase, from, to) => {
  const { data, error } = await supabase
    .from("products")
    .select("id, name, image_url")
    .order("created_at", { ascending: true, nullsFirst: true })
    .order("id", { ascending: true })
    .range(from, to);

  if (error) {
    throw new Error(`Error listando productos: ${error.message}`);
  }

  return Array.isArray(data) ? data : [];
};

const main = async () => {
  parseEnvFile(path.join(ROOT_DIR, ".env.local"));
  parseEnvFile(path.join(ROOT_DIR, ".env"));

  const supabaseUrl = readRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = readRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  const cloudName = readRequiredEnv("CLOUDINARY_CLOUD_NAME");
  const apiKey = readRequiredEnv("CLOUDINARY_API_KEY");
  const apiSecret = readRequiredEnv("CLOUDINARY_API_SECRET");

  const batchSize = asPositiveInt(
    process.env.CLOUDINARY_MIGRATION_BATCH_SIZE,
    DEFAULT_BATCH_SIZE
  );
  const folder = sanitizeFolder(
    process.env.CLOUDINARY_MIGRATION_FOLDER || DEFAULT_FOLDER
  );

  if (!folder) {
    throw new Error("CLOUDINARY_MIGRATION_FOLDER es invalida.");
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let from = 0;
  let processed = 0;
  let migrated = 0;
  let skipped = 0;
  let failed = 0;
  const failures = [];

  console.log(
    `[migrate] Inicio. batchSize=${batchSize} folder=${folder} dryRun=${DRY_RUN}`
  );

  while (true) {
    const to = from + batchSize - 1;
    const batch = await fetchProductsBatch(supabase, from, to);
    if (batch.length === 0) break;

    for (const product of batch) {
      processed += 1;
      const imageUrl =
        typeof product.image_url === "string" ? product.image_url.trim() : "";

      if (!shouldMigrateImage(imageUrl)) {
        skipped += 1;
        continue;
      }

      const productId = String(product.id);
      const label = `${productId} :: ${product.name ?? "Producto"}`;

      try {
        const response = await fetch(imageUrl, { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Descarga fallo con HTTP ${response.status}`);
        }

        const mimeType = response.headers.get("content-type")?.split(";")[0] ?? "";
        const arrayBuffer = await response.arrayBuffer();
        if (!arrayBuffer || arrayBuffer.byteLength === 0) {
          throw new Error("Imagen descargada vacia.");
        }

        const extension =
          MIME_EXTENSIONS[mimeType] ||
          getExtensionFromUrl(imageUrl) ||
          "jpg";
        const fileName = `${productId}.${extension}`;

        const cloudinaryUrl = await uploadToCloudinary({
          cloudName,
          apiKey,
          apiSecret,
          buffer: Buffer.from(arrayBuffer),
          mimeType,
          fileName,
          folder,
        });

        if (DRY_RUN) {
          console.log(`[migrate] DRY ${label} -> ${cloudinaryUrl}`);
          migrated += 1;
          continue;
        }

        const { error: updateError } = await supabase
          .from("products")
          .update({ image_url: cloudinaryUrl })
          .eq("id", productId);

        if (updateError) {
          throw new Error(`Update fallo: ${updateError.message}`);
        }

        migrated += 1;
        console.log(`[migrate] OK ${label}`);
      } catch (error) {
        failed += 1;
        const message = error instanceof Error ? error.message : "Error desconocido";
        failures.push({ id: productId, message });
        console.error(`[migrate] ERROR ${label}: ${message}`);
      }
    }

    if (batch.length < batchSize) break;
    from += batchSize;
  }

  console.log("");
  console.log("[migrate] Resumen:");
  console.log(`- Procesados: ${processed}`);
  console.log(`- Migrados: ${migrated}`);
  console.log(`- Omitidos: ${skipped}`);
  console.log(`- Fallidos: ${failed}`);

  if (failures.length > 0) {
    console.log("");
    console.log("[migrate] Fallos:");
    for (const failure of failures) {
      console.log(`- ${failure.id}: ${failure.message}`);
    }
  }
};

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[migrate] Fatal: ${message}`);
  process.exit(1);
});

