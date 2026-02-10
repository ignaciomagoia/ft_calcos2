import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const createSupabaseServerClient = async () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Faltan las variables NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      async setAll(cookiesToSet) {
        // In Server Components cookies are read-only.
        // Middleware/route handlers own refresh/write flows.
        try {
          for (const cookie of cookiesToSet) {
            await cookieStore.set(cookie.name, cookie.value, cookie.options);
          }
        } catch {
          // Ignore write attempts during RSC rendering.
        }
      },
    },
  });
};
