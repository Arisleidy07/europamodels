"use client";

import React, { useState, useMemo, useEffect, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  SlidersHorizontal,
  ListFilter,
  X,
  Search,
  ChevronRight,
  Package,
  Grid3X3,
} from "lucide-react";
import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useCatalogData } from "@/hooks/useCatalogData";
import { useCart } from "@/context/CartContext";
import { useSettings } from "@/context/SettingsContext";
import { normalizeText, cn } from "@/lib/utils";
import { LicenseGuard } from "@/components/LicenseGuard";
import type { ProductWithRelations, Gender } from "@/types";
import toast from "react-hot-toast";

const PAGE_SIZE = 24;

function CategorySidebar({
  open,
  onClose,
  categories,
  selected,
  onSelect,
  subcategories,
  selectedSub,
  onSelectSub,
}: {
  open: boolean;
  onClose: () => void;
  categories: { id: string; nombre: string; color?: string }[];
  selected: string;
  onSelect: (id: string) => void;
  subcategories: { id: string; nombre: string; categoriaId: string }[];
  selectedSub: string;
  onSelectSub: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    const q = normalizeText(search);
    return categories.filter((c) => normalizeText(c.nombre).includes(q));
  }, [categories, search]);

  const selectedSubs = useMemo(
    () => subcategories.filter((s) => s.categoriaId === selected),
    [subcategories, selected],
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className="fixed inset-y-0 left-0 z-[61] flex w-[min(88vw,360px)] flex-col border-r border-border bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-lg font-bold text-foreground">Categorías</h2>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-muted-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-5 py-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar categoría"
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-3 pb-6">
              <button
                onClick={() => {
                  onSelect("todos");
                  onSelectSub("todos");
                  onClose();
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition-colors",
                  selected === "todos"
                    ? "bg-primary/10 text-primary"
                    : "text-foreground hover:bg-muted",
                )}
              >
                <Grid3X3 className="h-4 w-4" /> Todos los productos
              </button>
              {filtered.map((cat) => (
                <div key={cat.id}>
                  <button
                    onClick={() => onSelect(cat.id)}
                    className={cn(
                      "mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition-colors",
                      selected === cat.id
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-muted",
                    )}
                  >
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: cat.color || "#2563eb" }}
                    />
                    {cat.nombre}
                    <ChevronRight className="ml-auto h-4 w-4 opacity-50" />
                  </button>
                  {selected === cat.id && selectedSubs.length > 0 && (
                    <div className="ml-6 mt-1 space-y-1 border-l border-border pl-3">
                      <button
                        onClick={() => onSelectSub("todos")}
                        className={cn(
                          "block w-full rounded-lg px-3 py-2 text-left text-xs transition-colors",
                          selectedSub === "todos"
                            ? "bg-primary/10 font-semibold text-primary"
                            : "text-muted-foreground hover:bg-muted",
                        )}
                      >
                        Todas
                      </button>
                      {selectedSubs.map((sub) => (
                        <button
                          key={sub.id}
                          onClick={() => onSelectSub(sub.id)}
                          className={cn(
                            "block w-full rounded-lg px-3 py-2 text-left text-xs transition-colors",
                            selectedSub === sub.id
                              ? "bg-primary/10 font-semibold text-primary"
                              : "text-muted-foreground hover:bg-muted",
                          )}
                        >
                          {sub.nombre}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function FilterSidebar({
  open,
  onClose,
  brands,
  selectedBrand,
  onSelectBrand,
  selectedGender,
  onSelectGender,
  genders,
  onClear,
}: {
  open: boolean;
  onClose: () => void;
  brands: { id: string; nombre: string }[];
  selectedBrand: string;
  onSelectBrand: (id: string) => void;
  selectedGender: string;
  onSelectGender: (id: string) => void;
  genders: Gender[];
  onClear: () => void;
}) {
  const genderOptions = [
    { value: "todos", label: "Todos" },
    ...genders
      .filter((g) => g.activo)
      .sort((a, b) => a.orden - b.orden)
      .map((g) => ({ value: g.nombre, label: g.nombre })),
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className="fixed inset-y-0 right-0 z-[61] flex w-[min(88vw,360px)] flex-col border-l border-border bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-lg font-bold text-foreground">Filtros</h2>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-muted-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className="mb-6">
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Género
                </h3>
                <div className="flex flex-wrap gap-2">
                  {genderOptions.map((g) => (
                    <button
                      key={g.value}
                      onClick={() => onSelectGender(g.value)}
                      className={cn(
                        "rounded-full border px-3.5 py-2 text-xs font-medium transition-all",
                        selectedGender === g.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-white text-foreground hover:bg-muted",
                      )}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Marca
                </h3>
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => onSelectBrand("todos")}
                    className={cn(
                      "rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                      selectedBrand === "todos"
                        ? "bg-primary/10 font-medium text-primary"
                        : "text-foreground hover:bg-muted",
                    )}
                  >
                    Todas las marcas
                  </button>
                  {brands.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => onSelectBrand(b.id)}
                      className={cn(
                        "rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                        selectedBrand === b.id
                          ? "bg-primary/10 font-medium text-primary"
                          : "text-foreground hover:bg-muted",
                      )}
                    >
                      {b.nombre}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="border-t border-border p-5">
              <Button variant="outline" className="w-full" onClick={onClear}>
                Limpiar filtros
              </Button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

const CatalogProductCard = memo(ProductCard);

export default function CatalogoPage() {
  const router = useRouter();
  const { products, categories, subcategories, brands, genders, loading } =
    useCatalogData();
  const { addToCart, openCartDrawer } = useCart();
  const { settings } = useSettings();

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("todos");
  const [selectedSubcategory, setSelectedSubcategory] =
    useState<string>("todos");
  const [selectedBrand, setSelectedBrand] = useState<string>("todos");
  const [selectedGender, setSelectedGender] = useState<string>("todos");
  const [catSidebarOpen, setCatSidebarOpen] = useState(false);
  const [filterSidebarOpen, setFilterSidebarOpen] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [
    search,
    selectedCategory,
    selectedSubcategory,
    selectedBrand,
    selectedGender,
  ]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedBrand !== "todos") count++;
    if (selectedGender !== "todos") count++;
    return count;
  }, [selectedBrand, selectedGender]);

  const filteredProducts = useMemo(() => {
    const term = normalizeText(search);
    return products
      .filter((p) => {
        // Public catalog: exclude drafts and hidden products
        if (p.estado === "borrador" || p.estado === "oculto") return false;
        return true;
      })
      .filter((p) => {
        if (!term) return true;
        const text = [
          p.nombre,
          p.marca?.nombre,
          p.categoria?.nombre,
          p.subcategoria?.nombre,
          p.codigoInterno,
          p.sku,
          p.descripcion,
          p.etiquetas?.join(" "),
        ]
          .filter(Boolean)
          .join(" ");
        return normalizeText(text).includes(term);
      })
      .filter((p) => {
        if (selectedCategory !== "todos" && p.categoriaId !== selectedCategory)
          return false;
        if (
          selectedSubcategory !== "todos" &&
          p.subcategoriaId !== selectedSubcategory
        )
          return false;
        if (selectedBrand !== "todos" && p.marcaId !== selectedBrand)
          return false;
        if (selectedGender !== "todos" && p.genero !== selectedGender)
          return false;
        return true;
      });
  }, [
    products,
    search,
    selectedCategory,
    selectedSubcategory,
    selectedBrand,
    selectedGender,
  ]);

  const pagedProducts = useMemo(
    () => filteredProducts.slice(0, page * PAGE_SIZE),
    [filteredProducts, page],
  );

  const hasMore = pagedProducts.length < filteredProducts.length;

  const catalogTitle = useMemo(() => {
    if (search.trim()) return `Resultados para "${search.trim()}"`;
    if (selectedSubcategory !== "todos") {
      return (
        subcategories.find((sub) => sub.id === selectedSubcategory)?.nombre ||
        "Todos los productos"
      );
    }
    if (selectedCategory !== "todos") {
      return (
        categories.find((category) => category.id === selectedCategory)
          ?.nombre || "Todos los productos"
      );
    }
    if (selectedBrand !== "todos") {
      return (
        brands.find((brand) => brand.id === selectedBrand)?.nombre ||
        "Todos los productos"
      );
    }
    return "Todos los productos";
  }, [
    brands,
    categories,
    search,
    selectedBrand,
    selectedCategory,
    selectedSubcategory,
    subcategories,
  ]);

  const handleAdd = useCallback(
    (product: ProductWithRelations) => {
      addToCart({
        productoId: product.id,
        nombre: product.nombre,
        imagen: product.imagenes[0] || "/placeholder-product.svg",
        precio: product.precioOferta || product.precio,
        cantidad: 1,
      });
      toast.success(`${product.nombre} agregado`, { duration: 1500 });
    },
    [addToCart],
  );

  const clearFilters = useCallback(() => {
    setSelectedBrand("todos");
    setSelectedGender("todos");
    setSelectedCategory("todos");
    setSelectedSubcategory("todos");
    setSearch("");
  }, []);

  return (
    <LicenseGuard>
      <div className="flex min-h-screen flex-col bg-background">
        <Header
          search={search}
          onSearchChange={setSearch}
          onOpenCart={openCartDrawer}
          onSelectProduct={(p) => router.push(`/producto/${p.id}`)}
        />

        <div className="sticky top-16 z-40 sm:top-[72px]">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 lg:px-8">
            <button
              onClick={() => setCatSidebarOpen(true)}
              className={cn(
                "flex h-10 min-w-[132px] items-center justify-center gap-2 rounded-full border px-4 text-sm font-semibold shadow-md shadow-slate-900/10 transition-all active:scale-95",
                selectedCategory !== "todos"
                  ? "border-primary bg-primary text-white"
                  : "border-border bg-white text-foreground hover:bg-gray-50 hover:shadow-lg",
              )}
            >
              <ListFilter className="h-4 w-4" />
              <span>Categorías</span>
            </button>

            <button
              onClick={() => setFilterSidebarOpen(true)}
              className={cn(
                "relative flex h-10 min-w-[132px] items-center justify-center gap-2 rounded-full border px-4 text-sm font-semibold shadow-md shadow-slate-900/10 transition-all active:scale-95",
                activeFilterCount > 0
                  ? "border-primary bg-primary text-white"
                  : "border-border bg-white text-foreground hover:bg-gray-50 hover:shadow-lg",
              )}
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span>Filtros</span>
              {activeFilterCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-primary">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-4 lg:px-8">
          <h1 className="mb-4 text-lg font-bold text-foreground sm:text-xl">
            {catalogTitle}
          </h1>
          {loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-semibold text-foreground">
                No se encontraron productos
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Prueba con otros términos o filtros
              </p>
              <button
                onClick={clearFilters}
                className="mt-4 text-sm font-medium text-primary underline"
              >
                Limpiar filtros
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {pagedProducts.map((product) => (
                  <CatalogProductCard
                    key={product.id}
                    product={product}
                    onClick={() => router.push(`/producto/${product.id}`)}
                    onAdd={() => handleAdd(product)}
                  />
                ))}
              </div>
              {hasMore && (
                <div className="mt-8 flex justify-center">
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Cargar más
                  </Button>
                </div>
              )}
            </>
          )}
        </main>

        <CategorySidebar
          open={catSidebarOpen}
          onClose={() => setCatSidebarOpen(false)}
          categories={categories}
          selected={selectedCategory}
          onSelect={(id) => {
            setSelectedCategory(id);
            setSelectedSubcategory("todos");
          }}
          subcategories={subcategories}
          selectedSub={selectedSubcategory}
          onSelectSub={(id) => {
            setSelectedSubcategory(id);
            setCatSidebarOpen(false);
          }}
        />
        <FilterSidebar
          open={filterSidebarOpen}
          onClose={() => setFilterSidebarOpen(false)}
          brands={brands}
          selectedBrand={selectedBrand}
          onSelectBrand={(id) => {
            setSelectedBrand(id);
            setFilterSidebarOpen(false);
          }}
          genders={genders}
          selectedGender={selectedGender}
          onSelectGender={(name) => {
            setSelectedGender(name);
            setFilterSidebarOpen(false);
          }}
          onClear={clearFilters}
        />
      </div>
    </LicenseGuard>
  );
}
