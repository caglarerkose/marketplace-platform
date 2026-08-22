import { NextResponse } from "next/server";
import { getActiveProducts } from "@/lib/catalog-products";

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const products = await getActiveProducts();
  const product = products.find((item) => item.id === slug);
  if (!product) return NextResponse.json({ error: "Ürün bulunamadı." }, { status: 404 });
  return NextResponse.json({ product, related: products.filter((item) => item.id !== slug).slice(0, 6) });
}
