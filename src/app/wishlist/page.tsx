"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { formatBRL } from "@/lib/utils";

export default function WishlistPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/wishlist");
    if (res.status === 401) { setError("Faça login para ver sua wishlist"); setLoading(false); return; }
    const data = await res.json();
    setItems(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function remove(productId: string) {
    await fetch(`/api/wishlist/${productId}`, { method: "DELETE" });
    load();
  }

  if (loading) return <div className="mx-auto max-w-7xl p-8">Carregando wishlist...</div>;
  if (error) return <div className="mx-auto max-w-7xl p-8"><div className="rounded-2xl bg-white border p-12 text-center"><p>{error}</p><Link href="/login" className="mt-4 inline-block rounded-full bg-zinc-900 text-white px-6 py-2">Entrar</Link></div></div>;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="text-2xl font-black">Sua Wishlist</h1>
      {items.length === 0 ? (
        <div className="mt-6 rounded-3xl bg-white border border-dashed p-12 text-center">
          <p className="font-medium">Sua wishlist está vazia</p>
          <p className="text-sm text-zinc-500">Adicione produtos para acompanhar preços.</p>
          <Link href="/search" className="mt-4 inline-block rounded-full bg-violet-600 text-white px-6 py-2.5 font-bold">Explorar produtos</Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-4">
          {items.map((it) => (
            <div key={it.id} className="rounded-2xl bg-white border p-4 flex gap-4 items-center">
              {it.product.imageUrl && <img src={it.product.imageUrl} alt="" className="h-20 w-20 rounded-xl object-cover" />}
              <div className="flex-1">
                <Link href={`/produto/${it.product.slug}`} className="font-bold hover:underline">{it.product.name}</Link>
                <div className="text-sm text-zinc-500">{it.product.category.name} • {it.product.brand}</div>
                <div className="text-sm font-bold">{it.product.offers?.length ? formatBRL(Math.min(...it.product.offers.map((o: any) => Number(o.price)))) : "—"} {it.targetPrice && <span className="font-normal text-zinc-500">• alvo {formatBRL(Number(it.targetPrice))}</span>}</div>
              </div>
              <button onClick={() => remove(it.productId)} className="rounded-full border px-4 py-2 text-sm hover:bg-zinc-50">Remover</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
