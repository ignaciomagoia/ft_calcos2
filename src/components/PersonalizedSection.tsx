import Image from "next/image";
import Link from "next/link";

const bullets = ["Ideal para regalos", "Objetos personales"];

const PersonalizedSection = () => {
  return (
    <section className="w-full bg-[var(--color-secondary)]/10">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 pt-10 pb-6 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div className="space-y-6 text-slate-900">
          <div className="space-y-3">
            <p className="pill w-fit bg-white text-[var(--color-primary)]">
              Personalizados (por menor)
            </p>
            <h2 className="text-4xl font-semibold leading-tight">
              Personalizá lo que quieras
            </h2>
            <p className="text-lg text-slate-600">
              ¿Tenés una foto o un diseño?
              <br />
              Mandanos tu archivo y nosotros nos encargamos de todo lo demás.
            </p>
          </div>

          <ul className="space-y-3 text-base font-medium text-slate-700">
            {bullets.map((item) => (
              <li key={item} className="flex items-center gap-3">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-[var(--color-primary)]">
                  ✔
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <Link
            href="/personalizados"
            className="inline-flex items-center justify-center rounded-full bg-[var(--color-primary)] px-8 py-3 !text-white shadow-lg shadow-[rgba(1,34,161,0.35)] transition hover:-translate-y-0.5 hover:bg-[var(--color-primary-dark)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
          >
            Quiero personalizados
          </Link>
        </div>

        <div className="flex items-center justify-center">
          <div className="relative w-full max-w-md overflow-hidden rounded-[32px] border border-white/70 bg-white shadow-2xl">
            <Image
              src="/personalizadas.png"
              alt="Placeholder ilustrativo para personalizados"
              width={640}
              height={640}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default PersonalizedSection;
