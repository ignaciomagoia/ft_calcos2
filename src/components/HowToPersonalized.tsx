const steps = [
  "Nos escribís por WhatsApp",
  "Nos enviás tu imagen o logo",
  "Definimos tamaño, cantidad y vinilo",
  "Producimos y enviamos tu pedido",
];

const HowToPersonalized = () => {
  return (
    <section className="w-full bg-white px-4 pt-4 pb-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-10">
        <div className="space-y-3 text-center">
          <p className="pill mx-auto w-fit">Paso a paso</p>
          <h2 className="text-3xl font-semibold text-slate-900">
            ¿Cómo comprar tu personalizado?
          </h2>
          <p className="text-slate-600">
            Te acompañamos en todo el proceso para que tus calcos salgan
            perfectos.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <div
              key={step}
              className="card flex h-full flex-col gap-4 rounded-3xl p-6 text-left"
            >
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-secondary)]/20 text-2xl font-bold text-[var(--color-primary)]">
                {index + 1}
              </span>
              <p className="text-base font-semibold text-slate-900">{step}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowToPersonalized;
