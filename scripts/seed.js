/**
 * Script de semilla para crear datos iniciales en Firestore.
 * Uso: node scripts/seed.js
 * Requiere variables de entorno de Firebase y credenciales de admin.
 */

const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");

if (getApps().length === 0) {
  initializeApp({
    credential: cert(require("../serviceAccountKey.json")),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

const db = getFirestore();

async function seed() {
  const settingsRef = db.collection("settings").doc("main");
  await settingsRef.set(
    {
      empresa: {
        nombre: "Europa Models",
        descripcion:
          "Catálogo exclusivo de perfumes, ropa, relojes y accesorios.",
        telefono: "",
        correo: "",
        direccion: "",
        sitioWeb: "",
        redesSociales: { instagram: "", facebook: "", whatsapp: "" },
      },
      catalogo: {
        mostrarPrecio: true,
        mostrarStock: false,
        mostrarMarca: true,
        mostrarCategoria: true,
        productosPorPagina: 24,
        ordenDefault: "recientes",
      },
      cotizaciones: {
        prefijo: "COT",
        longitudNumeros: 6,
        mensajeAutomatico:
          "Hola, le comparto la cotización solicitada de Europa Models.",
        observacionesAutomaticas: "Cotización sujeta a disponibilidad.",
        validezDias: 7,
      },
      apariencia: {
        colorPrincipal: "#2563eb",
        colorSecundario: "#ffffff",
        modoOscuro: false,
      },
      inicio: {
        tituloPrincipal: "Descubre nuestro catálogo exclusivo",
        subtitulo:
          "Perfumes, ropa, relojes y accesorios seleccionados para ti.",
        textoBoton: "Ver catálogo",
        videoInicio: "",
        imagenRespaldo: "",
      },
      licenseStatus: "active",
      version: "1.0.0",
    },
    { merge: true },
  );
  console.log("Configuración inicial creada/actualizada.");

  const categories = [
    "Perfumes",
    "Ropa",
    "Zapatos",
    "Relojes",
    "Accesorios",
    "Bolsos",
  ];
  const existingCats = await db.collection("categories").get();
  const existingCatNames = new Set(
    existingCats.docs.map((d) => d.data().nombre),
  );
  let catIndex = existingCats.docs.length;
  for (const nombre of categories) {
    if (existingCatNames.has(nombre)) continue;
    await db.collection("categories").add({
      nombre,
      orden: ++catIndex,
      activo: true,
    });
  }
  console.log("Categorías iniciales creadas.");

  const brands = [
    "Dior",
    "Lattafa",
    "Versace",
    "Zara",
    "Carolina Herrera",
    "Paco Rabanne",
  ];
  const existingBrands = await db.collection("brands").get();
  const existingBrandNames = new Set(
    existingBrands.docs.map((d) => d.data().nombre),
  );
  let brandIndex = existingBrands.docs.length;
  for (const nombre of brands) {
    if (existingBrandNames.has(nombre)) continue;
    await db.collection("brands").add({
      nombre,
      orden: ++brandIndex,
      activo: true,
    });
  }
  console.log("Marcas iniciales creadas.");

  // Crear documentos de admin para usuarios existentes en Authentication
  const auth = getAuth();
  const list = await auth.listUsers(1000);
  for (const user of list.users) {
    const userRef = db.collection("users").doc(user.uid);
    const snap = await userRef.get();
    const adminPermissions = {
      productos: {
        crear: true,
        editar: true,
        eliminar: true,
        ocultar: true,
        cambiarPrecios: true,
        cambiarStock: true,
        subirImagenes: true,
      },
      categorias: {
        crear: true,
        editar: true,
        eliminar: true,
        cambiarOrden: true,
      },
      marcas: { crear: true, editar: true, eliminar: true },
      cotizaciones: {
        crear: true,
        verPropias: true,
        verTodas: true,
        eliminar: true,
        cambiarEstado: true,
      },
      usuarios: {
        invitar: true,
        editarPermisos: true,
        desactivar: true,
        eliminar: true,
      },
      configuracion: { editar: true },
    };

    if (!snap.exists) {
      await userRef.set({
        nombre:
          user.displayName || user.email?.split("@")[0] || "Administrador",
        correo: user.email || "",
        rol: "administrador",
        activo: true,
        cargo: "Administrador",
        fechaCreacion: user.metadata.creationTime || new Date().toISOString(),
        permisos: adminPermissions,
      });
      console.log(`Usuario admin creado para ${user.email}`);
    } else {
      await userRef.update({
        rol: "administrador",
        activo: true,
        permisos: adminPermissions,
      });
      console.log(`Permisos de admin actualizados para ${user.email}`);
    }
  }
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
