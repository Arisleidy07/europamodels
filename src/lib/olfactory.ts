import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { getFirebaseDb, getFirebaseStorage } from "@/lib/firebase";
import {
  getOlfactoryNotes as getCachedOlfactoryNotes,
  saveOlfactoryNotes,
} from "@/lib/localDb";
import type { OlfactoryNote, OlfactoryCategory } from "@/types";

export async function getOlfactoryNotes(): Promise<OlfactoryNote[]> {
  const cached = await getCachedOlfactoryNotes();
  if (typeof navigator !== "undefined" && !navigator.onLine) return cached;

  const db = getFirebaseDb();
  if (!db) return cached;
  try {
    const snap = await getDocs(collection(db, "olfactoryNotes"));
    const notes = snap.docs.map((d) => ({
      ...(d.data() as Omit<OlfactoryNote, "id">),
      id: d.id,
    }));
    await saveOlfactoryNotes(notes);
    return notes;
  } catch {
    return cached;
  }
}

export async function getOlfactoryNotesByCategory(
  categoria: OlfactoryCategory,
): Promise<OlfactoryNote[]> {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firebase Firestore no está configurado");
  const q = query(
    collection(db, "olfactoryNotes"),
    where("categoria", "==", categoria),
  );
  try {
    const snap = await getDocs(q);
    const notes = snap.docs.map((d) => ({
      ...(d.data() as Omit<OlfactoryNote, "id">),
      id: d.id,
    }));
    const cached = await getCachedOlfactoryNotes();
    const otherCategories = cached.filter(
      (note) => note.categoria !== categoria,
    );
    await saveOlfactoryNotes([...otherCategories, ...notes]);
    return notes;
  } catch {
    const cached = await getCachedOlfactoryNotes();
    return cached.filter((note) => note.categoria === categoria);
  }
}

export async function createOlfactoryNote(
  data: Omit<OlfactoryNote, "id" | "fechaCreacion">,
): Promise<OlfactoryNote> {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firebase Firestore no está configurado");
  const fechaCreacion = new Date().toISOString();
  const docRef = await addDoc(collection(db, "olfactoryNotes"), {
    ...data,
    fechaCreacion,
  });
  const created = { ...data, id: docRef.id, fechaCreacion };
  const cached = await getCachedOlfactoryNotes();
  await saveOlfactoryNotes([
    ...cached.filter((note) => note.id !== created.id),
    created,
  ]);
  return created;
}

export async function updateOlfactoryNote(
  id: string,
  data: Partial<OlfactoryNote>,
): Promise<void> {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firebase Firestore no está configurado");
  await updateDoc(doc(db, "olfactoryNotes", id), data);
  const cached = await getCachedOlfactoryNotes();
  await saveOlfactoryNotes(
    cached.map((note) => (note.id === id ? { ...note, ...data, id } : note)),
  );
}

export async function deleteOlfactoryNote(id: string): Promise<void> {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firebase Firestore no está configurado");
  await deleteDoc(doc(db, "olfactoryNotes", id));
  const cached = await getCachedOlfactoryNotes();
  await saveOlfactoryNotes(cached.filter((note) => note.id !== id));
}

