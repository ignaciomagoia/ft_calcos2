import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import WhatsAppFAB from "@/components/WhatsAppFAB";

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
            <div className="w-full pb-12 pt-6">
              {children}
            </div>
          </main>
          <footer className="border-t border-slate-200 bg-white">
            <div className="mx-auto flex max-w-6xl flex-col items-center gap-1 px-4 py-6 text-center text-sm text-slate-500">
              <span>© 2026 EFETE Calcos</span>
              <span className="text-xs text-slate-500/80">
                Desarrollado por{" "}
                <a
                  href="https://instagram.com/nacho.magoia"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-[var(--color-primary)] hover:text-[var(--color-primary-dark)]"
                >
                  @nacho.magoia
                </a>
              </span>
            </div>
          </footer>
        </div>
        <WhatsAppFAB />
      </body>
    </html>
  );
}

