"use client";
import { FormEvent, useCallback, useEffect, useState } from "react";

type Question = { id: string; question: string; answer: string | null; created_at: string; stores: { name: string } | null };
type Review = { id: string; rating: number; title: string | null; body: string | null; created_at: string };

export function ProductFeedback({ productId, offerId }: { productId?: string; offerId?: string }) {
  const [questions, setQuestions] = useState<Question[]>([]), [reviews, setReviews] = useState<Review[]>([]);
  const [message, setMessage] = useState(""), [sending, setSending] = useState(false);
  const load = useCallback(async () => {
    if (!productId) return;
    const response = await fetch(`/api/customer/product-feedback?productId=${encodeURIComponent(productId)}`);
    const result = await response.json();
    if (response.ok) { setQuestions(result.questions || []); setReviews(result.reviews || []); }
  }, [productId]);
  useEffect(() => { void load(); }, [load]);
  async function ask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!offerId) return; setSending(true); setMessage("");
    const form = event.currentTarget, question = String(new FormData(form).get("question") || "");
    const response = await fetch("/api/customer/product-feedback", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "question", offerId, question }) });
    const result = await response.json(); setSending(false);
    if (!response.ok) { setMessage(result.error || "Soru gönderilemedi."); return; }
    form.reset(); setMessage("Sorunuz incelenmek üzere mağazaya gönderildi.");
  }
  const average = reviews.length ? reviews.reduce((sum, item) => sum + item.rating, 0) / reviews.length : 0;
  return <section className="product-feedback">
    <div className="product-feedback-column"><header><h2>Ürün Soruları </h2><span>{questions.length} yanıt</span></header>
      {offerId && <form onSubmit={ask}><textarea name="question" required minLength={5} maxLength={1000} placeholder="Bu ürün hakkında mağazaya soru sorun" /><button disabled={sending}><i className="fa-solid fa-paper-plane" /> {sending ? "Gönderiliyor" : "Soruyu Gönder"}</button></form>}
      {message && <p className="feedback-message">{message}</p>}
      <div className="feedback-list">{questions.length ? questions.map(item => <article key={item.id}><b>{item.question}</b>{item.answer && <p><i className="fa-solid fa-store" /> {item.answer}</p>}<small>{item.stores?.name || "Mağaza"}</small></article>) : <p className="feedback-empty">Henüz yayınlanmış soru bulunmuyor.</p>}</div>
    </div>
    <div className="product-feedback-column"><header><h2>Değerlendirmeler </h2><span>{average ? `${average.toFixed(1)} / 5` : "Yeni"}</span></header>
      <div className="feedback-list">{reviews.length ? reviews.map(item => <article key={item.id}><div className="feedback-stars">{"★".repeat(item.rating)}{"☆".repeat(5 - item.rating)}</div>{item.title && <b>{item.title}</b>}{item.body && <p>{item.body}</p>}<small>Doğrulanmış alışveriş</small></article>) : <p className="feedback-empty">Henüz yayınlanmış değerlendirme bulunmuyor.</p>}</div>
    </div>
  </section>;
}
