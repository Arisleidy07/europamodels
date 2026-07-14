import {
  collection,
  doc,
  updateDoc,
  deleteDoc,
  getDocs,
  setDoc,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import type { AppUser } from "@/types";

export async function getUsers(): Promise<AppUser[]> {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firebase Firestore no está configurado");
  const snap = await getDocs(collection(db, "users"));
  return snap.docs.map((d) => ({
    ...(d.data() as Omit<AppUser, "id">),
    id: d.id,
  }));
}

export async function updateUser(
  id: string,
  data: Partial<AppUser>,
): Promise<void> {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firebase Firestore no está configurado");
  await updateDoc(doc(db, "users", id), data);
}

export async function deleteUser(id: string): Promise<void> {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firebase Firestore no está configurado");
  await deleteDoc(doc(db, "users", id));
}

export async function updateSettings(
  data: Record<string, unknown>,
): Promise<void> {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firebase Firestore no está configurado");
  await setDoc(doc(db, "settings", "main"), data, { merge: true });
}
