import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import {
  getCategories,
  getSubcategories,
  getBrands,
  saveCategories,
  saveSubcategories,
  saveBrands,
} from "@/lib/localDb";
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
  const created = { ...category, id: docRef.id } as Category;
  const local = await getCategories();
  await saveCategories([
    ...local.filter((item) => item.id !== created.id),
    created,
  ]);
  return created;
}

export async function updateCategory(
  id: string,
  data: Partial<Category>,
): Promise<void> {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firebase Firestore no está configurado");
  const { id: _id, ...rest } = data as any;
  await updateDoc(doc(db, "categories", id), rest);
  const local = await getCategories();
  await saveCategories(
    local.map((item) => (item.id === id ? { ...item, ...rest, id } : item)),
  );
}

export async function deleteCategory(id: string): Promise<void> {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firebase Firestore no está configurado");
  await deleteDoc(doc(db, "categories", id));
  const local = await getCategories();
  await saveCategories(local.filter((item) => item.id !== id));
}

export async function createSubcategory(
  subcategory: Omit<Subcategory, "id">,
): Promise<Subcategory> {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firebase Firestore no está configurado");
  const docRef = await addDoc(collection(db, "subcategories"), subcategory);
  const created = { ...subcategory, id: docRef.id } as Subcategory;
  const local = await getSubcategories();
  await saveSubcategories([
    ...local.filter((item) => item.id !== created.id),
    created,
  ]);
  return created;
}

export async function updateSubcategory(
  id: string,
  data: Partial<Subcategory>,
): Promise<void> {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firebase Firestore no está configurado");
  await updateDoc(doc(db, "subcategories", id), data);
  const local = await getSubcategories();
  await saveSubcategories(
    local.map((item) => (item.id === id ? { ...item, ...data, id } : item)),
  );
}

export async function deleteSubcategory(id: string): Promise<void> {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firebase Firestore no está configurado");
  await deleteDoc(doc(db, "subcategories", id));
  const local = await getSubcategories();
  await saveSubcategories(local.filter((item) => item.id !== id));
}

export async function createBrand(brand: Omit<Brand, "id">): Promise<Brand> {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firebase Firestore no está configurado");
  const docRef = await addDoc(collection(db, "brands"), brand);
  const created = { ...brand, id: docRef.id } as Brand;
  const local = await getBrands();
  await saveBrands([
    ...local.filter((item) => item.id !== created.id),
    created,
  ]);
  return created;
}

export async function updateBrand(
  id: string,
  data: Partial<Brand>,
): Promise<void> {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firebase Firestore no está configurado");
  const { id: _id, ...rest } = data as any;
  await updateDoc(doc(db, "brands", id), rest);
  const local = await getBrands();
  await saveBrands(
    local.map((item) => (item.id === id ? { ...item, ...rest, id } : item)),
  );
}

export async function deleteBrand(id: string): Promise<void> {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firebase Firestore no está configurado");
  await deleteDoc(doc(db, "brands", id));
  const local = await getBrands();
  await saveBrands(local.filter((item) => item.id !== id));
}
