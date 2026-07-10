import {
  collection,
  doc,
  getDocs,
  query,
  orderBy,
  limit,
  where,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import { getQuotes, saveQuotes, addSyncQueueItem } from "@/lib/localDb";
import { generateQuoteCode, generateId } from "@/lib/utils";
import type { Quote, CartItem, QuoteClient, AppSettings } from "@/types";

export async function createQuote(
  cart: CartItem[],
  client: QuoteClient,
  userId: string,
  settings: AppSettings,
  online: boolean,
): Promise<Quote> {
  const subtotal = cart.reduce(
    (sum, item) => sum + item.precio * item.cantidad,
    0,
  );
  const total = subtotal;

  const lastCode = await getLastQuoteCode(settings.cotizaciones.prefijo);
  const nextNumber = (lastCode?.number || 0) + 1;
  const code = generateQuoteCode(
    settings.cotizaciones.prefijo,
    nextNumber,
    settings.cotizaciones.longitudNumeros,
  );

  const quote: Quote = {
    id: generateId(),
    codigo: code,
    cliente: client,
    productos: cart.map((item) => ({
      productoId: item.productoId,
      nombre: item.nombre,
      imagen: item.imagen,
      cantidad: item.cantidad,
      precio: item.precio,
      subtotal: item.precio * item.cantidad,
    })),
    subtotal,
    total,
    creadoPor: userId,
    estado: "creada",
    fechaCreacion: new Date().toISOString(),
    observaciones: settings.cotizaciones.observacionesAutomaticas,
  };

  const localQuotes = await getQuotes();
  await saveQuotes([...localQuotes, quote]);

  const firestore = getFirebaseDb();
  if (online && firestore) {
    try {
      await setDoc(doc(firestore, "quotes", quote.id), {
        ...quote,
        createdAt: serverTimestamp(),
      });
    } catch {
      await addSyncQueueItem({
        id: generateId(),
        tipo: "crearCotizacion",
        datos: quote,
        fecha: new Date().toISOString(),
        estado: "pendiente",
        intentos: 0,
      });
    }
  } else {
    await addSyncQueueItem({
      id: generateId(),
      tipo: "crearCotizacion",
      datos: quote,
      fecha: new Date().toISOString(),
      estado: "pendiente",
      intentos: 0,
    });
  }

  return quote;
}

async function getLastQuoteCode(
  prefix: string,
): Promise<{ number: number } | null> {
  const firestore = getFirebaseDb();
  if (!firestore) return null;
  try {
    const q = query(
      collection(firestore, "quotes"),
      orderBy("fechaCreacion", "desc"),
      limit(1),
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const last = snap.docs[0].data() as Quote;
      const parts = last.codigo.split("-");
      const num = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(num)) return { number: num };
    }
  } catch {
    // offline fallback
  }

  const localQuotes = await getQuotes();
  const sorted = localQuotes.sort(
    (a, b) =>
      new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime(),
  );
  if (sorted.length > 0) {
    const parts = sorted[0].codigo.split("-");
    const num = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(num)) return { number: num };
  }
  return null;
}

export async function getQuoteByCode(code: string): Promise<Quote | null> {
  const local = await getQuotes();
  const found = local.find(
    (q) => q.codigo.toLowerCase() === code.toLowerCase(),
  );
  if (found) return found;

  // Fallback: query Firestore
  const firestore = getFirebaseDb();
  if (!firestore) return null;
  try {
    const q = query(
      collection(firestore, "quotes"),
      where("codigo", "==", code.toUpperCase()),
      limit(1),
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      return { id: snap.docs[0].id, ...snap.docs[0].data() } as Quote;
    }
  } catch {}
  return null;
}
