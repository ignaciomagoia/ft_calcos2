"use client";

import { FormEvent, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";

export const LoginForm = () => {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage("Login correcto. Recargá si la página no se actualiza.");
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="card space-y-6 rounded-3xl p-6">
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-semibold text-slate-600"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-400 focus:outline-none"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-semibold text-slate-600"
        >
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-400 focus:outline-none"
        />
      </div>

      <button
        type="submit"
        className="w-full rounded-full bg-[var(--color-primary)] px-6 py-3 text-white transition hover:bg-[var(--color-primary-dark)] disabled:opacity-60"
        disabled={loading}
      >
        {loading ? "Ingresando..." : "Entrar"}
      </button>

      {error && <p className="text-sm text-rose-600">{error}</p>}
      {message && <p className="text-sm text-emerald-600">{message}</p>}
      <p className="text-xs text-slate-500">
        El primer usuario creado se debe marcar como <strong>admin</strong> en la
        tabla <code>profiles</code>.
      </p>
    </form>
  );
};
