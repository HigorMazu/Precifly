import Link from "next/link";
import prisma from "@/lib/prisma";
import ProductCard from "@/components/ProductCard";

export const dynamic = "force-dynamic";

export default async function Home() {
  let products: any[] = [];
  let categories: any[] = [];
  try {
    products = await prisma.product.findMany({
      include: {
        category: true,
        offers: true,
        _count: { select: { reviews: true } },
        reviews: { select: { rating: true } },
      },
      take: 8,
      orderBy: { createdAt: "desc" },
    });
    categories = await prisma.category.findMany();
  } catch (e) {
    console.error("DB not available on build", e);
  }

  const enriched = products.map((p: any) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    brand: p.brand,
    imageUrl: p.imageUrl,
    category: p.category,
    minPrice: p.offers.length ? Math.min(...p.offers.map((o: any) => Number(o.price))) : null,
    avgRating: p.reviews.length ? p.reviews.reduce((s: number, r: any) => s + r.rating, 0) / p.reviews.length : null,
    reviewCount: p._count.reviews,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero */}
      <section className="rounded-3xl bg-gradient-to-br from-violet-600 via-indigo-600 to-violet-800 p-8 sm:p-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_50%)]" />
        <div className="relative max-w-2xl">
          <h1 className="text-3xl sm:text-5xl font-black leading-tight tracking-tight">Qual produto vale mais a pena comprar?</h1>
          <p className="mt-4 text-violet-100 text-base sm:text-lg">Compare preço, histórico, avaliações, confiança e <span className="font-bold text-white">Precify Score</span> em um só lugar.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/search" className="rounded-full bg-white text-violet-700 px-6 py-3 font-bold hover:bg-zinc-100">Explorar produtos</Link>
            <Link href="/comparar" className="rounded-full border border-white/30 px-6 py-3 font-medium hover:bg-white/10">Comparar</Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-2 text-xs">
            {categories.map((c) => (
              <Link key={c.id} href={`/search?category=${c.slug}`} className="rounded-full bg-white/15 px-3 py-1.5 backdrop-blur hover:bg-white/25">{c.name}</Link>
            ))}
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section className="mt-10 grid grid-cols-1 sm:grid-cols-4 gap-4 text-sm">
        {[
          { title: "Pesquisar", desc: "Encontre e filtre" },
          { title: "Comparar", desc: "Preço, rating, confiança" },
          { title: "Analisar", desc: "Histórico e Precify Score" },
          { title: "Decidir", desc: "Compre com confiança" },
        ].map((s) => (
          <div key={s.title} className="rounded-2xl bg-white border p-4">
            <div className="font-bold text-zinc-900">{s.title}</div>
            <div className="text-zinc-500">{s.desc}</div>
          </div>
        ))}
      </section>

      {/* Produtos em destaque */}
      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-zinc-900">Produtos em destaque</h2>
          <Link href="/search" className="text-sm font-medium text-violet-600 hover:underline">Ver todos →</Link>
        </div>
        {enriched.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed p-12 text-center bg-white">
            <p className="font-medium">Nenhum produto ainda</p>
            <p className="text-sm text-zinc-500 mt-1">Execute o seed para popular o banco.</p>
            <code className="text-xs bg-zinc-100 px-2 py-1 rounded mt-3 inline-block">npm run db:seed</code>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {enriched.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
