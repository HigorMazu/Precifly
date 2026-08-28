"use client";
import { formatBRL } from "@/lib/utils";
import { useState } from "react";

type Point = { date: string; price: number };

export default function PriceChart({ history, stats }: { history: Point[]; stats: { min: number | null; max: number | null; avg: number | null; current: number | null } }) {
  const [hover, setHover] = useState<Point | null>(null);

  if (history.length === 0) return <p className="text-sm text-zinc-500">Sem histórico suficiente.</p>;

  const prices = history.map((h) => h.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const width = 800;
  const height = 200;
  const padding = 20;

  const points = history.map((h, i) => {
    const x = padding + (i / (history.length - 1 || 1)) * (width - padding * 2);
    const y = height - padding - ((h.price - min) / range) * (height - padding * 2);
    return { x, y, p: h };
  });

  const pathD = points.map((pt, i) => `${i === 0 ? "M" : "L"} ${pt.x} ${pt.y}`).join(" ");

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4">
      <div className="flex flex-wrap gap-4 text-xs mb-3">
        <span className="rounded-full bg-zinc-900 text-white px-3 py-1">Atual: {stats.current ? formatBRL(stats.current) : "—"}</span>
        <span className="rounded-full bg-emerald-100 text-emerald-700 px-3 py-1">Mín: {stats.min ? formatBRL(stats.min) : "—"}</span>
        <span className="rounded-full bg-amber-100 text-amber-700 px-3 py-1">Média: {stats.avg ? formatBRL(stats.avg) : "—"}</span>
        <span className="rounded-full bg-zinc-100 px-3 py-1">Máx: {stats.max ? formatBRL(stats.max) : "—"}</span>
      </div>

      <div className="relative overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[220px]">
          {/* grid */}
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#e4e4e7" />
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#f4f4f5" strokeDasharray="4 4" />
          {/* path */}
          <path d={pathD} fill="none" stroke="#7c3aed" strokeWidth={2.5} strokeLinejoin="round" />
          {points.map((pt, i) => (
            <circle
              key={i}
              cx={pt.x}
              cy={pt.y}
              r={hover?.date === pt.p.date ? 5 : 3}
              fill={hover?.date === pt.p.date ? "#7c3aed" : "white"}
              stroke="#7c3aed"
              strokeWidth={2}
              onMouseEnter={() => setHover(pt.p)}
              onMouseLeave={() => setHover(null)}
              className="cursor-pointer"
            />
          ))}
        </svg>
        {hover && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-xs px-3 py-1.5 rounded-full shadow">
            {new Date(hover.date).toLocaleDateString("pt-BR")} — {formatBRL(hover.price)}
          </div>
        )}
      </div>
      <p className="text-xs text-zinc-500 mt-2">Evolução de preço nos últimos {history.length} registros. Passe o mouse para ver detalhes.</p>
    </div>
  );
}
