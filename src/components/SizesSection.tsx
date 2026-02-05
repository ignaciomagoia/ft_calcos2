const sizes = [
  { label: "4 cm", desc: "celular, cargador" },
  { label: "6 cm", desc: "notebooks, termos y cuadernos" },
  { label: "10 cm", desc: "valijas, botellas y termos grandes" },
];

const SizesSection = () => {
  return (
    <section className="w-full bg-white py-12">
      <div className="mx-auto w-full max-w-6xl space-y-8 px-4 sm:px-6 lg:px-8">
        <div className="space-y-3">
          <p className="pill w-fit">Tamaños</p>
          <h2 className="text-3xl font-semibold text-slate-900">
            Conocé nuestros tamaños
          </h2>
          <p className="text-slate-600">
            Tenemos distintos tamaños para que los calcos se adapten a cada
            objeto.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sizes.map((size) => (
            <div
              key={size.label}
              className="card flex flex-col gap-3 rounded-3xl p-6"
            >
              <p className="text-3xl font-semibold text-[var(--color-primary)]">
                {size.label}
              </p>
              <p className="text-sm text-slate-600">{size.desc}</p>
            </div>
          ))}
        </div>

        <a
          href="https://www.instagram.com/reel/DMY17AqRFiV/?igsh=ZTJneWtjeWRpeGxt"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-full border border-slate-200 px-6 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
        >
          Ver ejemplos
        </a>
      </div>
    </section>
  );
};

export default SizesSection;
