"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { formatBRL } from "@/lib/utils";

function CompararContent() {
  const params = useSearchParams();
  const ids = params.get("ids")?.split(",").filter(Boolean) || [];
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ids.length === 0) {
      const raw = localStorage.getItem("precifly_compare");
      if (raw) {
        const arr = JSON.parse(raw);
        if (arr.length) window.location.href = `/comparar?ids=${arr.map((x: any) => x.id).join(",")}`;
      }
      return;
    }
    setLoading(true);
    Promise.all(
      ids.map(async (id) => {
        const [prod, offers, history, score, reviews] = await Promise.all([
          fetch(`/api/products/${id}`).then((r) => r.json()),
          fetch(`/api/products/${id}/offers`).then((r) => r.json()),
          fetch(`/api/products/${id}/price-history`).then((r) => r.json()),
          fetch(`/api/products/${id}/score`).then((r) => r.json()),
          fetch(`/api/products/${id}/reviews`).then((r) => r.json()),
        ]);
        return { prod, offers, history, score, reviews };
      }),
    )
      .then(setProducts)
      .finally(() => setLoading(false));
  }, [params]);

  if (ids.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="rounded-3xl bg-white border p-12 text-center">
          <h1 className="text-xl font-bold">Comparação</h1>
          <p className="text-sm text-zinc-500 mt-2">Selecione até 4 produtos na listagem ou na página do produto para comparar lado a lado.</p>
          <a href="/search" className="mt-4 inline-block rounded-full bg-zinc-900 text-white px-6 py-2.5 font-bold">Buscar produtos</a>
        </div>
      </div>
    );
  }

  if (loading) return <div className="mx-auto max-w-7xl p-8">Carregando comparação...</div>;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="text-2xl font-black">Comparar produtos</h1>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[800px] text-sm">
          <thead>
            <tr>
              <th className="text-left p-3 bg-zinc-50 rounded-tl-2xl">Critério</th>
              {products.map((p) => (
                <th key={p.prod.id} className="p-3 bg-zinc-50 text-center min-w-[180px]">
                  <div className="flex flex-col items-center gap-2">
                    {p.prod.imageUrl && <img src={p.prod.imageUrl} alt="" className="h-20 w-20 object-cover rounded-xl" />}
                    <span className="font-bold leading-tight line-clamp-2">{p.prod.name}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white">
            {[
              { label: "Menor preço", get: (p: any) => formatBRL(Math.min(...p.offers.map((o: any) => Number(o.price)))) },
              { label: "Avaliação", get: (p: any) => `${p.reviews.avgRating ? p.reviews.avgRating.toFixed(1) + " ★" : "—"} (${p.reviews.totalReviews})` },
              { label: "Confiança", get: (p: any) => `${p.reviews.confidence.level} (${Math.round(p.reviews.confidence.score * 100)}%)` },
              { label: "Precify Score", get: (p: any) => `${p.score.score} — ${p.score.classification}` },
              { label: "Mín histórico", get: (p: any) => p.history.statistics.min ? formatBRL(p.history.statistics.min) : "—" },
              { label: "Média 30d", get: (p: any) => p.history.statistics.avg30 ? formatBRL(p.history.statistics.avg30) : "—" },
              { label: "Lojas", get: (p: any) => p.offers.length + " ofertas" },
            ].map((row) => (
              <tr key={row.label} className="border-t">
                <td className="p-3 font-bold bg-zinc-50">{row.label}</td>
                {products.map((p) => (
                  <td key={p.prod.id} className="p-3 text-center">{row.get(p)}</td>
                ))}
              </tr>
            ))}
            <tr className="border-t">
              <td className="p-3 font-bold bg-zinc-50">Vantagens</td>
              {products.map((p) => (
                <td key={p.prod.id} className="p-3 text-center text-xs text-emerald-700">{p.prod.reviewInsight?.positiveThemes?.join(", ") || "—"}</td>
              ))}
            </tr>
            <tr className="border-t">
              <td className="p-3 font-bold bg-zinc-50">Desvantagens</td>
              {products.map((p) => (
                <td key={p.prod.id} className="p-3 text-center text-xs text-amber-700">{p.prod.reviewInsight?.negativeThemes?.join(", ") || "—"}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function CompararPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl p-8">Carregando...</div>}>
      <CompararContent />
    </Suspense>
  );
}
