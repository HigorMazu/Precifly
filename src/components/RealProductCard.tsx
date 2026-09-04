import { formatBRL } from "@/lib/utils";
import { RealProduct } from "@/providers/real-product.provider";

export default function RealProductCard({ product }: { product: RealProduct }) {
  return (
    <div className="group flex flex-col rounded-2xl border border-zinc-200 bg-white overflow-hidden hover:shadow-lg transition">
      <div className="aspect-[4/3] bg-zinc-50 overflow-hidden relative">
        <img src={product.thumbnail} alt={product.title} className="h-full w-full object-contain p-4 group-hover:scale-105 transition duration-300" />
        {product.discountPercent && (
          <span className="absolute top-3 left-3 rounded-full bg-emerald-600 text-white text-xs font-bold px-2.5 py-1">
            -{product.discountPercent}% OFF
          </span>
        )}
        {product.freeShipping && (
          <span className="absolute top-3 right-3 rounded-full bg-white border text-emerald-700 text-xs font-bold px-2 py-1">
            Frete grátis
          </span>
        )}
      </div>
      <div className="p-4 flex flex-col gap-2 flex-1">
        <span className="text-xs font-bold tracking-wide text-violet-600 uppercase">{product.source} • {product.seller}</span>
        <h3 className="font-semibold leading-tight line-clamp-2 text-zinc-900 min-h-[2.75rem]">{product.title}</h3>
        <div className="flex items-center gap-2 text-xs">
          <span className="rounded-full bg-zinc-100 px-2 py-1">{product.condition}</span>
          {product.availableQuantity !== undefined && <span className="text-zinc-500">{product.availableQuantity} disponíveis</span>}
        </div>
        <div className="mt-auto pt-2">
          {product.price > 0 ? (
            <>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black text-zinc-900">{formatBRL(product.price)}</span>
                {product.originalPrice && <span className="text-xs line-through text-zinc-500">{formatBRL(product.originalPrice)}</span>}
              </div>
              <span className="text-xs text-zinc-500">preço real na loja</span>
            </>
          ) : (
            <>
              <span className="text-sm font-bold text-emerald-700">Ofertas reais na loja</span>
              <span className="text-xs text-zinc-500 block">clique para ver preço ao vivo</span>
            </>
          )}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <a href={`/real/${product.id}`} className="rounded-full border px-3 py-2.5 text-center text-sm font-bold hover:bg-zinc-50">Ver detalhes</a>
          <a
            href={product.permalink}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-emerald-600 px-3 py-2.5 text-center text-sm font-bold text-white hover:bg-emerald-700"
          >
            Comprar →
          </a>
        </div>
        <span className="text-[10px] text-center text-zinc-400">Compra real e segura • Mercado Livre</span>
      </div>
    </div>
  );
}
