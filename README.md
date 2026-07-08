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

## Desplegar en Vercel

```bash
npm run build
# Sube el proyecto a GitHub y conecta el repositorio en Vercel.
# Configura las variables de entorno en el dashboard de Vercel.
```

## Licencia

Sistema controlado mediante el campo `licenseStatus` en `settings/main` de Firestore.
