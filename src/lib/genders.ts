import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import { getGenders, saveGenders } from "@/lib/localDb";
import type { Gender } from "@/types";

export async function createGender(
  gender: Omit<Gender, "id">,
): Promise<Gender> {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firebase Firestore no está configurado");
  const docRef = await addDoc(collection(db, "genders"), {
    ...gender,
    fechaCreacion: serverTimestamp(),
  });
  const created = { ...gender, id: docRef.id } as Gender;
  const local = await getGenders();
  await saveGenders([
    ...local.filter((item) => item.id !== created.id),
    created,
  ]);
  return created;
}

export async function updateGender(
  id: string,
  data: Partial<Gender>,
): Promise<void> {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firebase Firestore no está configurado");
  const { id: _id, ...rest } = data as any;
  await updateDoc(doc(db, "genders", id), rest);
  const local = await getGenders();
  await saveGenders(
    local.map((item) => (item.id === id ? { ...item, ...rest, id } : item)),
  );
}

export async function deleteGender(id: string): Promise<void> {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firebase Firestore no está configurado");
  await deleteDoc(doc(db, "genders", id));
  const local = await getGenders();
  await saveGenders(local.filter((item) => item.id !== id));
}
