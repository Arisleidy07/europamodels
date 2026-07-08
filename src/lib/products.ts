import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirebaseDb, getFirebaseStorage } from "@/lib/firebase";
import { getProducts, saveProducts } from "@/lib/localDb";
import type { Product } from "@/types";

export async function uploadProductImages(
  productId: string,
  files: File[],
  onProgress?: (progress: number) => void,
): Promise<string[]> {
  const storage = getFirebaseStorage();
  if (!storage) throw new Error("Firebase Storage no está configurado");
  const urls: string[] = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const ext = file.name.split(".").pop() || "webp";
    const storageRef = ref(
      storage,
      `products/${productId}/images/${Date.now()}-${i}.${ext}`,
    );
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    urls.push(url);
    if (onProgress) onProgress(Math.round(((i + 1) / files.length) * 100));
  }
  return urls;
}

export async function createProduct(
  product: Omit<Product, "id">,
): Promise<Product> {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firebase Firestore no está configurado");
  const docRef = await addDoc(collection(db, "products"), {
    ...product,
    fechaCreacion: serverTimestamp(),
    fechaActualizacion: serverTimestamp(),
  });
  const created = { ...product, id: docRef.id } as Product;
  const local = await getProducts();
  await saveProducts([...local, created]);
  return created;
}

export async function updateProduct(
  productId: string,
  data: Partial<Product>,
): Promise<void> {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firebase Firestore no está configurado");
  await updateDoc(doc(db, "products", productId), {
    ...data,
    fechaActualizacion: serverTimestamp(),
  });
}

export async function deleteProduct(productId: string): Promise<void> {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firebase Firestore no está configurado");
  await deleteDoc(doc(db, "products", productId));
  const local = await getProducts();
  await saveProducts(local.filter((p) => p.id !== productId));
}
