import Image from "next/image";

const INSTAGRAM_REEL_URL = "https://www.instagram.com/reel/DMY17AqRFiV/?igsh=ZTJneWtjeWRpeGxt";

const SizesSection = () => {
  return (
    <section className="w-full bg-white py-12">
      <div className="mx-auto w-full max-w-6xl space-y-8 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-5xl overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
          <Image
            src="/tamaños.png"
            alt="Tamaños recomendados de calcos"
            width={1600}
            height={900}
            className="h-auto w-full object-contain"
          />
        </div>

        <div className="flex justify-center">
          <a
            href={INSTAGRAM_REEL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-primary)] px-8 py-3 !text-white text-sm font-semibold shadow-lg shadow-[rgba(1,34,161,0.35)] transition hover:-translate-y-0.5 hover:bg-[var(--color-primary-dark)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
          >
            <span
              aria-hidden="true"
              className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/15 text-base"
            >
              🐶
            </span>
            Ver ejemplos
          </a>
        </div>
      </div>
    </section>
  );
};

export default SizesSection;

