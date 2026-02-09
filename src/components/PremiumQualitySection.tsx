import Image from "next/image";

const INSTAGRAM_PROOF_URL =
  "https://www.instagram.com/reel/DMG3WCnxf4P/?igsh=MXZxOHBzeGQ2Zm1rMQ==";

const PremiumQualitySection = () => {
  return (
    <section className="w-full bg-[var(--color-secondary)]/15 py-12">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-5xl overflow-hidden rounded-[32px] border border-white/70 bg-white shadow-sm">
          <Image
            src="/calidad.png"
            alt="Calidad premium de calcos (vinilo + laca UV)"
            width={1600}
            height={900}
            className="h-auto w-full object-contain"
          />
        </div>

        <div className="mt-4 flex justify-center">
          <a
            href={INSTAGRAM_PROOF_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-full bg-[var(--color-primary)] px-8 py-3 !text-white text-sm font-semibold shadow-lg shadow-[rgba(1,34,161,0.35)] transition hover:-translate-y-0.5 hover:bg-[var(--color-primary-dark)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
          >
            {"\uD83D\uDD25 Ver pruebas reales"}
          </a>
        </div>
      </div>
    </section>
  );
};

export default PremiumQualitySection;
