import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://efete-calcos.vercel.app"),
  title: {
    default: "EFETE Calcos",
    template: "%s | EFETE Calcos",
  },
  description:
    "E-commerce minimalista para gestionar el catálogo de calcos EFETE: categorías, carrito y checkout por WhatsApp.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="bg-slate-50">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50 text-slate-900`}
      >
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1">
            <div className="mx-auto w-full max-w-6xl px-4 pb-12 pt-6 sm:px-6 lg:px-8">
              {children}
            </div>
          </main>
          <footer className="border-t border-slate-200 bg-white">
            <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
              <span>© {new Date().getFullYear()} EFETE Calcos. Todos los derechos reservados.</span>
              <span>Hecho con Next.js + Supabase.</span>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
