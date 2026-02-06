import Image from "next/image";

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
      </div>
    </section>
  );
};

export default PremiumQualitySection;
