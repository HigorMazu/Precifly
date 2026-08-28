"use client";
import { useState } from "react";
import { addToCompare } from "@/components/ComparisonBar";

export default function ProductActions({ productId, productSlug, productName }: { productId: string; productSlug: string; productName: string }) {
  const [msg, setMsg] = useState<string | null>(null);

  async function addWishlist() {
    const res = await fetch("/api/wishlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId }) });
    if (res.ok) setMsg("Adicionado à wishlist ✓");
    else if (res.status === 401) setMsg("Faça login para salvar");
    else if (res.status === 409) setMsg("Já está na wishlist");
    else setMsg("Erro ao adicionar");
    setTimeout(() => setMsg(null), 3000);
  }

  async function createAlert() {
    const threshold = prompt("Defina o preço alvo (ex: 4500):");
    if (!threshold) return;
    const res = await fetch("/api/alerts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId, type: "PRICE_BELOW", threshold: Number(threshold) }) });
    if (res.ok) setMsg("Alerta criado ✓");
    else if (res.status === 401) setMsg("Faça login para criar alerta");
    else setMsg("Erro ao criar alerta");
    setTimeout(() => setMsg(null), 3000);
  }

  return (
    <div className="mt-5 flex flex-wrap gap-2">
      <button onClick={addWishlist} className="rounded-full bg-violet-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-violet-700">♡ Wishlist</button>
      <button onClick={createAlert} className="rounded-full border px-5 py-2.5 text-sm font-bold hover:bg-zinc-50">🔔 Criar alerta</button>
      <button onClick={() => addToCompare({ id: productId, slug: productSlug, name: productName })} className="rounded-full border px-5 py-2.5 text-sm font-bold hover:bg-zinc-50">⇄ Comparar</button>
      {msg && <span className="text-sm bg-zinc-900 text-white px-3 py-2 rounded-full">{msg}</span>}
    </div>
  );
}
