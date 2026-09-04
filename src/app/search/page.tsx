"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import RealProductCard from "@/components/RealProductCard";
import { RealProduct } from "@/providers/real-product.provider";

type Product = {
  id: string;
  slug: string;
  name: string;
  brand: string | null;
  imageUrl: string | null;
  category: { name: string; slug: string };
  minPrice: number | null;
  avgRating: number | null;
  reviewCount: number;
};

function SearchContent() {
  const params = useSearchParams();
  const router = useRouter();
  const [data, setData] = useState<{ data: Product[]; pagination: { total: number; totalPages: number; page: number } } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<{ slug: string; name: string }[]>([]);
  const [stores, setStores] = useState<{ slug: string; name: string }[]>([]);
  const [realData, setRealData] = useState<RealProduct[] | null>(null);
  const [realTotal, setRealTotal] = useState(0);
  const [realLoading, setRealLoading] = useState(false);
  const [mode, setMode] = useState<"precify" | "real">((params.get("mode") as any) || "precify");
  const [filters, setFilters] = useState({
    minPrice: params.get("minPrice") || "",
    maxPrice: params.get("maxPrice") || "",
    category: params.get("category") || "",
    store: params.get("store") || "",
    sortBy: params.get("sortBy") || "",
  });

  const q = params.get("q") || "";

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then(setCategories);
    fetch("/api/stores").then((r) => r.json()).then(setStores);
  }, []);

  useEffect(() => {
    setMode((params.get("mode") as any) || "precify");
  }, [params]);

  useEffect(() => {
    if (mode === "real") {
      if (!q) { setRealData([]); return; }
      setRealLoading(true);
      setError(null);
      fetch(`/api/real/search?q=${encodeURIComponent(q)}&limit=12`)
        .then((r) => {
          if (!r.ok) throw new Error("Falha ao buscar produtos reais");
          return r.json();
        })
        .then((res) => { setRealData(res.results); setRealTotal(res.total); })
        .catch((e) => setError(e.message))
        .finally(() => setRealLoading(false));
      return;
    }
    // precify mode
    setLoading(true);
    setError(null);
    const url = `/api/search?${params.toString()}`;
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error("Falha na busca");
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [params, mode, q]);

  function applyFilters() {
    const sp = new URLSearchParams(params.toString());
    Object.entries(filters).forEach(([k, v]) => {
      if (v) sp.set(k, v);
      else sp.delete(k);
    });
    sp.set("page", "1");
    router.push(`/search?${sp.toString()}`);
  }

  function switchMode(next: "precify" | "real") {
    const sp = new URLSearchParams(params.toString());
    sp.set("mode", next);
    router.push(`/search?${sp.toString()}`);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="text-2xl font-bold">Resultados {q && <span className="font-normal text-zinc-500">para &quot;{q}&quot;</span>}</h1>
      {/* Toggle Precify vs Real */}
      <div className="mt-4 flex gap-2 p-1 bg-zinc-100 rounded-full w-fit text-sm">
        <button onClick={() => switchMode("precify")} className={`px-5 py-2 rounded-full font-bold transition ${mode === "precify" ? "bg-white shadow text-zinc-900" : "text-zinc-500 hover:text-zinc-700"}`}>
          Catálogo Precify <span className="hidden sm:inline font-normal text-xs">(com Score e histórico)</span>
        </button>
        <button onClick={() => switchMode("real")} className={`px-5 py-2 rounded-full font-bold transition ${mode === "real" ? "bg-emerald-600 text-white shadow" : "text-zinc-500 hover:text-zinc-700"}`}>
          🛒 Produtos reais <span className="hidden sm:inline font-normal text-xs">— comprar de verdade</span>
        </button>
      </div>
      {mode === "real" && (
        <div className="mt-3 rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
          Você está vendo <b>produtos reais do Mercado Livre</b> com preço verdadeiro. Clique em <b>Comprar agora</b> para ser levado à loja e finalizar a compra com segurança. Promoções como as da Kabum também aparecem aqui quando disponíveis via Mercado Livre.
        </div>
      )}
      {mode === "precify" && (
        <div className="mt-3 rounded-2xl bg-violet-50 border border-violet-200 px-4 py-3 text-sm text-violet-800">
          Catálogo de demonstração Precify com <b>Precify Score, histórico de preço, confiança e comparação</b>. Para comprar de verdade, mude para <b>Produtos reais</b>.
        </div>
      )}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        <aside className="rounded-2xl bg-white border p-4 h-fit sticky top-20">
          <h2 className="font-bold">Filtros</h2>
          <div className="mt-4 space-y-4 text-sm">
            <div>
              <label className="font-medium">Categoria</label>
              <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2" disabled={mode === "real"}>
                <option value="">Todas</option>
                {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
              </select>
              {mode === "real" && <span className="text-xs text-zinc-400">Filtros avançados só no Precify</span>}
            </div>
            <div>
              <label className="font-medium">Loja</label>
              <select value={filters.store} onChange={(e) => setFilters({ ...filters, store: e.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2" disabled={mode === "real"}>
                <option value="">Todas</option>
                {stores.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-medium">Preço min</label>
                <input value={filters.minPrice} onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })} placeholder="0" type="number" className="mt-1 w-full rounded-xl border px-3 py-2" disabled={mode === "real"} />
              </div>
              <div>
                <label className="font-medium">Preço max</label>
                <input value={filters.maxPrice} onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })} placeholder="10000" type="number" className="mt-1 w-full rounded-xl border px-3 py-2" disabled={mode === "real"} />
              </div>
            </div>
            <div>
              <label className="font-medium">Ordenar por</label>
              <select value={filters.sortBy} onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2" disabled={mode === "real"}>
                <option value="">Relevância</option>
                <option value="price_asc">Menor preço</option>
                <option value="price_desc">Maior preço</option>
                <option value="rating">Melhor avaliação</option>
                <option value="reviews">Mais avaliações</option>
              </select>
            </div>
            <button onClick={applyFilters} className="w-full rounded-full bg-violet-600 text-white py-2.5 font-bold hover:bg-violet-700 disabled:opacity-50" disabled={mode === "real"}>Aplicar</button>
            <button onClick={() => router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search")} className="w-full rounded-full border py-2 font-medium hover:bg-zinc-50">Limpar</button>
          </div>
        </aside>
        <div>
          {mode === "real" ? (
            <>
              {realLoading && <div className="rounded-2xl bg-white border p-12 text-center animate-pulse">Buscando produtos reais no Mercado Livre...</div>}
              {error && <div className="rounded-2xl bg-red-50 border border-red-200 p-8 text-center text-red-700">Erro: {error}</div>}
              {!realLoading && !error && realData && (
                <>
                  <p className="text-sm text-zinc-500 mb-4">{realTotal.toLocaleString("pt-BR")} produto(s) reais encontrados — <span className="font-bold text-emerald-700">compre de verdade</span></p>
                  {realData.length === 0 ? (
                    <div className="rounded-2xl bg-white border border-dashed p-12 text-center">
                      <p className="font-medium">Nenhum produto real encontrado</p>
                      <p className="text-sm text-zinc-500">Tente outro termo, ex: &quot;iphone&quot;, &quot;gpu rtx&quot;, &quot;kabum&quot;</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {realData.map((p) => <RealProductCard key={p.id} product={p} />)}
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            <>
              {loading && <div className="rounded-2xl bg-white border p-12 text-center animate-pulse">Carregando...</div>}
              {error && <div className="rounded-2xl bg-red-50 border border-red-200 p-8 text-center text-red-700">Erro: {error}</div>}
              {!loading && !error && data && (
                <>
                  <p className="text-sm text-zinc-500 mb-4">{data.pagination.total} produto(s) encontrado(s) — página {data.pagination.page} de {data.pagination.totalPages}</p>
                  {data.data.length === 0 ? (
                    <div className="rounded-2xl bg-white border border-dashed p-12 text-center">
                      <p className="font-medium">Nenhum produto encontrado</p>
                      <p className="text-sm text-zinc-500">Tente ajustar os filtros ou buscar outro termo.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {data.data.map((p) => <ProductCard key={p.id} product={p} />)}
                    </div>
                  )}
                  {data.pagination.totalPages > 1 && (
                    <div className="mt-6 flex gap-2 justify-center">
                      {Array.from({ length: data.pagination.totalPages }, (_, i) => i + 1).slice(0, 5).map((page) => (
                        <button
                          key={page}
                          onClick={() => {
                            const sp = new URLSearchParams(params.toString());
                            sp.set("page", String(page));
                            router.push(`/search?${sp.toString()}`);
                          }}
                          className={`h-9 w-9 rounded-full text-sm font-bold ${data.pagination.page === page ? "bg-zinc-900 text-white" : "bg-white border hover:bg-zinc-50"}`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl p-8">Carregando busca...</div>}>
      <SearchContent />
    </Suspense>
  );
}
