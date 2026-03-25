const CLOUDINARY_HOST_RE = /(^|\.)res\.cloudinary\.com$/i;
const CLOUDINARY_UPLOAD_SEGMENT = "/image/upload/";

export type CloudinaryTransformOptions = {
  width?: number;
  height?: number;
  crop?: "fill" | "fit" | "limit" | "pad" | "scale";
  quality?: "auto" | "auto:good" | "auto:best" | "auto:eco";
};

const parsePositiveInt = (value: unknown): number | null => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.round(parsed);
};

const sanitizeTransformations = (
  options: CloudinaryTransformOptions = {}
): string[] => {
  const transforms: string[] = [
    "f_auto",
    options.quality ?? "q_auto:good",
  ];

  const width = parsePositiveInt(options.width);
  const height = parsePositiveInt(options.height);
  const crop = options.crop ?? "limit";

  if (width) transforms.push(`w_${width}`);
  if (height) transforms.push(`h_${height}`);
  if (width || height) transforms.push(`c_${crop}`);

  return transforms;
};

const isCloudinaryUploadUrl = (rawUrl: string) => {
  try {
    const parsed = new URL(rawUrl);
    return (
      CLOUDINARY_HOST_RE.test(parsed.hostname) &&
      parsed.pathname.includes(CLOUDINARY_UPLOAD_SEGMENT)
    );
  } catch {
    return false;
  }
};

export const buildOptimizedImageUrl = (
  rawUrl: string | null | undefined,
  options: CloudinaryTransformOptions = {}
) => {
  if (!rawUrl) return rawUrl ?? null;
  if (!isCloudinaryUploadUrl(rawUrl)) return rawUrl;

  const transformations = sanitizeTransformations(options).join(",");
  const marker = CLOUDINARY_UPLOAD_SEGMENT;
  const markerIndex = rawUrl.indexOf(marker);
  if (markerIndex < 0) return rawUrl;

  const prefix = rawUrl.slice(0, markerIndex + marker.length);
  const suffix = rawUrl.slice(markerIndex + marker.length);

  if (suffix.startsWith("f_auto,")) {
    return rawUrl;
  }

  return `${prefix}${transformations}/${suffix}`;
};

