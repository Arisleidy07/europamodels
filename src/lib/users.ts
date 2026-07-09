import {
  collection,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  getDocs,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import type { AppUser, UserPermissions } from "@/types";

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

export async function createInvitation(invitation: {
  correo: string;
  nombre: string;
  cargo?: string;
  permisos: UserPermissions;
  creadoPor: string;
}): Promise<string> {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firebase Firestore no está configurado");
  const token =
    Math.random().toString(36).substring(2) + Date.now().toString(36);
  const docRef = await addDoc(collection(db, "invitations"), {
    ...invitation,
    estado: "pendiente",
    token,
    fechaCreacion: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateSettings(
  data: Record<string, unknown>,
): Promise<void> {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firebase Firestore no está configurado");
  await setDoc(doc(db, "settings", "main"), data, { merge: true });
}
