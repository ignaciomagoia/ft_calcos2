## EFETE Calcos

MVP de e-commerce para vender calcos: catálogo, carrito con persistencia local y checkout vía WhatsApp. Incluye panel admin protegido con Supabase Auth + roles.

### Stack

- Next.js 14 App Router + TypeScript
- TailwindCSS 4
- Zustand para el carrito (localStorage)
- Supabase (Auth, Postgres y Storage bucket `products`)

### Features principales

- **Público**: home con hero y categorías, listado por categoría `/c/[slug]`, ficha `/p/[id]`, carrito `/cart` con subtotal/total y link `wa.me` con mensaje armado (items, total, texto “Pago por transferencia, coordinamos por WhatsApp”, alias configurable).
- **Carrito**: store zustand persistido en `localStorage`, acciones `addItem`, `removeItem`, `setQty`, `clear`.
- **Admin**: `/admin` muestra login Supabase si no hay sesión y bloquea la ruta si `role != 'admin'` (middleware + chequeo server). CRUD de categorías y productos, subida de imagen al bucket `products`, toggle de estado, logout.
- **Supabase**: scripts SQL para tablas, triggers, RLS y storage policies (ver carpeta `supabase/`).

---

## 1. Variables de entorno

Crea `.env.local` (basado en `.env.example`):

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_WHATSAPP_NUMBER=WHATSAPP_NUMBER
NEXT_PUBLIC_TRANSFER_ALIAS=TRANSFER_ALIAS
```

> `NEXT_PUBLIC_WHATSAPP_NUMBER`: sin `+`, solo números.  
> `NEXT_PUBLIC_TRANSFER_ALIAS`: alias/CBU que aparecerá en el mensaje.

---

## 2. Setup de Supabase

1. Crea un nuevo proyecto y copia URL + anon key a `.env.local`.
2. Ejecuta los scripts en el orden indicado (desde el SQL Editor):
   - `supabase/schema.sql`
   - `supabase/policies.sql`
   - `supabase/storage-policies.sql`
3. Bucket `products` queda público para lectura; solo el rol `admin` puede subir/borrar.
4. Crea tu primer usuario (email/password) y actualiza su rol:
   ```sql
   update public.profiles set role = 'admin' where id = '<auth-user-uuid>';
   ```
5. Opcional: precarga categorías/productos directamente con el dashboard o SQL.

---

## 3. Correr localmente

### Con npm

```bash
npm install
npm run dev
```

### Con pnpm (opcional)

```bash
pnpm install
pnpm dev
```

La app vive en `http://localhost:3000`. Páginas clave:

- `/` Home + categorías
- `/c/[slug]` Catálogo por categoría
- `/p/[id]` Ficha de producto
- `/cart` Carrito y checkout WhatsApp
- `/admin` Login + panel (solo rol `admin`)

Scripts útiles:

- `npm run dev` → desarrollo
- `npm run build` → build de producción
- `npm run start` → servidor sobre `.next`
- `npm run lint` → ESLint (actualmente falla por un bug conocido en `eslint@9` sobre Windows, ver nota en el PR si persiste)

---

## 4. Deploy en Vercel

1. `vercel init` o conecta el repo desde el dashboard de Vercel.
2. Configura las variables de entorno en Vercel (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_WHATSAPP_NUMBER`, `NEXT_PUBLIC_TRANSFER_ALIAS`).
3. Crea el bucket `products` en Supabase y asegúrate de correr los scripts de RLS/Storage en el proyecto de producción.
4. En la sección “Storage” de Supabase, habilita la CDN pública si vas a servir imágenes.
5. Deploy (`vercel --prod` o desde la UI). Las rutas protegidas usan Supabase Auth, así que asegurate de que el dominio esté configurado como redirect en Supabase (`Authentication > URL Configuration`).

---

## 5. Flujo de trabajo

1. Admin carga categorías/productos en `/admin`.
2. Usuarios navegan el catálogo, agregan productos y confirman por WhatsApp (mensaje armado automáticamente).
3. Se acuerda transferencia usando el alias configurado.

Listo para iterar: solo faltaría conectar pasarelas de pago o métricas si se necesitara.
