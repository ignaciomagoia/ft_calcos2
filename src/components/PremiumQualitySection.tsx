const badges = [
  { label: "Agua", icon: "💧" },
  { label: "Sol", icon: "☀️" },
  { label: "Roce", icon: "🧽" },
];

const PremiumQualitySection = () => {
  return (
    <section className="w-full bg-[var(--color-secondary)]/15 py-12">
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 text-center sm:px-6 lg:px-8">
        <div className="space-y-3">
          <p className="pill mx-auto w-fit bg-[var(--color-secondary)] text-white">
            Calidad
          </p>
          <h2 className="text-3xl font-semibold text-slate-900">
            Calidad premium
          </h2>
          <p className="text-slate-600">
            Nuestros calcos están hechos en vinilo premium con laca UV
            sectorizada y resisten el uso real del día a día.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {badges.map((badge) => (
            <span
              key={badge.label}
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[var(--color-primary)] shadow-sm"
            >
              <span aria-hidden="true">{badge.icon}</span>
              {badge.label}
            </span>
          ))}
        </div>

        <a
          href="https://www.instagram.com/reel/C0htV7hv1Q2/?igsh=MWoyZmtlY3V3M25uaA=="
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-full bg-[var(--color-primary)] px-7 py-2.5 !text-white text-sm font-semibold shadow-lg shadow-[rgba(1,34,161,0.35)] transition hover:-translate-y-0.5 hover:bg-[var(--color-primary-dark)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
        >
          Ver pruebas
        </a>
      </div>
    </section>
  );
};

export default PremiumQualitySection;
