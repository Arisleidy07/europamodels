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
  getOlfactoryNotes,
  getSizes,
  getQuotes,
  saveProducts,
  saveCategories,
  saveSubcategories,
  saveBrands,
  saveGenders,
  saveOlfactoryNotes,
  saveSizes,
  saveQuotes,
} from "@/lib/localDb";
import { cacheProductImages } from "@/lib/offlineCache";
import type {
  Product,
  Category,
  Subcategory,
  Brand,
  Gender,
  OlfactoryNote,
  Size,
  Quote,
  ProductWithRelations,
} from "@/types";

interface CatalogDataValue {
  products: ProductWithRelations[];
  categories: Category[];
  subcategories: Subcategory[];
  brands: Brand[];
  genders: Gender[];
  olfactoryNotes: OlfactoryNote[];
  sizes: Size[];
  quotes: Quote[];
  loading: boolean;
  markDeleted: (id: string) => void;
  removeCategory: (id: string) => void;
  removeSubcategory: (id: string) => void;
  removeBrand: (id: string) => void;
  removeGender: (id: string) => void;
  removeOlfactoryNote: (id: string) => void;
  removeSize: (id: string) => void;
}

const CatalogDataContext = createContext<CatalogDataValue | null>(null);

export function CatalogDataProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<ProductWithRelations[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [genders, setGenders] = useState<Gender[]>([]);
  const [olfactoryNotes, setOlfactoryNotes] = useState<OlfactoryNote[]>([]);
  const [sizes, setSizes] = useState<Size[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  // Track optimistically deleted IDs so stale cache snapshots can't restore them
  const deletedIds = useRef<Set<string>>(new Set());

  const latestProds = useRef<Product[]>([]);
  const latestCats = useRef<Category[]>([]);
  const latestSubs = useRef<Subcategory[]>([]);
  const latestBrs = useRef<Brand[]>([]);
  const latestGenders = useRef<Gender[]>([]);
  const latestOlfactoryNotes = useRef<OlfactoryNote[]>([]);
  const latestSizes = useRef<Size[]>([]);
  const latestQuotes = useRef<Quote[]>([]);

  const combine = useCallback(() => {
    const prods = latestProds.current;
    const cats = latestCats.current;
    const subs = latestSubs.current;
    const brs = latestBrs.current;
    const genders = latestGenders.current;
    const notes = latestOlfactoryNotes.current;
    const savedSizes = latestSizes.current;
    const savedQuotes = latestQuotes.current;

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
    setOlfactoryNotes(
      [...notes].sort((a, b) => a.nombre.localeCompare(b.nombre)),
    );
    setSizes([...savedSizes].sort((a, b) => a.orden - b.orden));
    setQuotes(
      [...savedQuotes].sort(
        (a, b) =>
          new Date(b.fechaCreacion).getTime() -
          new Date(a.fechaCreacion).getTime(),
      ),
    );
  }, []);

  useEffect(() => {
    let active = true;
    let unsubProducts = () => {};
    let unsubCategories = () => {};
    let unsubSubcategories = () => {};
    let unsubBrands = () => {};
    let unsubGenders = () => {};
    let unsubOlfactoryNotes = () => {};
    let unsubSizes = () => {};
    let unsubQuotes = () => {};

    const setup = async () => {
      try {
        const [lp, lc, ls, lb, lg, lo, lz, lq] = await Promise.all([
          getProducts(),
          getCategories(),
          getSubcategories(),
          getBrands(),
          getGenders(),
          getOlfactoryNotes(),
          getSizes(),
          getQuotes(),
        ]);
        if (!active) return;
        latestProds.current = lp;
        latestCats.current = lc;
        latestSubs.current = ls;
        latestBrs.current = lb;
        latestGenders.current = lg;
        latestOlfactoryNotes.current = lo;
        latestSizes.current = lz;
        latestQuotes.current = lq;
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

        unsubOlfactoryNotes = onSnapshot(
          collection(firestore, "olfactoryNotes"),
          (snap) => {
            const data = snap.docs.map(
              (d) => ({ id: d.id, ...d.data() }) as OlfactoryNote,
            );
            latestOlfactoryNotes.current = data;
            void saveOlfactoryNotes(data);
            combine();
          },
          handleError,
        );

        unsubSizes = onSnapshot(
          collection(firestore, "sizes"),
          (snap) => {
            const data = snap.docs.map(
              (d) => ({ id: d.id, ...d.data() }) as Size,
            );
            latestSizes.current = data;
            void saveSizes(data);
            combine();
          },
          handleError,
        );

        unsubQuotes = onSnapshot(
          collection(firestore, "quotes"),
          (snap) => {
            const remote = snap.docs.map(
              (d) => ({ id: d.id, ...d.data() }) as Quote,
            );
            const remoteIds = new Set(remote.map((quote) => quote.id));
            const localOnly = latestQuotes.current.filter(
              (quote) => !remoteIds.has(quote.id),
            );
            const data = [...remote, ...localOnly];
            latestQuotes.current = data;
            void saveQuotes(data);
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
      unsubOlfactoryNotes();
      unsubSizes();
      unsubQuotes();
    };
  }, [combine]);

  useEffect(() => {
    const urls = [
      ...products.flatMap((product) => [
        ...product.imagenes,
        product.imagenInformativa || "",
      ]),
      ...olfactoryNotes.map((note) => note.imagen || ""),
      ...quotes.flatMap((quote) =>
        quote.productos.map((product) => product.imagen),
      ),
    ];
    void cacheProductImages(urls);
  }, [olfactoryNotes, products, quotes]);

  const markDeleted = useCallback(
    (id: string) => {
      deletedIds.current.add(id);
      latestProds.current = latestProds.current.filter((p) => p.id !== id);
      combine();
    },
    [combine],
  );

  const removeCategory = useCallback(
    (id: string) => {
      latestCats.current = latestCats.current.filter(
        (category) => category.id !== id,
      );
      void saveCategories(latestCats.current);
      combine();
    },
    [combine],
  );

  const removeSubcategory = useCallback(
    (id: string) => {
      latestSubs.current = latestSubs.current.filter(
        (subcategory) => subcategory.id !== id,
      );
      void saveSubcategories(latestSubs.current);
      combine();
    },
    [combine],
  );

  const removeBrand = useCallback(
    (id: string) => {
      latestBrs.current = latestBrs.current.filter((brand) => brand.id !== id);
      void saveBrands(latestBrs.current);
      combine();
    },
    [combine],
  );

  const removeGender = useCallback(
    (id: string) => {
      latestGenders.current = latestGenders.current.filter(
        (gender) => gender.id !== id,
      );
      void saveGenders(latestGenders.current);
      combine();
    },
    [combine],
  );

  const removeOlfactoryNote = useCallback(
    (id: string) => {
      latestOlfactoryNotes.current = latestOlfactoryNotes.current.filter(
        (note) => note.id !== id,
      );
      void saveOlfactoryNotes(latestOlfactoryNotes.current);
      combine();
    },
    [combine],
  );

  const removeSize = useCallback(
    (id: string) => {
      latestSizes.current = latestSizes.current.filter(
        (size) => size.id !== id,
      );
      void saveSizes(latestSizes.current);
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
        olfactoryNotes,
        sizes,
        quotes,
        loading,
        markDeleted,
        removeCategory,
        removeSubcategory,
        removeBrand,
        removeGender,
        removeOlfactoryNote,
        removeSize,
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
