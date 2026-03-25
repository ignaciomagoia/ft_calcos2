import { NextRequest, NextResponse } from "next/server";
import { getCatalogProductsPage } from "@/lib/data";

export const dynamic = "force-dynamic";

const readPositiveInt = (value: string | null, fallback: number) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
};

export async function GET(request: NextRequest) {
  const categoryId = request.nextUrl.searchParams.get("categoryId")?.trim() ?? "";
  const subcategoryId =
    request.nextUrl.searchParams.get("subcategoryId")?.trim() || null;

  if (!categoryId) {
    return NextResponse.json(
      { error: "Falta categoryId." },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  const page = readPositiveInt(request.nextUrl.searchParams.get("page"), 1);
  const pageSize = readPositiveInt(
    request.nextUrl.searchParams.get("pageSize"),
    24
  );

  const payload = await getCatalogProductsPage({
    categoryId,
    subcategoryId,
    page,
    pageSize,
  });

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

