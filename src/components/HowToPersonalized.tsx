type InfoCard = {
  icon: string;
  title: string;
  description: string;
};

const infoCards: InfoCard[] = [
  {
    icon: "🚚",
    title: "Envíos",
    description:
      "Envios a todo el país: a convenir por Correo Argentino\nEnvíos a Córdoba: a convenir por Uber Moto",
  },
  {
    icon: "💳",
    title: "Medios de pago",
    description: "Transferencia o efectivo según tu ubicación",
  },
  {
    icon: "📍",
    title: "Retiro",
    description: "Retiro por Nueva Córdoba en horario a convenir",
  },
  {
    icon: "⏰",
    title: "Tiempos de entrega",
    description: "De 7 a 10 días hábiles",
  },
];

const HowToPersonalized = () => {
  return (
    <section className="w-full bg-white px-4 pt-4 pb-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="space-y-3 text-center">
          <p className="pill mx-auto w-fit">Información útil</p>
          <h2 className="text-3xl font-semibold text-slate-900">
            Información útil
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {infoCards.map((card) => (
            <article
              key={card.title}
              className="card flex h-full items-start gap-4 rounded-3xl p-6"
            >
              <span
                aria-hidden="true"
                className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--color-secondary)]/20 text-2xl"
              >
                {card.icon}
              </span>
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-slate-900">
                  {card.title}
                </h3>
                <p className="whitespace-pre-line text-sm text-slate-600 sm:text-base">
                  {card.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowToPersonalized;
