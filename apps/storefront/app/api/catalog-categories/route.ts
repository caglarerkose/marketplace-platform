import { NextResponse } from "next/server";
import { getActiveCategories } from "@/lib/catalog-categories";
export async function GET(){return NextResponse.json({categories:await getActiveCategories()})}
