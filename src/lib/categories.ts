import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import type { Category, Subcategory, Brand } from "@/types";

export async function createCategory(
  category: Omit<Category, "id">,
): Promise<Category> {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firebase Firestore no está configurado");
  const docRef = await addDoc(collection(db, "categories"), {
    ...category,
    fechaCreacion: serverTimestamp(),
  });
  return { ...category, id: docRef.id } as Category;
}

export async function updateCategory(
  id: string,
  data: Partial<Category>,
): Promise<void> {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firebase Firestore no está configurado");
  await updateDoc(doc(db, "categories", id), data);
}

export async function deleteCategory(id: string): Promise<void> {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firebase Firestore no está configurado");
  await deleteDoc(doc(db, "categories", id));
}

export async function createSubcategory(
  subcategory: Omit<Subcategory, "id">,
): Promise<Subcategory> {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firebase Firestore no está configurado");
  const docRef = await addDoc(collection(db, "subcategories"), subcategory);
  return { ...subcategory, id: docRef.id } as Subcategory;
}

export async function updateSubcategory(
  id: string,
  data: Partial<Subcategory>,
): Promise<void> {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firebase Firestore no está configurado");
  await updateDoc(doc(db, "subcategories", id), data);
}

export async function deleteSubcategory(id: string): Promise<void> {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firebase Firestore no está configurado");
  await deleteDoc(doc(db, "subcategories", id));
}

export async function createBrand(brand: Omit<Brand, "id">): Promise<Brand> {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firebase Firestore no está configurado");
  const docRef = await addDoc(collection(db, "brands"), brand);
  return { ...brand, id: docRef.id } as Brand;
}

export async function updateBrand(
  id: string,
  data: Partial<Brand>,
): Promise<void> {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firebase Firestore no está configurado");
  await updateDoc(doc(db, "brands", id), data);
}

export async function deleteBrand(id: string): Promise<void> {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firebase Firestore no está configurado");
  await deleteDoc(doc(db, "brands", id));
}
