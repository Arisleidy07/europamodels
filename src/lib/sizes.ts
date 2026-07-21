import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import { getSizes, saveSizes } from "@/lib/localDb";
import type { Size } from "@/types";

export async function createSize(size: Omit<Size, "id">): Promise<Size> {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firebase Firestore no está configurado");
  const docRef = await addDoc(collection(db, "sizes"), {
    ...size,
    fechaCreacion: serverTimestamp(),
  });
  const created = { ...size, id: docRef.id } as Size;
  const local = await getSizes();
  await saveSizes([...local.filter((item) => item.id !== created.id), created]);
  return created;
}

export async function updateSize(
  id: string,
  data: Partial<Size>,
): Promise<void> {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firebase Firestore no está configurado");
  const { id: _id, ...rest } = data as any;
  await updateDoc(doc(db, "sizes", id), rest);
  const local = await getSizes();
  await saveSizes(
    local.map((item) => (item.id === id ? { ...item, ...rest, id } : item)),
  );
}

export async function deleteSize(id: string): Promise<void> {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firebase Firestore no está configurado");
  await deleteDoc(doc(db, "sizes", id));
  const local = await getSizes();
  await saveSizes(local.filter((item) => item.id !== id));
}
