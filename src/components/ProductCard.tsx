import Link from "next/link";
import { formatBRL } from "@/lib/utils";

type Props = {
  product: {
    id: string;
    slug: string;
    name: string;
    brand?: string | null;
    imageUrl?: string | null;
    minPrice: number | null;
    avgRating: number | null;
    reviewCount: number;
    category: { name: string };
  };
  score?: number | null;
};

export default function ProductCard({ product, score }: Props) {
  return (
    <Link href={`/produto/${product.slug}`} className="group flex flex-col rounded-2xl border border-zinc-200 bg-white overflow-hidden hover:shadow-lg transition">
      <div className="aspect-[4/3] bg-zinc-50 overflow-hidden">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover group-hover:scale-105 transition duration-300" />
        ) : (
          <div className="h-full flex items-center justify-center text-zinc-400">Sem imagem</div>
        )}
      </div>
      <div className="p-4 flex flex-col gap-2 flex-1">
        <span className="text-xs font-medium text-violet-600 uppercase tracking-wide">{product.category.name}</span>
        <h3 className="font-semibold leading-tight line-clamp-2 text-zinc-900">{product.name}</h3>
        {product.brand && <span className="text-xs text-zinc-500">{product.brand}</span>}
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium">{product.avgRating ? product.avgRating.toFixed(1) : "—"} ★</span>
          <span className="text-zinc-500">({product.reviewCount})</span>
          {score !== undefined && score !== null && (
            <span className={`ml-auto rounded-full px-2 py-0.5 text-xs font-bold ${score >= 80 ? "bg-emerald-100 text-emerald-700" : score >= 65 ? "bg-amber-100 text-amber-700" : "bg-zinc-100 text-zinc-700"}`}>
              Score {score}
            </span>
          )}
        </div>
        <div className="mt-auto pt-2">
          <span className="text-lg font-bold text-zinc-900">{product.minPrice ? formatBRL(product.minPrice) : "Preço indisponível"}</span>
          <span className="text-xs text-zinc-500 block">menor preço</span>
        </div>
      </div>
    </Link>
  );
}
