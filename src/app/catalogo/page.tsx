"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Plus,
  Share2,
  SlidersHorizontal,
  Package,
} from "lucide-react";
import { Header } from "@/components/Header";
import { SearchBar } from "@/components/SearchBar";
import { ProductCard } from "@/components/ProductCard";
import { CartDrawer } from "@/components/CartDrawer";
import { QuoteForm } from "@/components/QuoteForm";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useCatalogData } from "@/hooks/useCatalogData";
import { useSyncQueue } from "@/hooks/useSyncQueue";
import { useCart } from "@/context/CartContext";
import { useSettings } from "@/context/SettingsContext";
import { normalizeText, formatCurrency, cn } from "@/lib/utils";
import { LicenseGuard } from "@/components/LicenseGuard";
import type { ProductWithRelations } from "@/types";
import toast from "react-hot-toast";

/* ─── Product Detail Modal (centered, full view) ─── */
function ProductModal({
  product,
  onClose,
}: {
  product: ProductWithRelations | null;
  onClose: () => void;
}) {
  const { settings } = useSettings();
  const { addToCart } = useCart();
  const [currentImage, setCurrentImage] = useState(0);

  if (!product) return null;

  const images =
    product.imagenes.length > 0
      ? product.imagenes
      : ["/placeholder-product.svg"];

  const handleAdd = () => {
    addToCart({
      productoId: product.id,
      nombre: product.nombre,
      imagen: images[0],
      precio: product.precioOferta || product.precio,
      cantidad: 1,
    });
    toast.success("Producto agregado", { duration: 2000 });
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/producto/${product.id}`;
    if (navigator.share) {
      await navigator.share({
        title: product.nombre,
        text: `${product.nombre} - ${settings.empresa.nombre}`,
        url,
      });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Enlace copiado");
    }
  };

  const nextImage = () => setCurrentImage((i) => (i + 1) % images.length);
  const prevImage = () =>
    setCurrentImage((i) => (i - 1 + images.length) % images.length);

  return (
    <AnimatePresence>
      {product && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 28, stiffness: 350 }}
            className="fixed inset-4 z-50 mx-auto flex max-h-[92vh] max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl sm:inset-8 md:inset-12 lg:inset-16"
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-border/50 px-6 py-4">
              <h2 className="text-lg font-semibold text-foreground">
                Detalle del producto
              </h2>
              <button
                onClick={onClose}
                className="rounded-full p-2 transition-colors hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
              <div className="grid gap-0 md:grid-cols-2">
                {/* Gallery */}
                <div className="relative bg-gray-50 p-6 md:p-8">
                  <div className="relative aspect-square w-full overflow-hidden rounded-2xl">
                    <img
                      src={images[currentImage]}
                      alt={product.nombre}
                      className="h-full w-full object-contain"
                    />
                    {images.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-md transition-transform hover:scale-110"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                          onClick={nextImage}
                          className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-md transition-transform hover:scale-110"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </>
                    )}
                  </div>
                  {images.length > 1 && (
                    <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                      {images.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentImage(idx)}
                          className={cn(
                            "h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all",
                            idx === currentImage
                              ? "border-primary ring-2 ring-primary/20"
                              : "border-transparent opacity-70 hover:opacity-100",
                          )}
                        >
                          <img
                            src={img}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex flex-col p-6 md:p-8">
                  {product.marca && (
                    <p className="text-xs font-bold uppercase tracking-widest text-primary">
                      {product.marca.nombre}
                    </p>
                  )}
                  <h1 className="mt-2 text-2xl font-bold leading-tight text-foreground md:text-3xl">
                    {product.nombre}
                  </h1>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {product.categoria && (
                      <Badge>{product.categoria.nombre}</Badge>
                    )}
                    {product.subcategoria && (
                      <Badge variant="info">
                        {product.subcategoria.nombre}
                      </Badge>
                    )}
                    {product.genero && product.genero !== "unisex" && (
                      <Badge variant="default">{product.genero}</Badge>
                    )}
                    {product.estado === "agotado" && (
                      <Badge variant="danger">Agotado</Badge>
                    )}
                  </div>

                  {settings.catalogo.mostrarPrecio && (
                    <div className="mt-6 flex items-baseline gap-3">
                      <span className="text-3xl font-bold text-foreground">
                        {formatCurrency(product.precioOferta || product.precio)}
                      </span>
                      {product.precioOferta && product.precioOferta > 0 && (
                        <span className="text-lg text-muted-foreground line-through">
                          {formatCurrency(product.precio)}
                        </span>
                      )}
                      {product.oferta && (
                        <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-bold text-green-600">
                          Oferta
                        </span>
                      )}
                    </div>
                  )}

                  {settings.catalogo.mostrarStock && (
                    <div className="mt-3 flex items-center gap-2">
                      <div
                        className={cn(
                          "h-2 w-2 rounded-full",
                          product.stock > 0 ? "bg-green-500" : "bg-red-500",
                        )}
                      />
                      <span className="text-sm text-muted-foreground">
                        {product.stock > 0
                          ? `${product.stock} disponible${product.stock !== 1 ? "s" : ""}`
                          : "Agotado"}
                      </span>
                    </div>
                  )}

                  {product.descripcion && (
                    <div className="mt-6 border-t border-border/50 pt-5">
                      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        Descripción
                      </h3>
                      <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/80">
                        {product.descripcion}
                      </p>
                    </div>
                  )}

                  {/* Spacer */}
                  <div className="flex-1" />

                  {/* Actions */}
                  <div className="mt-6 flex items-center gap-3">
                    <Button
                      size="lg"
                      className="flex-[2]"
                      onClick={handleAdd}
                      disabled={product.estado === "agotado"}
                    >
                      <Plus className="mr-2 h-5 w-5" />
                      {product.estado === "agotado"
                        ? "Agotado"
                        : "Agregar al carrito"}
                    </Button>
                    <Button variant="outline" size="lg" onClick={handleShare}>
                      <Share2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ─── Main Catalog Page ─── */
export default function CatalogoPage() {
  const router = useRouter();
  const { products, categories, subcategories, brands, loading } =
    useCatalogData();
  const { addToCart } = useCart();
  const { settings } = useSettings();
  useSyncQueue();

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("todos");
  const [selectedSubcategory, setSelectedSubcategory] =
    useState<string>("todos");
  const [selectedBrand, setSelectedBrand] = useState<string>("todos");
  const [selectedGender, setSelectedGender] = useState<string>("todos");
  const [selectedProduct, setSelectedProduct] =
    useState<ProductWithRelations | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [quoteFormOpen, setQuoteFormOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const activeFilterCount = [selectedBrand, selectedGender].filter(
    (v) => v !== "todos",
  ).length;

  const filteredProducts = useMemo(() => {
    const term = normalizeText(search);
    return products.filter((p) => {
      const matchesSearch =
        !term ||
        normalizeText(p.nombre).includes(term) ||
        normalizeText(p.marca?.nombre || "").includes(term) ||
        normalizeText(p.categoria?.nombre || "").includes(term) ||
        normalizeText(p.subcategoria?.nombre || "").includes(term) ||
        normalizeText(p.codigoInterno || "").includes(term) ||
        normalizeText(p.sku || "").includes(term) ||
        p.etiquetas.some((t) => normalizeText(t).includes(term)) ||
        normalizeText(p.descripcion || "").includes(term);

      const matchesCategory =
        selectedCategory === "todos" || p.categoriaId === selectedCategory;
      const matchesSubcategory =
        selectedSubcategory === "todos" ||
        p.subcategoriaId === selectedSubcategory;
      const matchesBrand =
        selectedBrand === "todos" || p.marcaId === selectedBrand;
      const matchesGender =
        selectedGender === "todos" || p.genero === selectedGender;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesSubcategory &&
        matchesBrand &&
        matchesGender
      );
    });
  }, [
    products,
    search,
    selectedCategory,
    selectedSubcategory,
    selectedBrand,
    selectedGender,
  ]);

  const availableSubcategories = useMemo(() => {
    if (selectedCategory === "todos") return [];
    return subcategories.filter(
      (s) => s.categoriaId === selectedCategory && s.activo,
    );
  }, [subcategories, selectedCategory]);

  const handleAdd = (product: ProductWithRelations) => {
    addToCart({
      productoId: product.id,
      nombre: product.nombre,
      imagen: product.imagenes[0] || "/placeholder-product.svg",
      precio: product.precioOferta || product.precio,
      cantidad: 1,
    });
    toast.success(`${product.nombre} agregado`, { duration: 2000 });
  };

  const handleQuoteCreated = (quote: { codigo: string; id: string }) => {
    setQuoteFormOpen(false);
    setCartOpen(false);
    toast.success(`Cotización ${quote.codigo} creada`);
    setTimeout(() => {
      const url = `${window.location.origin}/cotizacion/${quote.codigo}`;
      const text = `${settings.cotizaciones.mensajeAutomatico}\n\nCotización: ${quote.codigo}\n${url}`;
      if (navigator.share) {
        navigator.share({
          title: `Cotización ${quote.codigo}`,
          text,
          url,
        });
      } else {
        navigator.clipboard.writeText(text);
        toast.success("Enlace copiado al portapapeles");
      }
    }, 600);
  };

  const clearFilters = () => {
    setSelectedBrand("todos");
    setSelectedGender("todos");
    setSelectedCategory("todos");
    setSelectedSubcategory("todos");
    setSearch("");
  };

  return (
    <LicenseGuard>
      <div className="flex min-h-screen flex-col bg-background">
        <Header
          search={search}
          onSearchChange={setSearch}
          onOpenCart={() => setCartOpen(true)}
        />

        {/* Categories bar */}
        <div className="border-b border-border bg-white">
          {/* Mobile search */}
          <div className="px-4 pt-3 md:hidden">
            <SearchBar value={search} onChange={setSearch} />
          </div>

          {/* Category pills */}
          <div className="px-4 py-3 lg:px-8">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => {
                  setSelectedCategory("todos");
                  setSelectedSubcategory("todos");
                }}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-all",
                  selectedCategory === "todos"
                    ? "bg-foreground text-white shadow-md"
                    : "bg-muted/60 text-foreground hover:bg-muted",
                )}
              >
                <Package className="h-3.5 w-3.5" />
                Todos
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setSelectedSubcategory("todos");
                  }}
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-all",
                    selectedCategory === cat.id
                      ? "shadow-md"
                      : "bg-muted/60 text-foreground hover:bg-muted",
                  )}
                  style={
                    selectedCategory === cat.id
                      ? {
                          backgroundColor: cat.color || "#2563eb",
                          color: "#fff",
                        }
                      : undefined
                  }
                >
                  <div
                    className={cn(
                      "h-2.5 w-2.5 rounded-full",
                      selectedCategory === cat.id && "bg-white/40",
                    )}
                    style={
                      selectedCategory !== cat.id
                        ? { backgroundColor: cat.color || "#2563eb" }
                        : undefined
                    }
                  />
                  {cat.nombre}
                </button>
              ))}
            </div>

            {/* Subcategories */}
            {availableSubcategories.length > 0 && (
              <div className="mt-2 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <button
                  onClick={() => setSelectedSubcategory("todos")}
                  className={cn(
                    "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                    selectedSubcategory === "todos"
                      ? "border-foreground bg-foreground/5 text-foreground"
                      : "border-border text-muted-foreground hover:border-foreground/30",
                  )}
                >
                  Todos
                </button>
                {availableSubcategories.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => setSelectedSubcategory(sub.id)}
                    className={cn(
                      "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                      selectedSubcategory === sub.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/30",
                    )}
                  >
                    {sub.nombre}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <main className="flex-1 px-4 py-5 lg:px-8">
          {/* Toolbar */}
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">
                {filteredProducts.length}
              </span>{" "}
              producto{filteredProducts.length !== 1 ? "s" : ""}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition-all",
                  showFilters || activeFilterCount > 0
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border text-muted-foreground hover:border-foreground/30",
                )}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filtros
                {activeFilterCount > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              {(activeFilterCount > 0 ||
                selectedCategory !== "todos" ||
                search) && (
                <button
                  onClick={clearFilters}
                  className="text-xs font-medium text-muted-foreground underline hover:text-foreground"
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>

          {/* Filters panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="mb-5 overflow-hidden"
              >
                <div className="grid gap-3 rounded-2xl border border-border bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Marca
                    </label>
                    <select
                      value={selectedBrand}
                      onChange={(e) => setSelectedBrand(e.target.value)}
                      className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm font-medium outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="todos">Todas las marcas</option>
                      {brands.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Género
                    </label>
                    <select
                      value={selectedGender}
                      onChange={(e) => setSelectedGender(e.target.value)}
                      className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm font-medium outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="todos">Todos</option>
                      <option value="hombre">Hombre</option>
                      <option value="mujer">Mujer</option>
                      <option value="unisex">Unisex</option>
                      <option value="ninos">Niños</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {loading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: 10 }).map((_, i) => (
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
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onClick={() => setSelectedProduct(product)}
                  onAdd={() => handleAdd(product)}
                />
              ))}
            </div>
          )}
        </main>

        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
        <CartDrawer
          open={cartOpen}
          onClose={() => setCartOpen(false)}
          onCreateQuote={() => setQuoteFormOpen(true)}
        />
        <QuoteForm
          open={quoteFormOpen}
          onClose={() => setQuoteFormOpen(false)}
          onQuoteCreated={(q) =>
            handleQuoteCreated({ codigo: q.codigo, id: q.id })
          }
        />
      </div>
    </LicenseGuard>
  );
}
