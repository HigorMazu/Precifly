import { formatBRL } from "@/lib/utils";
import { getRealProduct } from "@/providers/real-product.provider";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function RealProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let product: any = null;
  let error: string | null = null;
  try {
    product = await getRealProduct(id);
  } catch (e: any) {
    error = e.message;
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-3xl bg-white border p-12 text-center">
          <p className="font-bold">Produto real não encontrado</p>
          <p className="text-sm text-zinc-500 mt-1">{error}</p>
          <Link href="/search?mode=real" className="mt-4 inline-block rounded-full bg-zinc-900 text-white px-6 py-2">Voltar à busca real</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/search?mode=real" className="text-sm text-violet-600 hover:underline">← Voltar aos produtos reais</Link>
      <div className="mt-4 rounded-3xl bg-white border p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
        <div>
          <img src={product.thumbnail} alt={product.title} className="w-full max-h-[400px] object-contain bg-zinc-50 rounded-2xl p-4" />
          <h1 className="text-2xl font-black mt-6">{product.title}</h1>
          <p className="text-sm text-zinc-500 mt-1">{product.seller} • {product.condition} • {product.source}</p>
          {product.description && <p className="text-sm text-zinc-700 mt-4 whitespace-pre-wrap leading-relaxed bg-zinc-50 rounded-2xl p-4">{product.description.slice(0, 800)}</p>}
        </div>
        <div className="space-y-4">
          <div className="rounded-2xl bg-zinc-900 text-white p-6">
            <div className="text-xs text-white/70">Preço real</div>
            {product.price > 0 ? (
              <>
                <div className="text-3xl font-black">{formatBRL(product.price)}</div>
                {product.originalPrice && <div className="text-sm line-through text-white/60">{formatBRL(product.originalPrice)} ({product.discountPercent}% OFF)</div>}
              </>
            ) : (
              <div className="text-xl font-bold">Ver preço ao vivo na loja</div>
            )}
            {product.freeShipping && <div className="mt-2 inline-block rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold">Frete grátis</div>}
            <a href={product.permalink} target="_blank" rel="noopener noreferrer" className="mt-4 block w-full rounded-full bg-emerald-500 py-3 text-center font-black hover:bg-emerald-600">
              Comprar de verdade →
            </a>
            <p className="text-xs text-white/60 mt-2 text-center">Você será redirecionado para {product.seller} para pagamento seguro.</p>
          </div>
          <div className="rounded-2xl border p-4 text-sm">
            <h3 className="font-bold">Como funciona?</h3>
            <ul className="mt-2 space-y-1 text-zinc-600">
              <li>✓ Preço verdadeiro atualizado agora</li>
              <li>✓ Estoque: {product.availableQuantity ?? "consultar na loja"}</li>
              <li>✓ Compra protegida Mercado Livre</li>
              <li>✓ Precify não cobra taxa extra</li>
            </ul>
          </div>
          <Link href={`/search?mode=real&q=${encodeURIComponent(product.title.split(" ").slice(0, 3).join(" "))}`} className="block text-center rounded-full border py-2.5 font-bold hover:bg-zinc-50 text-sm">
            Ver similares reais
          </Link>
        </div>
      </div>
    </div>
  );
}
