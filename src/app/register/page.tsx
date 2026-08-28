"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, password }) });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Erro"); setLoading(false); return; }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="rounded-3xl bg-white border p-8">
        <h1 className="text-2xl font-black">Criar conta</h1>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium">Nome</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 w-full rounded-xl border px-3 py-2.5" />
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className="mt-1 w-full rounded-xl border px-3 py-2.5" />
          </div>
          <div>
            <label className="text-sm font-medium">Senha</label>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required className="mt-1 w-full rounded-xl border px-3 py-2.5" />
          </div>
          {error && <div className="rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>}
          <button disabled={loading} className="w-full rounded-full bg-zinc-900 text-white py-3 font-bold">{loading ? "Criando..." : "Criar conta"}</button>
        </form>
        <p className="text-sm text-center mt-4">Já tem conta? <Link href="/login" className="font-bold text-violet-600">Entrar</Link></p>
      </div>
    </div>
  );
}