export async function uploadOlfactoryImage(
  file: File,
  noteId: string,
): Promise<string> {
  const storage = getFirebaseStorage();
  if (!storage) throw new Error("Firebase Storage no está configurado");
  const ext = file.name.split(".").pop() || "png";
  const storageRef = ref(storage, `olfactory/${noteId}.${ext}`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

export async function deleteOlfactoryImage(url: string): Promise<void> {
  if (!url || !url.startsWith("http")) return;
  const storage = getFirebaseStorage();
  if (!storage) return;
  try {
    const storageRef = ref(storage, url);
    await deleteObject(storageRef);
  } catch {}
}

// Normalize text for smart search: lowercase, remove ALL diacritics, collapse spaces
export function normalizeSearch(text: string): string {
  if (!text) return "";
  return text
    .normalize("NFD") // decompose accented chars: á → a + ́
    .replace(/[\u0300-\u036f]/g, "") // strip all combining diacritical marks (accents, tildes, etc.)
    .toLowerCase() // lowercase after stripping so ñ→n works correctly
    .replace(/[^a-z0-9 ]/g, " ") // replace any remaining non-alphanumeric (ñ, ü, etc.) with space
    .replace(/\s+/g, " ")
    .trim();
}

// Remove duplicate olfactory notes (same nombre+categoria), keeping the first occurrence
export async function deduplicateOlfactoryNotes(): Promise<number> {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firebase Firestore no está configurado");
  const notes = await getOlfactoryNotes();
  const seen = new Map<string, string>();
  let deleted = 0;
  for (const note of notes) {
    const key = `${normalizeSearch(note.nombre)}__${note.categoria}`;
    if (seen.has(key)) {
      await deleteDoc(doc(db, "olfactoryNotes", note.id));
      deleted++;
    } else {
      seen.set(key, note.id);
    }
  }
  return deleted;
}

const n = (nombre: string, categoria: OlfactoryCategory) => ({
  nombre,
  imagen: "",
  categoria,
  activo: true,
});

export const INITIAL_OLFACTORY_DATA: Omit<
  OlfactoryNote,
  "id" | "fechaCreacion"
>[] = [
  // ═══════════════════════════════════════════
  // ACORDES PRINCIPALES
  // ═══════════════════════════════════════════
  n("Cítrico", "acordes"),
  n("Amaderado", "acordes"),
  n("Aromático", "acordes"),
  n("Ámbar", "acordes"),
  n("Almizclado", "acordes"),
  n("Dulce", "acordes"),
  n("Fresco", "acordes"),
  n("Floral", "acordes"),
  n("Cálido especiado", "acordes"),
  n("Especiado", "acordes"),
  n("Atalcado", "acordes"),
  n("Cuero", "acordes"),
  n("Oud", "acordes"),
  n("Ahumado", "acordes"),
  n("Acuático", "acordes"),
  n("Afrutado", "acordes"),
  n("Verde", "acordes"),
  n("Avainillado", "acordes"),
  n("Oriental", "acordes"),
  n("Gourmand", "acordes"),
  n("Balsámico", "acordes"),
  n("Resinoso", "acordes"),
  n("Terroso", "acordes"),
  n("Mineral", "acordes"),
  n("Ozónico", "acordes"),
  n("Fougère", "acordes"),
  n("Chipre", "acordes"),
  n("Animalico", "acordes"),
  n("Marino", "acordes"),
  n("Tropical", "acordes"),
  n("Herbal", "acordes"),
  n("Musgoso", "acordes"),
  n("Frutal", "acordes"),
  n("Amaderado suave", "acordes"),
  n("Amaderado seco", "acordes"),
  n("Cítrico aromático", "acordes"),
  n("Floral frutal", "acordes"),
  n("Floral amaderado", "acordes"),
  n("Floral oriental", "acordes"),
  n("Oriental amaderado", "acordes"),
  n("Oriental floral", "acordes"),
  n("Chipre frutal", "acordes"),
  n("Chipre floral", "acordes"),
  n("Aromático fougère", "acordes"),
  n("Cítrico marino", "acordes"),
  n("Especiado amaderado", "acordes"),
  n("Suave polvoriento", "acordes"),
  n("Cremoso", "acordes"),
  n("Cítrico especiado", "acordes"),
  n("Fresco especiado", "acordes"),
  n("Frutal floral", "acordes"),
  n("Amaderado aromático", "acordes"),
  n("Dulce frutal", "acordes"),
  n("Cálido amaderado", "acordes"),
  n("Terroso musgoso", "acordes"),
  n("Ahumado amaderado", "acordes"),
  n("Suave floral", "acordes"),
  n("Acuático marino", "acordes"),
  n("Acuático fresco", "acordes"),

  // ═══════════════════════════════════════════
  // NOTAS DE SALIDA
  // ═══════════════════════════════════════════
  n("Bergamota", "notasSalida"),
  n("Limón", "notasSalida"),
  n("Toronja", "notasSalida"),
  n("Mandarina", "notasSalida"),
  n("Naranja", "notasSalida"),
  n("Naranja amarga", "notasSalida"),
  n("Lima", "notasSalida"),
  n("Yuzu", "notasSalida"),
  n("Pomelo", "notasSalida"),
  n("Cidra", "notasSalida"),
  n("Piña", "notasSalida"),
  n("Manzana", "notasSalida"),
  n("Manzana verde", "notasSalida"),
  n("Pera", "notasSalida"),
  n("Frambuesa", "notasSalida"),
  n("Grosella negra", "notasSalida"),
  n("Lichi", "notasSalida"),
  n("Mango", "notasSalida"),
  n("Durazno", "notasSalida"),
  n("Ciruela", "notasSalida"),
  n("Melón", "notasSalida"),
  n("Sandía", "notasSalida"),
  n("Maracuyá", "notasSalida"),
  n("Menta", "notasSalida"),
  n("Hierbabuena", "notasSalida"),
  n("Eucalipto", "notasSalida"),
  n("Lavanda", "notasSalida"),
  n("Albahaca", "notasSalida"),
  n("Estragón", "notasSalida"),
  n("Pimienta rosa", "notasSalida"),
  n("Pimienta negra", "notasSalida"),
  n("Cardamomo", "notasSalida"),
  n("Jengibre", "notasSalida"),
  n("Azafrán", "notasSalida"),
  n("Aldehídos", "notasSalida"),
  n("Ozono", "notasSalida"),
  n("Notas acuáticas", "notasSalida"),
  n("Lemongrass", "notasSalida"),
  n("Hinojo", "notasSalida"),
  n("Ajenjo", "notasSalida"),
  n("Té verde", "notasSalida"),
  n("Pomelo rosado", "notasSalida"),
  n("Clementina", "notasSalida"),
  n("Kumquat", "notasSalida"),
  n("Verbena", "notasSalida"),
  n("Petitgrain", "notasSalida"),
  n("Neroli (salida)", "notasSalida"),
  n("Galbano", "notasSalida"),
  n("Violeta (hoja)", "notasSalida"),
  n("Menta piperita", "notasSalida"),
  n("Menta acuática", "notasSalida"),
  n("Romero", "notasSalida"),
  n("Anís", "notasSalida"),
  n("Comino", "notasSalida"),
  n("Pimienta blanca", "notasSalida"),
  n("Nuez moscada (salida)", "notasSalida"),
  n("Cedro (salida)", "notasSalida"),
  n("Alcaravea", "notasSalida"),
  n("Enebro", "notasSalida"),
  n("Bayas de enebro", "notasSalida"),
  n("Tamarindo", "notasSalida"),
  n("Guayaba", "notasSalida"),
  n("Papaya", "notasSalida"),
  n("Kiwi", "notasSalida"),
  n("Cereza", "notasSalida"),
  n("Arándano", "notasSalida"),
  n("Mora", "notasSalida"),
  n("Fresa", "notasSalida"),
  n("Casis", "notasSalida"),
  n("Albaricoque", "notasSalida"),
  n("Melocotón", "notasSalida"),
  n("Flor de tilo", "notasSalida"),
  n("Citronela", "notasSalida"),
  n("Agua de mar", "notasSalida"),

  // ═══════════════════════════════════════════
  // NOTAS DE CORAZÓN
  // ═══════════════════════════════════════════
  n("Rosa", "notasCorazon"),
  n("Rosa búlgara", "notasCorazon"),
  n("Rosa de mayo", "notasCorazon"),
  n("Jazmín", "notasCorazon"),
  n("Jazmín sambac", "notasCorazon"),
  n("Flor de azahar", "notasCorazon"),
  n("Neroli", "notasCorazon"),
  n("Ylang-ylang", "notasCorazon"),
  n("Magnolia", "notasCorazon"),
  n("Iris", "notasCorazon"),
  n("Violeta", "notasCorazon"),
  n("Geranio", "notasCorazon"),
  n("Peonía", "notasCorazon"),
  n("Orquídea", "notasCorazon"),
  n("Lirio", "notasCorazon"),
  n("Lirio del valle", "notasCorazon"),
  n("Lila", "notasCorazon"),
  n("Gardenia", "notasCorazon"),
  n("Tuberosa", "notasCorazon"),
  n("Heliotropo", "notasCorazon"),
  n("Mimosa", "notasCorazon"),
  n("Osmanthus", "notasCorazon"),
  n("Fresia", "notasCorazon"),
  n("Flor de loto", "notasCorazon"),
  n("Flor de cerezo", "notasCorazon"),
  n("Clavel", "notasCorazon"),
  n("Nardo", "notasCorazon"),
  n("Canela", "notasCorazon"),
  n("Nuez moscada", "notasCorazon"),
  n("Clavo", "notasCorazon"),
  n("Coco", "notasCorazon"),
  n("Miel", "notasCorazon"),
  n("Almendra", "notasCorazon"),
  n("Flor de naranjo", "notasCorazon"),
  n("Té negro", "notasCorazon"),
  n("Té blanco", "notasCorazon"),
  n("Mate", "notasCorazon"),
  n("Romero", "notasCorazon"),
  n("Salvia", "notasCorazon"),
  n("Tomillo", "notasCorazon"),
  n("Davana", "notasCorazon"),
  n("Ciruela umami", "notasCorazon"),
  n("Pimienta de Sichuan", "notasCorazon"),
  n("Absoluto de rosa", "notasCorazon"),
  n("Flor de tiaré", "notasCorazon"),
  n("Jazmín absoluto", "notasCorazon"),
  n("Iris root", "notasCorazon"),
  n("Orris", "notasCorazon"),
  n("Narciso", "notasCorazon"),
  n("Jacinto", "notasCorazon"),
  n("Azucena", "notasCorazon"),
  n("Flor de jengibre", "notasCorazon"),
  n("Flor de hibisco", "notasCorazon"),
  n("Flor de pasión", "notasCorazon"),
  n("Flor de manzano", "notasCorazon"),
  n("Absoluto de jazmín", "notasCorazon"),
  n("Pimienta rosa (corazón)", "notasCorazon"),
  n("Cardamomo (corazón)", "notasCorazon"),
  n("Hoja de violeta", "notasCorazon"),
  n("Hoja de violeta absoluta", "notasCorazon"),
  n("Rosa damascena", "notasCorazon"),
  n("Rosa centifolia", "notasCorazon"),
  n("Azafrán (corazón)", "notasCorazon"),
  n("Bergamota (corazón)", "notasCorazon"),
  n("Lavanda (corazón)", "notasCorazon"),
  n("Pachulí (corazón)", "notasCorazon"),
  n("Cedro (corazón)", "notasCorazon"),
  n("Vetiver (corazón)", "notasCorazon"),
  n("Madera de cedro", "notasCorazon"),
  n("Flor de vainilla", "notasCorazon"),
  n("Reseda", "notasCorazon"),
  n("Camomila", "notasCorazon"),
  n("Capuchina", "notasCorazon"),
  n("Muguet", "notasCorazon"),
  n("Violeta de Parma", "notasCorazon"),
  n("Flor de acacia", "notasCorazon"),
  n("Cacao (corazón)", "notasCorazon"),
  n("Tabaco (corazón)", "notasCorazon"),

  // ═══════════════════════════════════════════
  // NOTAS DE FONDO
  // ═══════════════════════════════════════════
  n("Vainilla", "notasFondo"),
  n("Vainilla de Madagascar", "notasFondo"),
  n("Ámbar", "notasFondo"),
  n("Ámbar gris", "notasFondo"),
  n("Cedro", "notasFondo"),
  n("Cedro del Atlas", "notasFondo"),
  n("Cedro de Virginia", "notasFondo"),
  n("Sándalo", "notasFondo"),
  n("Sándalo australiano", "notasFondo"),
  n("Pachulí", "notasFondo"),
  n("Vetiver", "notasFondo"),
  n("Almizcle", "notasFondo"),
  n("Almizcle blanco", "notasFondo"),
  n("Incienso", "notasFondo"),
  n("Olíbano", "notasFondo"),
  n("Mirra", "notasFondo"),
  n("Café", "notasFondo"),
  n("Cacao", "notasFondo"),
  n("Chocolate", "notasFondo"),
  n("Cuero", "notasFondo"),
  n("Tabaco", "notasFondo"),
  n("Haba tonka", "notasFondo"),
  n("Musgo", "notasFondo"),
  n("Musgo de roble", "notasFondo"),
  n("Caramelo", "notasFondo"),
  n("Toffee", "notasFondo"),
  n("Pralinado", "notasFondo"),
  n("Benjuí", "notasFondo"),
  n("Labdanum", "notasFondo"),
  n("Oud", "notasFondo"),
  n("Gaiac", "notasFondo"),
  n("Palo santo", "notasFondo"),
  n("Abedul", "notasFondo"),
  n("Ciprés", "notasFondo"),
  n("Pino", "notasFondo"),
  n("Cachemira", "notasFondo"),
  n("Ámbar solar", "notasFondo"),
  n("Castoreum", "notasFondo"),
  n("Civeta", "notasFondo"),
  n("Resina", "notasFondo"),
  n("Copal", "notasFondo"),
  n("Styrax", "notasFondo"),
  n("Heno", "notasFondo"),
  n("Madera de teca", "notasFondo"),
  n("Madera flotante", "notasFondo"),
  n("Sándalo de Mysore", "notasFondo"),
  n("Sándalo de Hawái", "notasFondo"),
  n("Madera de cachemira", "notasFondo"),
  n("Madera de cedro (fondo)", "notasFondo"),
  n("Madera de sándalo", "notasFondo"),
  n("Almizcle animal", "notasFondo"),
  n("Almizcle ambrette", "notasFondo"),
  n("Almizcle de cachemira", "notasFondo"),
  n("Almizcle suave", "notasFondo"),
  n("Almizcle madera", "notasFondo"),
  n("Almizcle limpio", "notasFondo"),
  n("Almizcle solar", "notasFondo"),
  n("Ámbar cálido", "notasFondo"),
  n("Ámbar oriental", "notasFondo"),
  n("Oud ahumado", "notasFondo"),
  n("Oud rose", "notasFondo"),
  n("Vetiver ahumado", "notasFondo"),
  n("Vetiver de Haití", "notasFondo"),
  n("Vetiver de Java", "notasFondo"),
  n("Pachulí oscuro", "notasFondo"),
  n("Pachulí suave", "notasFondo"),
  n("Vainilla bourbon", "notasFondo"),
  n("Vainilla tahitiana", "notasFondo"),
  n("Azúcar", "notasFondo"),
  n("Miel oscura", "notasFondo"),
  n("Cera de abeja", "notasFondo"),
  n("Cuero ruso", "notasFondo"),
  n("Suede", "notasFondo"),
  n("Tabaco rubio", "notasFondo"),
  n("Tabaco virginia", "notasFondo"),
  n("Madera de guayaco", "notasFondo"),
  n("Madera de ébano", "notasFondo"),
  n("Mirra oscura", "notasFondo"),
  n("Incienso de iglesia", "notasFondo"),
  n("Resina de benzoína", "notasFondo"),
  n("Olíbano carterii", "notasFondo"),
  n("Tierra mojada", "notasFondo"),
  n("Musgo húmedo", "notasFondo"),
  n("Musgo marino", "notasFondo"),
  n("Civet sintético", "notasFondo"),
  n("Aroma de madera quemada", "notasFondo"),
  n("Cedro rojo", "notasFondo"),
  n("Roble", "notasFondo"),
  n("Madera de agar", "notasFondo"),
];
