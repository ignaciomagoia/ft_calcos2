"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";

const WhatsAppFAB = () => {
  const pathname = usePathname();
  const hideOnAdmin = pathname?.startsWith("/admin");

  const href = useMemo(() => {
    const envPhone =
      process.env.NEXT_PUBLIC_WHATSAPP_PHONE ||
      process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ||
      "";
    const normalized = envPhone.replace(/[^\d]/g, "");
    const fallbackPhone = "5491100000000";
    const phone = normalized.length > 0 ? normalized : fallbackPhone;
    const text = encodeURIComponent("Hola! Quiero hacer un pedido de calcos");
    return `https://wa.me/${phone}?text=${text}`;
  }, []);

  if (hideOnAdmin) {
    return null;
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl shadow-[#25D366]/40 transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#128C7E]"
      aria-label="Abrir WhatsApp"
    >
      <WhatsAppIcon />
    </a>
  );
};

const WhatsAppIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 32 32"
    width="24"
    height="24"
    aria-hidden="true"
  >
    <path
      fill="currentColor"
      d="M16.002 3.2c-7.047 0-12.8 5.607-12.8 12.52 0 2.432.703 4.724 1.918 6.652L3.2 28.8l6.684-1.77c1.86 1.012 3.997 1.59 6.118 1.59 7.046 0 12.8-5.607 12.8-12.52 0-6.913-5.754-12.52-12.8-12.52zm0 22.613c-1.914 0-3.794-.515-5.432-1.486l-.39-.232-3.968 1.05 1.06-3.776-.256-.39a10.14 10.14 0 0 1-1.598-5.259c0-5.624 4.708-10.2 10.584-10.2 5.868 0 10.584 4.576 10.584 10.2 0 5.623-4.716 10.193-10.584 10.193zm5.984-7.63c-.328-.163-1.94-.958-2.242-1.067-.302-.109-.522-.163-.742.163-.219.327-.856 1.067-1.05 1.291-.192.218-.385.245-.713.082-.329-.163-1.387-.502-2.644-1.6-.977-.868-1.638-1.94-1.83-2.267-.192-.327-.021-.504.144-.666.148-.146.329-.382.493-.573.165-.191.219-.328.329-.546.11-.218.055-.409-.027-.573-.082-.163-.742-1.781-1.017-2.437-.267-.642-.539-.556-.742-.566-.192-.01-.411-.012-.63-.012a1.214 1.214 0 0 0-.88.41c-.302.327-1.156 1.13-1.156 2.755 0 1.626 1.184 3.197 1.35 3.422.164.218 2.33 3.652 5.65 4.971.791.34 1.408.543 1.889.696.793.253 1.515.217 2.085.132.636-.095 1.94-.792 2.215-1.56.274-.767.274-1.424.192-1.56-.082-.136-.301-.218-.63-.382z"
    />
  </svg>
);

export default WhatsAppFAB;
