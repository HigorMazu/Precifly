"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function AlertasPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/alerts");
    if (res.status === 401) { setError("Faça login para gerenciar alertas"); setLoading(false); return; }
    const data = await res.json();
    setAlerts(data);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function remove(id: string) {
    await fetch(`/api/alerts/${id}`, { method: "DELETE" });
    load();
  }

  if (loading) return <div className="mx-auto max-w-7xl p-8">Carregando alertas...</div>;
  if (error) return <div className="mx-auto max-w-7xl p-8"><div className="rounded-2xl bg-white border p-12 text-center"><p>{error}</p><Link href="/login" className="mt-4 inline-block rounded-full bg-zinc-900 text-white px-6 py-2">Entrar</Link></div></div>;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="text-2xl font-black">Alertas de preço</h1>
      <p className="text-sm text-zinc-500 mt-1">Receba notificações quando o preço atingir seu alvo.</p>
      {alerts.length === 0 ? (
        <div className="mt-6 rounded-3xl bg-white border border-dashed p-12 text-center">
          <p className="font-medium">Nenhum alerta criado</p>
          <p className="text-sm text-zinc-500">Crie alertas na página do produto.</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-3">
          {alerts.map((a) => (
            <div key={a.id} className="rounded-2xl bg-white border p-4 flex justify-between items-center">
              <div>
                <div className="font-bold">{a.product.name}</div>
                <div className="text-sm text-zinc-500">{a.type} • limite {Number(a.threshold).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} • {a.isActive ? "ativo" : "inativo"}</div>
              </div>
              <button onClick={() => remove(a.id)} className="rounded-full border px-4 py-2 text-sm hover:bg-zinc-50">Excluir</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
