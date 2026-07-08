# Europa Models — Catálogo Offline para Equipos de Ventas

Aplicación PWA desarrollada con Next.js, TypeScript, Tailwind CSS, Firebase y PWA.

## Características principales

- Pantalla de inicio con video / imagen editable.
- Catálogo de productos con búsqueda inteligente en tiempo real.
- Filtros por categoría, subcategoría, marca y disponibilidad.
- Vista detallada del producto con galería.
- Carrito de selección para cotizaciones.
- Generación de cotizaciones con código único y compartir nativo (Web Share API).
- Página pública de cotización solo lectura.
- Panel administrativo para productos, categorías, marcas, equipo y configuración.
- Autenticación y permisos por usuario.
- Funcionamiento offline con IndexedDB y persistencia de Firestore.
- Sistema de licencia controlado desde Firestore.

## Tecnologías

- Next.js 15 App Router
- React 19 + TypeScript
- Tailwind CSS
- Framer Motion
- Firebase Auth, Firestore y Storage
- IndexedDB (idb)
- next-pwa / Workbox

## Configuración

1. Crea un proyecto en Firebase.
2. Habilita Authentication (correo/contraseña), Firestore y Storage.
3. Copia las variables del proyecto en un archivo `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

4. En Firestore crea el documento `settings/main` con la estructura definida en `src/types/index.ts`.

## Ejecutar localmente

```bash
npm install
npm run icons
npm run dev
```

## Datos iniciales (seed)

Opcional: para crear configuración, categorías y marcas de ejemplo:

1. Descarga la clave de servicio de Firebase (`serviceAccountKey.json`) y colócala en la raíz del proyecto.
2. Ejecuta:

```bash
node scripts/seed.js
```

## Seguridad en Firestore

Sube las reglas de seguridad incluidas en `firestore.rules` a Firebase Console > Firestore Database > Reglas.

## Desplegar en Vercel

1. Crea un repositorio en GitHub y sube el código:

```bash
git remote add origin https://github.com/TU_USUARIO/europa-models.git
git push -u origin main
```

2. En Vercel, conecta el repositorio y configura las variables de entorno (mismas de `.env.local`).
3. Vercel ejecutará `npm install && npm run icons && npm run build` automáticamente.

O despliega manualmente con Vercel CLI:

```bash
vercel login
vercel --prod
```

## Licencia

Sistema controlado mediante el campo `licenseStatus` en `settings/main` de Firestore. Valores: `active` o `suspended`.
