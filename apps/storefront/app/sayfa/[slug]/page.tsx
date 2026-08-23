import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function ContentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const client = await createSupabaseServerClient();
  const { data } = await client.from("storefront_pages").select("title,content,page_type,updated_at")
    .eq("slug", slug).eq("status", "published").maybeSingle();
  if (!data) notFound();
  const paragraphs = String(data.content).split(/\n{2,}/);
  return <main className="container page"><div className="title"><h1>{data.title}</h1><p>Son güncelleme: {new Date(data.updated_at).toLocaleDateString("tr-TR")}</p></div><article className="storefront-content-page">{paragraphs.map((paragraph: string, index: number) => <p key={index}>{paragraph}</p>)}</article></main>;
}
