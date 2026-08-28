export default function ScoreBadge({ score, classification }: { score: number; classification: string }) {
  const color =
    score >= 90 ? "bg-emerald-600 text-white" :
    score >= 80 ? "bg-emerald-500 text-white" :
    score >= 65 ? "bg-amber-500 text-white" :
    score >= 50 ? "bg-zinc-600 text-white" : "bg-red-500 text-white";
  return (
    <div className={`inline-flex items-center gap-3 rounded-2xl px-5 py-3 ${color}`}>
      <span className="text-3xl font-black">{score}</span>
      <span className="text-sm font-medium leading-tight">{classification}</span>
    </div>
  );
}
