import { openDB, DBSchema, IDBPDatabase } from "idb";
import type {
  Product,
  Category,
  Subcategory,
  Brand,
  Gender,
  Quote,
  AppSettings,
  CartItem,
  SyncQueueItem,
  OlfactoryNote,
} from "@/types";

interface EuropaDB extends DBSchema {
  products: {
    key: string;
    value: Product;
    indexes: { "by-category": string; "by-brand": string; "by-status": string };
  };
  categories: {
    key: string;
    value: Category;
  };
  subcategories: {
    key: string;
    value: Subcategory;
  };
  brands: {
    key: string;
    value: Brand;
  };
  genders: {
    key: string;
    value: Gender;
  };
  olfactoryNotes: {
    key: string;
    value: OlfactoryNote;
  };
  quotes: {
    key: string;
    value: Quote;
  };
  settings: {
    key: string;
    value: AppSettings;
  };
  cart: {
    key: string;
    value: CartItem;
  };
  syncQueue: {
    key: string;
    value: SyncQueueItem;
  };
}

const DB_NAME = "europa-models-db";
const DB_VERSION = 3;

let dbPromise: Promise<IDBPDatabase<EuropaDB>> | null = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<EuropaDB>(DB_NAME, DB_VERSION, {
      upgrade(db, _oldVersion, _newVersion, transaction) {
        const productsStore = db.objectStoreNames.contains("products")
          ? transaction.objectStore("products")
          : db.createObjectStore("products", { keyPath: "id" });

        if (!productsStore.indexNames.contains("by-category")) {
          productsStore.createIndex("by-category", "categoriaId");
        }
        if (!productsStore.indexNames.contains("by-brand")) {
          productsStore.createIndex("by-brand", "marcaId");
        }
        if (!productsStore.indexNames.contains("by-status")) {
          productsStore.createIndex("by-status", "estado");
        }

        if (!db.objectStoreNames.contains("categories")) {
          db.createObjectStore("categories", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("subcategories")) {
          db.createObjectStore("subcategories", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("brands")) {
          db.createObjectStore("brands", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("genders")) {
          db.createObjectStore("genders", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("olfactoryNotes")) {
          db.createObjectStore("olfactoryNotes", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("quotes")) {
          db.createObjectStore("quotes", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("settings")) {
          db.createObjectStore("settings", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("cart")) {
          db.createObjectStore("cart", { keyPath: "productoId" });
        }
        if (!db.objectStoreNames.contains("syncQueue")) {
          db.createObjectStore("syncQueue", { keyPath: "id" });
        }
      },
    });
  }
  return dbPromise;
}

export async function saveProducts(products: Product[]) {
  const db = await getDB();
  const tx = db.transaction("products", "readwrite");
  await tx.store.clear();
  await Promise.all([...products.map((p) => tx.store.put(p)), tx.done]);
}

export async function getProducts(): Promise<Product[]> {
  const db = await getDB();
  return db.getAll("products");
}

export async function saveCategories(categories: Category[]) {
  const db = await getDB();
  const tx = db.transaction("categories", "readwrite");
  await tx.store.clear();
  await Promise.all([...categories.map((c) => tx.store.put(c)), tx.done]);
}

export async function getCategories(): Promise<Category[]> {
  const db = await getDB();
  return db.getAll("categories");
}

export async function saveSubcategories(subcategories: Subcategory[]) {
  const db = await getDB();
  const tx = db.transaction("subcategories", "readwrite");
  await tx.store.clear();
  await Promise.all([...subcategories.map((s) => tx.store.put(s)), tx.done]);
}

export async function getSubcategories(): Promise<Subcategory[]> {
  const db = await getDB();
  return db.getAll("subcategories");
}

export async function saveBrands(brands: Brand[]) {
  const db = await getDB();
  const tx = db.transaction("brands", "readwrite");
  await tx.store.clear();
  await Promise.all([...brands.map((b) => tx.store.put(b)), tx.done]);
}

export async function getBrands(): Promise<Brand[]> {
  const db = await getDB();
  return db.getAll("brands");
}

export async function saveGenders(genders: Gender[]) {
  const db = await getDB();
  const tx = db.transaction("genders", "readwrite");
  await tx.store.clear();
  await Promise.all([...genders.map((g) => tx.store.put(g)), tx.done]);
}

export async function getGenders(): Promise<Gender[]> {
  const db = await getDB();
  return db.getAll("genders");
}

export async function saveOlfactoryNotes(notes: OlfactoryNote[]) {
  const db = await getDB();
  const tx = db.transaction("olfactoryNotes", "readwrite");
  await tx.store.clear();
  await Promise.all([...notes.map((note) => tx.store.put(note)), tx.done]);
}

export async function getOlfactoryNotes(): Promise<OlfactoryNote[]> {
  const db = await getDB();
  return db.getAll("olfactoryNotes");
}

export async function saveSettings(settings: AppSettings) {
  const db = await getDB();
  await db.put("settings", { ...settings, id: "main" });
}

export async function getSettings(): Promise<AppSettings | undefined> {
  const db = await getDB();
  return db.get("settings", "main");
}

export async function saveCart(cart: CartItem[]) {
  const db = await getDB();
  const tx = db.transaction("cart", "readwrite");
  await tx.store.clear();
  await Promise.all([...cart.map((item) => tx.store.put(item)), tx.done]);
}

export async function getCart(): Promise<CartItem[]> {
  const db = await getDB();
  return db.getAll("cart");
}

export async function saveQuotes(quotes: Quote[]) {
  const db = await getDB();
  const tx = db.transaction("quotes", "readwrite");
  await tx.store.clear();
  await Promise.all([...quotes.map((q) => tx.store.put(q)), tx.done]);
}

export async function getQuotes(): Promise<Quote[]> {
  const db = await getDB();
  return db.getAll("quotes");
}

export async function addSyncQueueItem(item: SyncQueueItem) {
  const db = await getDB();
  await db.put("syncQueue", item);
}

export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  const db = await getDB();
  return db.getAll("syncQueue");
}

export async function removeSyncQueueItem(id: string) {
  const db = await getDB();
  await db.delete("syncQueue", id);
}
