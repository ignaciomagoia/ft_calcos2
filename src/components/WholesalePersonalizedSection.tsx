import Image from "next/image";

const WHOLESALE_MESSAGE = encodeURIComponent(
  "Hola! Quiero pedir cotización por calcos personalizados por mayor. Mi marca es __, cantidad __, tamaño __, vinilo __."
);

const bullets = [
  "Vinilo premium",
  "Precios mayoristas",
  "Acompañamiento en el proceso",
  "Elegís el tipo de vinilo",
];

const WholesalePersonalizedSection = () => {
  return (
    <section className="w-full bg-[var(--color-secondary)]/10">
      <div className="mx-auto max-w-6xl px-4 pt-6 pb-4 sm:px-6 lg:px-8">
        <div className="card grid gap-10 rounded-[32px] p-8 lg:grid-cols-2 lg:p-10">
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="pill w-fit bg-[var(--color-secondary)] text-white">
                5. PERSONALIZADOS POR MAYOR
              </p>
              <h3 className="text-3xl font-semibold leading-tight text-slate-900">
                Calcos personalizados para potenciar tu marca o emprendimiento
              </h3>
              <p className="text-base text-slate-600">
                Hacemos calcos pensados para tu marca: buena calidad, excelente
                terminación y tiradas chicas posibles. Ideal para packaging,
                promos y regalos de marca.
              </p>
            </div>

            <ul className="grid gap-3 text-sm font-medium text-slate-700 sm:grid-cols-2">
              {bullets.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-accent)] text-[var(--color-primary)]">
                    ✔
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <a
              href={`https://wa.me/5493516183951?text=${WHOLESALE_MESSAGE}`}
              className="inline-flex items-center justify-center rounded-full bg-[var(--color-primary)] px-8 py-3 !text-white shadow-lg shadow-[rgba(1,34,161,0.35)] transition hover:-translate-y-0.5 hover:bg-[var(--color-primary-dark)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              Pedir cotización por WhatsApp
            </a>
          </div>

          <div className="flex items-center justify-center">
            <div className="relative w-full max-w-md overflow-hidden rounded-[32px] border border-slate-100 bg-white shadow-xl">
              <Image
                src="/personalizadasmarca.png"
                alt="Placeholder para personalizados por mayor"
                width={640}
                height={640}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WholesalePersonalizedSection;
