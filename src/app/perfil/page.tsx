import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function PerfilPage() {
  const session = await getCurrentUser();
  if (!session) redirect("/login");
  const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { name: true, email: true, createdAt: true } });

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="rounded-3xl bg-white border p-8">
        <h1 className="text-2xl font-black">Perfil</h1>
        <div className="mt-6 space-y-3 text-sm">
          <div className="rounded-xl bg-zinc-50 px-4 py-3">
            <div className="text-xs text-zinc-500 uppercase">Nome</div>
            <div className="font-bold">{user?.name}</div>
          </div>
          <div className="rounded-xl bg-zinc-50 px-4 py-3">
            <div className="text-xs text-zinc-500 uppercase">Email</div>
            <div className="font-bold">{user?.email}</div>
          </div>
          <div className="rounded-xl bg-zinc-50 px-4 py-3">
            <div className="text-xs text-zinc-500 uppercase">Membro desde</div>
            <div className="font-bold">{user?.createdAt.toLocaleDateString("pt-BR")}</div>
          </div>
        </div>
        <form action={async () => { "use server"; const { clearAuthCookie } = await import("@/lib/auth"); await clearAuthCookie(); redirect("/login"); }}>
          <button className="mt-6 rounded-full border px-6 py-2.5 font-bold hover:bg-zinc-50">Sair</button>
        </form>
      </div>
    </div>
  );
}
