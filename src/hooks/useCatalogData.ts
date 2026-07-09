"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { collection, onSnapshot } from "firebase/firestore";
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

  const latestProds = useRef<Product[]>([]);
  const latestCats = useRef<Category[]>([]);
  const latestSubs = useRef<Subcategory[]>([]);
  const latestBrs = useRef<Brand[]>([]);

  const combine = useCallback(() => {
    const prods = latestProds.current;
    const cats = latestCats.current;
    const subs = latestSubs.current;
    const brs = latestBrs.current;

    const withRelations = prods.map((p) => ({
      ...p,
      marca: brs.find((b) => b.id === p.marcaId),
      categoria: cats.find((c) => c.id === p.categoriaId),
      subcategoria: subs.find((s) => s.id === p.subcategoriaId),
    }));
    setProducts(withRelations);
    setCategories([...cats].sort((a, b) => a.orden - b.orden));
    setSubcategories([...subs].sort((a, b) => a.orden - b.orden));
    setBrands([...brs].sort((a, b) => a.orden - b.orden));
  }, []);

  useEffect(() => {
    let unsubProducts = () => {};
    let unsubCategories = () => {};
    let unsubSubcategories = () => {};
    let unsubBrands = () => {};

    const loadLocal = async () => {
      const [lp, lc, ls, lb] = await Promise.all([
        getProducts(),
        getCategories(),
        getSubcategories(),
        getBrands(),
      ]);
      latestProds.current = lp;
      latestCats.current = lc;
      latestSubs.current = ls;
      latestBrs.current = lb;
      combine();
      setLoading(false);
    };

    loadLocal();

    const firestore = getFirebaseDb();
    if (!firestore) return () => {};

    try {
      unsubProducts = onSnapshot(collection(firestore, "products"), (snap) => {
        const data = snap.docs.map(
          (d) => ({ id: d.id, ...d.data() }) as Product,
        );
        latestProds.current = data;
        saveProducts(data);
        combine();
      });

      unsubCategories = onSnapshot(
        collection(firestore, "categories"),
        (snap) => {
          const data = snap.docs.map(
            (d) => ({ id: d.id, ...d.data() }) as Category,
          );
          latestCats.current = data;
          saveCategories(data);
          combine();
        },
      );

      unsubSubcategories = onSnapshot(
        collection(firestore, "subcategories"),
        (snap) => {
          const data = snap.docs.map(
            (d) => ({ id: d.id, ...d.data() }) as Subcategory,
          );
          latestSubs.current = data;
          saveSubcategories(data);
          combine();
        },
      );

      unsubBrands = onSnapshot(collection(firestore, "brands"), (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Brand);
        latestBrs.current = data;
        saveBrands(data);
        combine();
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
  }, [combine]);

  return { products, categories, subcategories, brands, loading };
}
