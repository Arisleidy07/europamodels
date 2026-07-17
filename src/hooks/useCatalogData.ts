"use client";

import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
  type ReactNode,
} from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import {
  getProducts,
  getCategories,
  getSubcategories,
  getBrands,
  getGenders,
  saveProducts,
  saveCategories,
  saveSubcategories,
  saveBrands,
  saveGenders,
} from "@/lib/localDb";
import { cacheProductImages } from "@/lib/offlineCache";
import type {
  Product,
  Category,
  Subcategory,
  Brand,
  Gender,
  ProductWithRelations,
} from "@/types";

interface CatalogDataValue {
  products: ProductWithRelations[];
  categories: Category[];
  subcategories: Subcategory[];
  brands: Brand[];
  genders: Gender[];
  loading: boolean;
  markDeleted: (id: string) => void;
  removeBrand: (id: string) => void;
}

const CatalogDataContext = createContext<CatalogDataValue | null>(null);

export function CatalogDataProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<ProductWithRelations[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [genders, setGenders] = useState<Gender[]>([]);
  const [loading, setLoading] = useState(true);

  // Track optimistically deleted IDs so stale cache snapshots can't restore them
  const deletedIds = useRef<Set<string>>(new Set());

  const latestProds = useRef<Product[]>([]);
  const latestCats = useRef<Category[]>([]);
  const latestSubs = useRef<Subcategory[]>([]);
  const latestBrs = useRef<Brand[]>([]);
  const latestGenders = useRef<Gender[]>([]);

  const combine = useCallback(() => {
    const prods = latestProds.current;
    const cats = latestCats.current;
    const subs = latestSubs.current;
    const brs = latestBrs.current;
    const genders = latestGenders.current;

    const withRelations = prods.map((p) => ({
      ...p,
      marca: brs.find((b) => b.id === p.marcaId),
      categoria: cats.find((c) => c.id === p.categoriaId),
      subcategoria: subs.find((s) => s.id === p.subcategoriaId),
    }));
    const filtered = withRelations.filter((p) => !deletedIds.current.has(p.id));
    setProducts(filtered);
    setCategories([...cats].sort((a, b) => a.orden - b.orden));
    setSubcategories([...subs].sort((a, b) => a.orden - b.orden));
    setBrands([...brs].sort((a, b) => a.orden - b.orden));
    setGenders([...genders].sort((a, b) => a.orden - b.orden));
  }, []);

  useEffect(() => {
    let active = true;
    let unsubProducts = () => {};
    let unsubCategories = () => {};
    let unsubSubcategories = () => {};
    let unsubBrands = () => {};
    let unsubGenders = () => {};

    const setup = async () => {
      try {
        const [lp, lc, ls, lb, lg] = await Promise.all([
          getProducts(),
          getCategories(),
          getSubcategories(),
          getBrands(),
          getGenders(),
        ]);
        if (!active) return;
        latestProds.current = lp;
        latestCats.current = lc;
        latestSubs.current = ls;
        latestBrs.current = lb;
        latestGenders.current = lg;
        combine();
        if (lp.length > 0 || !navigator.onLine) setLoading(false);
      } catch {
        if (active) setLoading(false);
      }

      if (!active) return;
      const firestore = getFirebaseDb();
      if (!firestore) {
        setLoading(false);
        return;
      }

      const handleError = () => setLoading(false);

      try {
        unsubProducts = onSnapshot(
          collection(firestore, "products"),
          (snap) => {
            const data = snap.docs
              .map((d) => ({ id: d.id, ...d.data() }) as Product)
              .filter((p) => !deletedIds.current.has(p.id));
            latestProds.current = data;
            void saveProducts(data);
            combine();
            setLoading(false);
          },
          handleError,
        );

        unsubCategories = onSnapshot(
          collection(firestore, "categories"),
          (snap) => {
            const data = snap.docs.map(
              (d) => ({ id: d.id, ...d.data() }) as Category,
            );
            latestCats.current = data;
            void saveCategories(data);
            combine();
          },
          handleError,
        );

        unsubSubcategories = onSnapshot(
          collection(firestore, "subcategories"),
          (snap) => {
            const data = snap.docs.map(
              (d) => ({ id: d.id, ...d.data() }) as Subcategory,
            );
            latestSubs.current = data;
            void saveSubcategories(data);
            combine();
          },
          handleError,
        );

        unsubBrands = onSnapshot(
          collection(firestore, "brands"),
          (snap) => {
            const data = snap.docs.map(
              (d) => ({ id: d.id, ...d.data() }) as Brand,
            );
            latestBrs.current = data;
            void saveBrands(data);
            combine();
          },
          handleError,
        );

        unsubGenders = onSnapshot(
          collection(firestore, "genders"),
          (snap) => {
            const data = snap.docs.map(
              (d) => ({ id: d.id, ...d.data() }) as Gender,
            );
            latestGenders.current = data;
            void saveGenders(data);
            combine();
          },
          handleError,
        );
      } catch {
        // Offline: local data is already loaded
        setLoading(false);
      }
    };

    void setup();

    return () => {
      active = false;
      unsubProducts();
      unsubCategories();
      unsubSubcategories();
      unsubBrands();
      unsubGenders();
    };
  }, [combine]);

  useEffect(() => {
    const urls = products.flatMap((product) => [
      ...product.imagenes,
      product.imagenInformativa || "",
    ]);
    void cacheProductImages(urls);
  }, [products]);

  const markDeleted = useCallback(
    (id: string) => {
      deletedIds.current.add(id);
      latestProds.current = latestProds.current.filter((p) => p.id !== id);
      combine();
    },
    [combine],
  );

  const removeBrand = useCallback(
    (id: string) => {
      latestBrs.current = latestBrs.current.filter((brand) => brand.id !== id);
      saveBrands(latestBrs.current);
      combine();
    },
    [combine],
  );

  return createElement(
    CatalogDataContext.Provider,
    {
      value: {
        products,
        categories,
        subcategories,
        brands,
        genders,
        loading,
        markDeleted,
        removeBrand,
      },
    },
    children,
  );
}

export function useCatalogData() {
  const context = useContext(CatalogDataContext);
  if (!context) {
    throw new Error("useCatalogData debe usarse dentro de CatalogDataProvider");
  }
  return context;
}
