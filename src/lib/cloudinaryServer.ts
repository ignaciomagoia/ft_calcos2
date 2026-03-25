import "server-only";

import { createHash } from "node:crypto";

const CLOUDINARY_UPLOAD_ENDPOINT = "https://api.cloudinary.com/v1_1";

type CloudinaryConfig = {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
};

type CloudinaryUploadInput = {
  file: File;
  folder: string;
};

type CloudinaryUploadResult = {
  secureUrl: string;
  publicId: string;
  width: number | null;
  height: number | null;
  bytes: number | null;
  format: string | null;
};

const sanitizeFolder = (folder: string) =>
  folder
    .trim()
    .replace(/[^a-zA-Z0-9/_-]/g, "")
    .replace(/\/{2,}/g, "/")
    .replace(/^\/+|\/+$/g, "");

const readCloudinaryConfig = (): CloudinaryConfig => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Faltan CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY o CLOUDINARY_API_SECRET."
    );
  }

  return { cloudName, apiKey, apiSecret };
};

const buildCloudinarySignature = (
  params: Record<string, string | number>,
  apiSecret: string
) => {
  const base = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  return createHash("sha1")
    .update(`${base}${apiSecret}`)
    .digest("hex");
};

const parseCloudinaryUploadResponse = (
  payload: unknown
): CloudinaryUploadResult => {
  if (!payload || typeof payload !== "object") {
    throw new Error("Cloudinary devolvio una respuesta invalida.");
  }

  const raw = payload as {
    secure_url?: unknown;
    public_id?: unknown;
    width?: unknown;
    height?: unknown;
    bytes?: unknown;
    format?: unknown;
    error?: { message?: unknown } | unknown;
  };

  if (
    raw.error &&
    typeof raw.error === "object" &&
    typeof (raw.error as { message?: unknown }).message === "string"
  ) {
    throw new Error((raw.error as { message: string }).message);
  }

  if (
    typeof raw.secure_url !== "string" ||
    raw.secure_url.trim().length === 0 ||
    typeof raw.public_id !== "string" ||
    raw.public_id.trim().length === 0
  ) {
    throw new Error("Cloudinary no devolvio secure_url/public_id.");
  }

  const asNumberOrNull = (value: unknown) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  return {
    secureUrl: raw.secure_url.trim(),
    publicId: raw.public_id.trim(),
    width: asNumberOrNull(raw.width),
    height: asNumberOrNull(raw.height),
    bytes: asNumberOrNull(raw.bytes),
    format: typeof raw.format === "string" ? raw.format : null,
  };
};

export const uploadImageToCloudinary = async ({
  file,
  folder,
}: CloudinaryUploadInput): Promise<CloudinaryUploadResult> => {
  const config = readCloudinaryConfig();
  const cleanFolder = sanitizeFolder(folder);

  if (!cleanFolder) {
    throw new Error("Carpeta de Cloudinary invalida.");
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const signatureParams = {
    folder: cleanFolder,
    timestamp,
  };
  const signature = buildCloudinarySignature(signatureParams, config.apiSecret);

  const formData = new FormData();
  formData.set("file", file);
  formData.set("folder", cleanFolder);
  formData.set("timestamp", String(timestamp));
  formData.set("api_key", config.apiKey);
  formData.set("signature", signature);

  const endpoint = `${CLOUDINARY_UPLOAD_ENDPOINT}/${config.cloudName}/image/upload`;
  const response = await fetch(endpoint, {
    method: "POST",
    body: formData,
    cache: "no-store",
  });

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message =
      payload &&
      typeof payload === "object" &&
      typeof (payload as { error?: { message?: unknown } }).error?.message ===
        "string"
        ? String((payload as { error: { message: string } }).error.message)
        : `Cloudinary devolvio HTTP ${response.status}.`;
    throw new Error(message);
  }

  return parseCloudinaryUploadResponse(payload);
};

