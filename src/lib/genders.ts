import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
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
  return { ...gender, id: docRef.id } as Gender;
}

export async function updateGender(
  id: string,
  data: Partial<Gender>,
): Promise<void> {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firebase Firestore no está configurado");
  const { id: _id, ...rest } = data as any;
  await updateDoc(doc(db, "genders", id), rest);
}

export async function deleteGender(id: string): Promise<void> {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firebase Firestore no está configurado");
  await deleteDoc(doc(db, "genders", id));
}
