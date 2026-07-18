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

function sanitizeFileName(name: string): string {
  const base = name.replace(/[^a-zA-Z0-9_.-]/g, "_").replace(/_+/g, "_");
  return base.length > 120 ? base.slice(0, 120) : base;
}

export async function uploadProductImages(
  productId: string,
  files: { file: File; name?: string }[],
  onProgress?: (progress: number) => void,
): Promise<string[]> {
  const storage = getFirebaseStorage();
  if (!storage) throw new Error("Firebase Storage no está configurado");
  const urls: string[] = [];
  for (let i = 0; i < files.length; i++) {
    const { file, name } = files[i];
    const ext =
      (name || file.name).split(".").pop() ||
      file.name.split(".").pop() ||
      "webp";
    const cleanName = sanitizeFileName(name || file.name);
    const uniquePrefix = `${Date.now()}-${i}`;
    const fileName = cleanName.includes(".")
      ? `${uniquePrefix}-${cleanName}`
      : `${uniquePrefix}-${cleanName}.${ext}`;
    const storageRef = ref(storage, `products/${productId}/images/${fileName}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    urls.push(url);
    if (onProgress) onProgress(Math.round(((i + 1) / files.length) * 100));
  }
  return urls;
}

export async function renameProductImage(
  productId: string,
  oldUrl: string,
  newName: string,
): Promise<string> {
  const storage = getFirebaseStorage();
  if (!storage) throw new Error("Firebase Storage no está configurado");

  // Fetch existing image and re-upload with new file name
  const response = await fetch(oldUrl, { mode: "cors" });
  if (!response.ok)
    throw new Error("No se pudo descargar la imagen para renombrar");
  const blob = await response.blob();
  const ext = newName.split(".").pop() || blob.type.split("/").pop() || "jpg";
  const cleanName = sanitizeFileName(newName);
  const fileName = cleanName.includes(".")
    ? `${Date.now()}-${cleanName}`
    : `${Date.now()}-${cleanName}.${ext}`;
  const file = new File([blob], fileName, { type: blob.type || "image/jpeg" });
  const storageRef = ref(storage, `products/${productId}/images/${fileName}`);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);

  // Delete old reference
  await deleteProductImage(oldUrl);
  return url;
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
  const local = await getProducts();
  const localData = Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined),
  );
  await saveProducts(
    local.map((product) =>
      product.id === productId
        ? ({ ...product, ...localData, id: productId } as Product)
        : product,
    ),
  );
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
