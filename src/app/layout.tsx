import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import ComparisonBar from "@/components/ComparisonBar";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Precify — Qual produto vale mais a pena?",
  description: "Compare preço, histórico, avaliações, confiança e Precify Score para decidir com inteligência.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-zinc-50">
        <Header />
        <main className="flex-1">{children}</main>
        <ComparisonBar />
        <footer className="border-t bg-white mt-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 text-sm text-zinc-500">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <span>© {new Date().getFullYear()} Precify — Decisão de compra inteligente.</span>
              <span className="text-xs">Dados de demonstração • Não apresentado como real sem validação</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
