"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type Item = { id: string; slug: string; name: string };

export default function ComparisonBar() {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem("precifly_compare");
    if (raw) setItems(JSON.parse(raw));
    const handler = () => {
      const r = localStorage.getItem("precifly_compare");
      setItems(r ? JSON.parse(r) : []);
    };
    window.addEventListener("precifly_compare_update", handler);
    return () => window.removeEventListener("precifly_compare_update", handler);
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-zinc-900 text-white rounded-full px-4 py-3 flex items-center gap-3 shadow-2xl z-40 max-w-[90vw]">
      <span className="text-sm font-medium whitespace-nowrap">{items.length} selecionado(s)</span>
      <div className="hidden sm:flex gap-1 text-xs">
        {items.map((i) => (
          <span key={i.id} className="bg-white/20 px-2 py-1 rounded-full truncate max-w-[120px]">{i.name}</span>
        ))}
      </div>
      <Link href={`/comparar?ids=${items.map((i) => i.id).join(",")}`} className="bg-white text-zinc-900 px-4 py-1.5 rounded-full text-sm font-bold hover:bg-zinc-100">
        Comparar
      </Link>
      <button onClick={() => { localStorage.removeItem("precifly_compare"); window.dispatchEvent(new Event("precifly_compare_update")); }} className="text-white/70 hover:text-white text-sm px-2">Limpar</button>
    </div>
  );
}

export function addToCompare(item: Item) {
  const raw = localStorage.getItem("precifly_compare");
  const arr: Item[] = raw ? JSON.parse(raw) : [];
  if (arr.find((x) => x.id === item.id)) return;
  if (arr.length >= 4) { alert("Máximo 4 produtos para comparação"); return; }
  arr.push(item);
  localStorage.setItem("precifly_compare", JSON.stringify(arr));
  window.dispatchEvent(new Event("precifly_compare_update"));
}
