"use client";

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import {
  getProducts,
  getCategories,
  getSubcategories,
  getBrands,
  saveProducts,
  saveCategories,
  saveSubcategories,
  saveBrands,
} from "@/lib/localDb";
import type {
  Product,
  Category,
  Subcategory,
  Brand,
  ProductWithRelations,
} from "@/types";

export function useCatalogData() {
  const [products, setProducts] = useState<ProductWithRelations[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubProducts = () => {};
    let unsubCategories = () => {};
    let unsubSubcategories = () => {};
    let unsubBrands = () => {};

    const loadLocal = async () => {
      const [localProducts, localCategories, localSubcategories, localBrands] =
        await Promise.all([
          getProducts(),
          getCategories(),
          getSubcategories(),
          getBrands(),
        ]);
      combine(localProducts, localCategories, localSubcategories, localBrands);
      setLoading(false);
    };

    const combine = (
      prods: Product[],
      cats: Category[],
      subs: Subcategory[],
      brs: Brand[],
    ) => {
      const withRelations = prods.map((p) => ({
        ...p,
        marca: brs.find((b) => b.id === p.marcaId),
        categoria: cats.find((c) => c.id === p.categoriaId),
        subcategoria: subs.find((s) => s.id === p.subcategoriaId),
      }));
      setProducts(withRelations);
      setCategories(cats.sort((a, b) => a.orden - b.orden));
      setSubcategories(subs.sort((a, b) => a.orden - b.orden));
      setBrands(brs.sort((a, b) => a.orden - b.orden));
    };

    loadLocal();

    const firestore = getFirebaseDb();
    if (!firestore) {
      return () => {};
    }

    try {
      const qProducts = query(
        collection(firestore, "products"),
        where("visible", "==", true),
        orderBy("fechaCreacion", "desc"),
      );
      unsubProducts = onSnapshot(qProducts, (snap) => {
        const data = snap.docs.map(
          (d) => ({ id: d.id, ...d.data() }) as Product,
        );
        saveProducts(data);
        getCategories().then((cats) => {
          getSubcategories().then((subs) => {
            getBrands().then((brs) => combine(data, cats, subs, brs));
          });
        });
      });

      unsubCategories = onSnapshot(
        collection(firestore, "categories"),
        (snap) => {
          const data = snap.docs.map(
            (d) => ({ id: d.id, ...d.data() }) as Category,
          );
          saveCategories(data);
        },
      );

      unsubSubcategories = onSnapshot(
        collection(firestore, "subcategories"),
        (snap) => {
          const data = snap.docs.map(
            (d) => ({ id: d.id, ...d.data() }) as Subcategory,
          );
          saveSubcategories(data);
        },
      );

      unsubBrands = onSnapshot(collection(firestore, "brands"), (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Brand);
        saveBrands(data);
      });
    } catch {
      // Offline: local data is already loaded
    }

    return () => {
      unsubProducts();
      unsubCategories();
      unsubSubcategories();
      unsubBrands();
    };
  }, []);

  return { products, categories, subcategories, brands, loading };
}
