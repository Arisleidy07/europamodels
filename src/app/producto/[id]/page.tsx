"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useCatalogData } from "@/hooks/useCatalogData";
import { useSettings } from "@/context/SettingsContext";
import { useCart } from "@/context/CartContext";
import { Header } from "@/components/Header";
import { formatCurrency, cn, shareContent, downloadFile } from "@/lib/utils";
import { getOlfactoryNotes } from "@/lib/olfactory";
import {
  Share2,
  Download,
  Plus,
  Check,
  ChevronLeft,
  ChevronRight,
  Droplets,
  Wind,
  Heart,
  Layers,
  ZoomIn,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
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

export default function PublicProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { products, loading } = useCatalogData();
  const { settings } = useSettings();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<ProductWithRelations | null>(null);
  const [currentImage, setCurrentImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    null,
  );
  const [added, setAdded] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [olfactoryNotes, setOlfactoryNotes] = useState<OlfactoryNote[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getOlfactoryNotes()
      .then(setOlfactoryNotes)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!id) return;
    const found = products.find((p) => p.id === id);
    if (found) {
      setProduct(found);
      setCurrentImage(0);
      setSelectedVariant(null);
      setAdded(false);
    }
  }, [id, products]);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-white px-6 text-center">
        <h1 className="text-2xl font-bold text-foreground">
          Producto no encontrado
        </h1>
        <p className="mt-2 text-muted-foreground">
          El enlace que abriste no es válido.
        </p>
        <Button className="mt-6" onClick={() => router.push("/catalogo")}>
          Ver catálogo
        </Button>
      </div>
    );
  }

  const images =
    product.imagenes.length > 0
      ? product.imagenes
      : ["/placeholder-product.svg"];
  const variants = product.variantes || [];
  const displayPrice =
    selectedVariant?.precio || product.precioOferta || product.precio || 0;
  const discountPct =
    product.precioOferta && product.precioOferta > 0
      ? Math.round(
          ((product.precio - product.precioOferta) / product.precio) * 100,
        )
      : 0;

  const next = () => setCurrentImage((i) => (i + 1) % images.length);
  const prev = () =>
    setCurrentImage((i) => (i - 1 + images.length) % images.length);

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
    toast.success("Agregado al carrito");
    setTimeout(() => setAdded(false), 2500);
  };

  const handleShare = async () => {
    const ok = await shareContent(
      {
        title: product.nombre,
        text: settings.empresa.descripcion,
        url: window.location.href,
      },
      () => toast.success("Enlace copiado"),
    );
    if (!ok) toast.error("No se pudo compartir");
  };

  const handleDownloadImage = async () => {
    const url = images[currentImage];
    if (!url) return;
    const name = `${product.nombre.replace(/[^a-z0-9]/gi, "_")}_${currentImage + 1}.jpg`;
    await downloadFile(url, name);
    toast.success("Descargando imagen");
  };

  const getNotesForIds = (ids: string[] | undefined) =>
    (ids || [])
      .map((nid) => olfactoryNotes.find((n) => n.id === nid))
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

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Global Header */}
      <Header
        search={search}
        onSearchChange={setSearch}
        onSelectProduct={(p) => router.push(`/producto/${p.id}`)}
      />

      {/* Breadcrumb — desktop only */}
      <div className="hidden border-b border-border bg-white sm:block">
        <div className="mx-auto flex max-w-7xl items-center px-6 py-2.5 lg:px-10">
          <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <button
              onClick={() => router.push("/catalogo")}
              className="transition-colors hover:text-foreground"
            >
              Catálogo
            </button>
            <ChevronRight className="h-3.5 w-3.5" />
            {product.categoria && (
              <>
                <span>{product.categoria.nombre}</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </>
            )}
            <span className="max-w-[260px] truncate font-medium text-foreground">
              {product.nombre}
            </span>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-4 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-10 xl:grid-cols-[1fr_480px]">
          {/* ── Left: Gallery ── */}
          <div className="space-y-3">
            {/* Main image */}
            <div
              className="group relative cursor-zoom-in overflow-hidden rounded-2xl border border-border bg-white shadow-sm"
              onClick={() => setLightboxOpen(true)}
              style={{ aspectRatio: "1 / 1" }}
            >
              <motion.img
                key={currentImage}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.18 }}
                src={images[currentImage]}
                alt={product.nombre}
                className="h-full w-full object-contain p-4 transition-transform duration-300 group-hover:scale-[1.04] sm:p-8"
              />

              {/* Zoom hint */}
              <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                <ZoomIn className="h-3 w-3" /> Ampliar
              </div>

              {/* Badges */}
              <div className="absolute left-3 top-3 flex flex-col gap-1.5">
                {product.oferta && discountPct > 0 && (
                  <span className="rounded-full bg-red-500 px-2.5 py-1 text-xs font-bold text-white shadow">
                    -{discountPct}%
                  </span>
                )}
                {product.nuevo && (
                  <span className="rounded-full bg-blue-500 px-2.5 py-1 text-xs font-bold text-white shadow">
                    Nuevo
                  </span>
                )}
              </div>

              {/* Gallery arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      prev();
                    }}
                    className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-md opacity-0 transition-all group-hover:opacity-100 hover:scale-110"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      next();
                    }}
                    className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-md opacity-0 transition-all group-hover:opacity-100 hover:scale-110"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  {/* Dots */}
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
                </>
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
                      "h-[72px] w-[72px] shrink-0 overflow-hidden rounded-xl border-2 bg-white transition-all sm:h-20 sm:w-20",
                      idx === currentImage
                        ? "border-primary shadow-sm ring-2 ring-primary/20"
                        : "border-border opacity-50 hover:opacity-100",
                    )}
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

            {/* Informative image — desktop under gallery */}
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

          {/* ── Right: Product Info ── */}
          <div className="flex flex-col gap-4">
            {/* Header info */}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                {product.codigoInterno && (
                  <span className="rounded-md bg-muted px-2.5 py-1 font-mono text-[11px] font-semibold text-muted-foreground">
                    #{product.codigoInterno}
                  </span>
                )}
                {product.sku && product.sku !== product.codigoInterno && (
                  <span className="rounded-md bg-muted px-2.5 py-1 font-mono text-[11px] text-muted-foreground">
                    SKU: {product.sku}
                  </span>
                )}
                {product.estado === "agotado" && (
                  <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600">
                    Agotado
                  </span>
                )}
              </div>

              {product.marca && (
                <p className="mt-2.5 text-xs font-bold uppercase tracking-[0.15em] text-primary">
                  {product.marca.nombre}
                </p>
              )}

              <h1 className="mt-1 text-2xl font-bold leading-tight text-foreground sm:text-3xl lg:text-4xl">
                {product.nombre}
              </h1>

              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                {product.categoria && <Badge>{product.categoria.nombre}</Badge>}
                {product.subcategoria && (
                  <Badge variant="info">{product.subcategoria.nombre}</Badge>
                )}
                {product.genero && product.genero !== "unisex" && (
                  <Badge variant="default">{product.genero}</Badge>
                )}
              </div>
            </div>

            {/* Price */}
            {settings.catalogo.mostrarPrecio && (
              <div className="rounded-2xl border border-border bg-white p-4 shadow-sm sm:p-5">
                <div className="flex flex-wrap items-baseline gap-3">
                  <span className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                    {formatCurrency(displayPrice)}
                  </span>
                  {product.precioOferta &&
                    product.precioOferta > 0 &&
                    !selectedVariant && (
                      <span className="text-base text-muted-foreground line-through sm:text-lg">
                        {formatCurrency(product.precio)}
                      </span>
                    )}
                  {discountPct > 0 && !selectedVariant && (
                    <span className="rounded-full bg-green-50 px-2.5 py-1 text-sm font-bold text-green-700">
                      Ahorra {discountPct}%
                    </span>
                  )}
                </div>
                {settings.catalogo.mostrarStock && (
                  <div className="mt-3 flex items-center gap-2">
                    <div
                      className={cn(
                        "h-2 w-2 rounded-full",
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
              <div className="rounded-2xl border border-border bg-white p-4 shadow-sm sm:p-5">
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
                        "flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition-all",
                        selectedVariant?.id === v.id
                          ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20"
                          : "border-border bg-white text-foreground hover:border-primary/40",
                      )}
                    >
                      {v.imagen && (
                        <img
                          src={v.imagen}
                          alt=""
                          className="h-5 w-5 rounded object-cover"
                        />
                      )}
                      {v.nombre}
                      {v.precio && (
                        <span className="text-xs text-muted-foreground">
                          {formatCurrency(v.precio)}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* CTA — Add to cart + Share (single share button here only) */}
            <div className="flex gap-2.5">
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
                    <Check className="mr-2 h-5 w-5" /> Agregado
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
                className="shrink-0 px-4"
                title="Compartir"
              >
                <Share2 className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={handleDownloadImage}
                className="shrink-0 px-4"
                title="Descargar imagen"
              >
                <Download className="h-5 w-5" />
              </Button>
            </div>

            {/* Description */}
            {product.descripcion && (
              <div className="rounded-2xl border border-border bg-white p-4 shadow-sm sm:p-5">
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Descripción
                </h3>
                <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/80">
                  {product.descripcion}
                </p>
              </div>
            )}

            {/* Olfactory pyramid */}
            {hasOlfactory && (
              <div className="rounded-2xl border border-border bg-white p-4 shadow-sm sm:p-5">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-foreground">
                  <Droplets className="h-4 w-4 text-primary" /> Pirámide
                  Olfativa
                </h3>
                <div className="space-y-5">
                  {acordesSorted.length > 0 && (
                    <div>
                      <p className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        <Layers className="h-3.5 w-3.5" /> Acordes principales
                      </p>
                      <div className="space-y-2">
                        {acordesSorted.map(({ id: aid, intensidad }) => {
                          const nombre = olfactoryNotes.find(
                            (n) => n.id === aid,
                          )?.nombre;
                          if (!nombre) return null;
                          const color = intensityColorFn(intensidad);
                          return (
                            <div key={aid}>
                              <div className="mb-1 flex justify-between text-xs">
                                <span className="font-medium text-foreground">
                                  {nombre}
                                </span>
                                <span className="font-bold" style={{ color }}>
                                  {intensidad}%
                                </span>
                              </div>
                              <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                                <div
                                  className="h-full rounded-full"
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
                    <NoteRow
                      title="Notas de salida"
                      icon={Wind}
                      notes={notasSalida}
                    />
                  )}
                  {notasCorazon.length > 0 && (
                    <NoteRow
                      title="Notas de corazón"
                      icon={Heart}
                      notes={notasCorazon}
                    />
                  )}
                  {notasFondo.length > 0 && (
                    <NoteRow
                      title="Notas de fondo"
                      icon={Droplets}
                      notes={notasFondo}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Informative image — mobile/tablet below info */}
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
                <div className="absolute bottom-6 right-6 text-sm font-medium text-white/60">
                  {currentImage + 1} / {images.length}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NoteRow({
  title,
  icon: Icon,
  notes,
}: {
  title: string;
  icon: React.ElementType;
  notes: OlfactoryNote[];
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <div className="flex flex-wrap gap-3">
        {notes.map((note) => (
          <div
            key={note.id}
            className="flex flex-col items-center gap-1 rounded-xl border border-border p-3"
          >
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-gray-50">
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
            <span className="text-center text-[10px] font-medium text-foreground">
              {note.nombre}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
