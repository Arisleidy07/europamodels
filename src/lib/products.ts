import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
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

export async function uploadProductInfoImage(
  productId: string,
  file: File,
): Promise<string> {
  const storage = getFirebaseStorage();
  if (!storage) throw new Error("Firebase Storage no está configurado");
  const ext = file.name.split(".").pop() || "webp";
  const storageRef = ref(
    storage,
    `products/${productId}/info/${Date.now()}.${ext}`,
  );
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

export async function createProduct(
  product: Omit<Product, "id">,
): Promise<Product> {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firebase Firestore no está configurado");
  // Strip undefined values — Firestore rejects them
  const clean: Record<string, any> = {
    ...product,
    fechaCreacion: serverTimestamp(),
    fechaActualizacion: serverTimestamp(),
  };
  Object.keys(clean).forEach((k) => {
    if (clean[k] === undefined) delete clean[k];
  });
  const docRef = await addDoc(collection(db, "products"), clean);
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
  // Strip undefined values — Firestore rejects them
  const clean: Record<string, any> = {
    ...data,
    fechaActualizacion: serverTimestamp(),
  };
  Object.keys(clean).forEach((k) => {
    if (clean[k] === undefined) delete clean[k];
  });
  await updateDoc(doc(db, "products", productId), clean);
}

export async function deleteProductImage(imageUrl: string): Promise<void> {
  const storage = getFirebaseStorage();
  if (!storage) return;
  if (!imageUrl.includes("firebasestorage.googleapis.com")) return;
  try {
    const storageRef = ref(storage, imageUrl);
    await deleteObject(storageRef);
  } catch {
    // Image may already be deleted
  }
}

export async function deleteProduct(productId: string): Promise<void> {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firebase Firestore no está configurado");
  await deleteDoc(doc(db, "products", productId));
  const local = await getProducts();
  await saveProducts(local.filter((p) => p.id !== productId));
}
