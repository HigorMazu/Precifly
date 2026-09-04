"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Header() {
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUser(d.user));
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-zinc-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold">
              P
            </div>
            <span className="text-xl font-bold tracking-tight text-zinc-900">Precify</span>
            <span className="hidden sm:inline text-xs font-medium bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">BETA</span>
          </Link>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (q.trim()) window.location.href = `/search?mode=real&q=${encodeURIComponent(q)}`;
            }}
            className="flex-1 max-w-xl hidden md:flex items-center"
          >
            <div className="relative w-full">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar produtos reais para comprar..."
                className="w-full rounded-full border border-zinc-300 bg-zinc-50 py-2.5 pl-11 pr-4 text-sm placeholder:text-zinc-500 focus:border-violet-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20"
              />
              <span className="absolute left-4 top-2.5 text-zinc-400">⌕</span>
            </div>
            <button type="submit" className="ml-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700">
              Buscar real
            </button>
          </form>

          <nav className="flex items-center gap-1 sm:gap-3 text-sm">
            <Link href="/comparar" className="hidden sm:inline px-3 py-2 rounded-full hover:bg-zinc-100 text-zinc-700">
              Comparar
            </Link>
            <Link href="/wishlist" className="px-3 py-2 rounded-full hover:bg-zinc-100 text-zinc-700">
              Wishlist
            </Link>
            <Link href="/alertas" className="hidden sm:inline px-3 py-2 rounded-full hover:bg-zinc-100 text-zinc-700">
              Alertas
            </Link>
            {user ? (
              <Link href="/perfil" className="flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-800">
                <span className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center text-xs">{user.name[0]}</span>
                <span className="hidden sm:inline">{user.name.split(" ")[0]}</span>
              </Link>
            ) : (
              <Link href="/login" className="rounded-full border border-zinc-300 px-4 py-2 font-medium hover:bg-zinc-50">
                Entrar
              </Link>
            )}
          </nav>
        </div>
        {/* mobile search */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (q.trim()) window.location.href = `/search?mode=real&q=${encodeURIComponent(q)}`;
          }}
          className="md:hidden pb-3 flex gap-2"
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar para comprar de verdade..."
            className="flex-1 rounded-full border border-zinc-300 bg-zinc-50 px-4 py-2 text-sm focus:border-violet-500 focus:outline-none"
          />
          <button className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-bold text-white">Buscar</button>
        </form>
      </div>
    </header>
  );
}
