"use client";

import React, { useState, useMemo, useEffect } from "react";
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
  Droplets,
  Wind,
  Heart,
  Layers,
} from "lucide-react";
import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useCatalogData } from "@/hooks/useCatalogData";
import { useSyncQueue } from "@/hooks/useSyncQueue";
import { useCart } from "@/context/CartContext";
import { useSettings } from "@/context/SettingsContext";
import { normalizeText, formatCurrency, cn } from "@/lib/utils";
import { getOlfactoryNotes } from "@/lib/olfactory";
import { LicenseGuard } from "@/components/LicenseGuard";
import type {
  ProductWithRelations,
  ProductVariant,
  OlfactoryNote,
} from "@/types";
import toast from "react-hot-toast";

function intensityColorFn(v: number): string {
  if (v >= 90) return "#16a34a";
  if (v >= 70) return "#4ade80";
  if (v >= 50) return "#ca8a04";
  if (v >= 30) return "#ea580c";
  return "#dc2626";
}

/* ─── Product Detail Modal (stays below sticky Header) ─── */
function ProductModal({
  product,
  onClose,
  olfactoryNotes,
  onSelectProduct,
}: {
  product: ProductWithRelations | null;
  onClose: () => void;
  olfactoryNotes: OlfactoryNote[];
  onSelectProduct?: (p: ProductWithRelations) => void;
}) {
  const { settings } = useSettings();
  const { addToCart } = useCart();
  const [currentImage, setCurrentImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    null,
  );
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [added, setAdded] = useState(false);

  // Reset state when product changes
  useEffect(() => {
    setCurrentImage(0);
    setSelectedVariant(null);
    setAdded(false);
  }, [product?.id]);

  // Close on Escape
  useEffect(() => {
    if (!product) return;
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [product, onClose]);

  if (!product) return null;

  const variants = product.variantes || [];
  const images =
    product.imagenes.length > 0
      ? product.imagenes
      : ["/placeholder-product.svg"];

  const getNotesForIds = (ids: string[] | undefined) =>
    (ids || [])
      .map((id) => olfactoryNotes.find((n) => n.id === id))
      .filter(Boolean) as OlfactoryNote[];

  const acordesSorted = [...(product.acordes || [])].sort(
    (a, b) => b.intensidad - a.intensidad,
  );
  const notasSalida = getNotesForIds(product.notasSalida);
  const notasCorazon = getNotesForIds(product.notasCorazon);
  const notasFondo = getNotesForIds(product.notasFondo);
  const hasOlfactory =
    acordesSorted.length > 0 ||
    notasSalida.length > 0 ||
    notasCorazon.length > 0 ||
    notasFondo.length > 0;

  const displayPrice =
    selectedVariant?.precio || product.precioOferta || product.precio;
  const discountPct =
    product.precioOferta && product.precioOferta > 0
      ? Math.round(
          ((product.precio - product.precioOferta) / product.precio) * 100,
        )
      : 0;

  const handleAdd = () => {
    addToCart({
      productoId: product.id,
      nombre:
        product.nombre +
        (selectedVariant ? ` - ${selectedVariant.nombre}` : ""),
      imagen: images[0],
      precio: displayPrice,
      cantidad: 1,
    });
    setAdded(true);
    toast.success("Producto agregado", { duration: 2000 });
    setTimeout(() => setAdded(false), 2500);
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

  const next = () => setCurrentImage((i) => (i + 1) % images.length);
  const prev = () =>
    setCurrentImage((i) => (i - 1 + images.length) % images.length);

  return (
    <AnimatePresence>
      {product && (
        <>
          {/* Overlay — starts below sticky header (top-16 = 64px) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-x-0 bottom-0 top-16 z-40 overflow-y-auto bg-gray-50"
          >
            {/* Breadcrumb bar */}
            <div className="sticky top-0 z-10 border-b border-border bg-white/95 backdrop-blur-sm">
              <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-8">
                <button
                  onClick={onClose}
                  className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Volver al catálogo
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleShare}
                    className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Compartir</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Main content */}
            <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-10">
              <div className="grid gap-8 lg:grid-cols-[1fr_420px] xl:grid-cols-[1fr_460px]">
                {/* ── Left: Gallery ── */}
                <div className="space-y-3">
                  {/* Main image */}
                  <div
                    className="group relative aspect-square cursor-zoom-in overflow-hidden rounded-2xl border border-border bg-white shadow-sm"
                    onClick={() => setLightboxOpen(true)}
                  >
                    <motion.img
                      key={currentImage}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                      src={images[currentImage]}
                      alt={product.nombre}
                      className="h-full w-full object-contain p-6 transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                    {/* Zoom hint */}
                    <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                      <ChevronRight className="h-3 w-3" /> Ver ampliado
                    </div>
                    {/* Offer badge */}
                    {product.oferta && discountPct > 0 && (
                      <div className="absolute left-4 top-4 rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white shadow">
                        -{discountPct}%
                      </div>
                    )}
                    {product.nuevo && (
                      <div className="absolute right-4 top-4 rounded-full bg-blue-500 px-3 py-1 text-xs font-bold text-white shadow">
                        Nuevo
                      </div>
                    )}
                    {/* Nav arrows */}
                    {images.length > 1 && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            prev();
                          }}
                          className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-md opacity-0 transition-all group-hover:opacity-100 hover:scale-110"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            next();
                          }}
                          className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-md opacity-0 transition-all group-hover:opacity-100 hover:scale-110"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </>
                    )}
                    {/* Dot indicators */}
                    {images.length > 1 && (
                      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5">
                        {images.map((_, i) => (
                          <button
                            key={i}
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentImage(i);
                            }}
                            className={cn(
                              "h-1.5 rounded-full transition-all",
                              i === currentImage
                                ? "w-5 bg-primary"
                                : "w-1.5 bg-black/20 hover:bg-black/40",
                            )}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Thumbnails */}
                  {images.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {images.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentImage(idx)}
                          className={cn(
                            "h-18 w-18 shrink-0 overflow-hidden rounded-xl border-2 bg-white transition-all",
                            idx === currentImage
                              ? "border-primary shadow-md ring-2 ring-primary/20"
                              : "border-border opacity-55 hover:opacity-100",
                          )}
                          style={{ height: 72, width: 72 }}
                        >
                          <img
                            src={img}
                            alt=""
                            className="h-full w-full object-contain p-1"
                          />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Informative image — desktop */}
                  {product.imagenInformativa && (
                    <div className="hidden overflow-hidden rounded-2xl border border-border bg-white shadow-sm lg:block">
                      <img
                        src={product.imagenInformativa}
                        alt="Imagen informativa"
                        className="w-full object-cover"
                      />
                    </div>
                  )}
                </div>

                {/* ── Right: Info ── */}
                <div className="flex flex-col gap-5">
                  {/* Code + Brand + Title */}
                  <div>
                    <div className="flex items-center gap-3">
                      {product.codigoInterno && (
                        <span className="rounded-lg bg-muted px-2.5 py-1 font-mono text-[11px] font-medium text-muted-foreground">
                          {product.codigoInterno}
                        </span>
                      )}
                      {product.estado === "agotado" && (
                        <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600">
                          Agotado
                        </span>
                      )}
                    </div>
                    {product.marca && (
                      <p className="mt-2 text-sm font-bold uppercase tracking-widest text-primary">
                        {product.marca.nombre}
                      </p>
                    )}
                    <h1 className="mt-1 text-2xl font-bold leading-tight text-foreground sm:text-3xl">
                      {product.nombre}
                    </h1>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
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
                    </div>
                  </div>

                  {/* Price */}
                  {settings.catalogo.mostrarPrecio && (
                    <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
                      <div className="flex flex-wrap items-baseline gap-3">
                        <span className="text-3xl font-extrabold text-foreground">
                          {formatCurrency(displayPrice)}
                        </span>
                        {product.precioOferta &&
                          product.precioOferta > 0 &&
                          !selectedVariant && (
                            <span className="text-lg text-muted-foreground line-through">
                              {formatCurrency(product.precio)}
                            </span>
                          )}
                        {discountPct > 0 && !selectedVariant && (
                          <span className="rounded-full bg-green-50 px-2.5 py-1 text-sm font-bold text-green-600">
                            Ahorra {discountPct}%
                          </span>
                        )}
                      </div>
                      {settings.catalogo.mostrarStock && (
                        <div className="mt-3 flex items-center gap-2">
                          <div
                            className={cn(
                              "h-2.5 w-2.5 rounded-full",
                              product.stock > 0 ? "bg-green-500" : "bg-red-400",
                            )}
                          />
                          <span className="text-sm text-muted-foreground">
                            {product.stock > 0
                              ? `${product.stock} unidad${product.stock !== 1 ? "es" : ""} disponible${product.stock !== 1 ? "s" : ""}`
                              : "Sin stock"}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Variants */}
                  {variants.length > 0 && (
                    <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
                      <p className="mb-3 text-sm font-semibold text-foreground">
                        Variantes
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {variants.map((v) => (
                          <button
                            key={v.id}
                            onClick={() =>
                              setSelectedVariant(
                                selectedVariant?.id === v.id ? null : v,
                              )
                            }
                            className={cn(
                              "flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all",
                              selectedVariant?.id === v.id
                                ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20"
                                : "border-border bg-white text-foreground hover:border-primary/40",
                            )}
                          >
                            {v.imagen && (
                              <img
                                src={v.imagen}
                                alt=""
                                className="h-6 w-6 rounded object-cover"
                              />
                            )}
                            {v.nombre}
                            {v.precio && (
                              <span className="ml-1 text-xs text-muted-foreground">
                                {formatCurrency(v.precio)}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add to cart */}
                  <div className="flex gap-3">
                    <Button
                      size="lg"
                      className={cn(
                        "flex-1 text-base font-semibold transition-all",
                        added && "bg-green-600 hover:bg-green-700",
                      )}
                      onClick={handleAdd}
                      disabled={product.estado === "agotado"}
                    >
                      {added ? (
                        <>
                          <ChevronRight className="mr-2 h-5 w-5" /> Agregado
                        </>
                      ) : product.estado === "agotado" ? (
                        "Sin stock"
                      ) : (
                        <>
                          <Plus className="mr-2 h-5 w-5" /> Agregar al carrito
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={handleShare}
                      className="px-4"
                    >
                      <Share2 className="h-5 w-5" />
                    </Button>
                  </div>

                  {/* Description */}
                  {product.descripcion && (
                    <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
                      <h3 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Descripción
                      </h3>
                      <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/80">
                        {product.descripcion}
                      </p>
                    </div>
                  )}

                  {/* Olfactory pyramid — in column on desktop */}
                  {hasOlfactory && (
                    <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
                      <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-foreground">
                        <Droplets className="h-4 w-4 text-primary" />
                        Pirámide Olfativa
                      </h3>
                      <div className="space-y-5">
                        {acordesSorted.length > 0 && (
                          <div>
                            <p className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              <Layers className="h-3.5 w-3.5" /> Acordes
                              principales
                            </p>
                            <div className="space-y-2">
                              {acordesSorted.map(({ id, intensidad }) => {
                                const nombre = olfactoryNotes.find(
                                  (n) => n.id === id,
                                )?.nombre;
                                if (!nombre) return null;
                                const color = intensityColorFn(intensidad);
                                return (
                                  <div key={id}>
                                    <div className="mb-1 flex justify-between text-xs">
                                      <span className="font-medium text-foreground">
                                        {nombre}
                                      </span>
                                      <span
                                        className="font-bold"
                                        style={{ color }}
                                      >
                                        {intensidad}%
                                      </span>
                                    </div>
                                    <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                                      <div
                                        className="h-full rounded-full transition-all"
                                        style={{
                                          width: `${intensidad}%`,
                                          backgroundColor: color,
                                        }}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        {notasSalida.length > 0 && (
                          <OlfactoryDisplay
                            title="Notas de salida"
                            icon={Wind}
                            notes={notasSalida}
                            compact
                          />
                        )}
                        {notasCorazon.length > 0 && (
                          <OlfactoryDisplay
                            title="Notas de corazón"
                            icon={Heart}
                            notes={notasCorazon}
                            compact
                          />
                        )}
                        {notasFondo.length > 0 && (
                          <OlfactoryDisplay
                            title="Notas de fondo"
                            icon={Droplets}
                            notes={notasFondo}
                            compact
                          />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Informative image — mobile */}
                  {product.imagenInformativa && (
                    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm lg:hidden">
                      <img
                        src={product.imagenInformativa}
                        alt="Imagen informativa"
                        className="w-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Lightbox */}
          <AnimatePresence>
            {lightboxOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setLightboxOpen(false)}
                className="fixed inset-0 z-[9999] flex cursor-zoom-out flex-col items-center justify-center bg-black/95 p-4"
              >
                <motion.img
                  key={currentImage}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  src={images[currentImage]}
                  alt={product.nombre}
                  className="max-h-[85vh] max-w-[90vw] rounded-xl object-contain"
                  onClick={(e) => e.stopPropagation()}
                />
                <button
                  onClick={() => setLightboxOpen(false)}
                  className="absolute right-5 top-5 rounded-full bg-white/20 p-2.5 text-white backdrop-blur-sm hover:bg-white/30"
                >
                  <X className="h-6 w-6" />
                </button>
                {images.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        prev();
                      }}
                      className="absolute left-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm hover:bg-white/30"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        next();
                      }}
                      className="absolute right-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm hover:bg-white/30"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>
                    <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2">
                      {images.map((_, i) => (
                        <button
                          key={i}
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentImage(i);
                          }}
                          className={cn(
                            "h-1.5 rounded-full transition-all",
                            i === currentImage
                              ? "w-8 bg-white"
                              : "w-1.5 bg-white/40",
                          )}
                        />
                      ))}
                    </div>
                  </>
                )}
                <div className="absolute bottom-6 right-6 text-sm font-medium text-white/60">
                  {currentImage + 1} / {images.length}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
}

function OlfactoryDisplay({
  title,
  icon: Icon,
  notes,
  compact = false,
}: {
  title: string;
  icon: React.ElementType;
  notes: OlfactoryNote[];
  compact?: boolean;
}) {
  const size = compact ? "h-10 w-10" : "h-12 w-12";
  return (
    <div>
      <div className="mb-2.5 flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-primary" />
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {notes.map((note) => (
          <div
            key={note.id}
            className="flex flex-col items-center gap-1 rounded-xl border border-border bg-gray-50 p-2 shadow-sm"
          >
            <div
              className={cn(
                "flex items-center justify-center overflow-hidden rounded-lg bg-white",
                size,
              )}
            >
              {note.imagen && note.imagen.startsWith("http") ? (
                <img
                  src={note.imagen}
                  alt={note.nombre}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-base text-muted-foreground/30">◆</span>
              )}
            </div>
            <span className="text-center text-[10px] font-medium text-foreground leading-tight max-w-[52px]">
              {note.nombre}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Main Catalog Page ─── */
export default function CatalogoPage() {
  const router = useRouter();
  const { products, categories, subcategories, brands, loading } =
    useCatalogData();
  const { addToCart, openCartDrawer } = useCart();
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
  const [showFilters, setShowFilters] = useState(false);
  const [olfactoryNotes, setOlfactoryNotes] = useState<OlfactoryNote[]>([]);

  useEffect(() => {
    getOlfactoryNotes()
      .then(setOlfactoryNotes)
      .catch(() => {});
  }, []);

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

  const handleQuoteCreated = (_quote: { codigo: string; id: string }) => {};

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
          onOpenCart={openCartDrawer}
          onSelectProduct={(p) => setSelectedProduct(p)}
        />

        {/* Categories bar */}
        <div className="border-b border-border bg-white">
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
          olfactoryNotes={olfactoryNotes}
          onSelectProduct={(p) => setSelectedProduct(p)}
        />
      </div>
    </LicenseGuard>
  );
}
