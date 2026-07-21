"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useCatalogData } from "@/hooks/useCatalogData";
import { useSettings } from "@/context/SettingsContext";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { Header } from "@/components/Header";
import {
  ProductImageGallery,
  type GalleryImage,
} from "@/components/ProductImageGallery";
import { formatCurrency, cn, shareContent } from "@/lib/utils";
import {
  Share2,
  Plus,
  Check,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
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
  const { products, olfactoryNotes, sizes, loading } = useCatalogData();
  const { settings } = useSettings();
  const { addToCart, openCartDrawer } = useCart();
  const { user, hasPermission } = useAuth();
  const isAdmin =
    user?.rol === "administrador" ||
    hasPermission("productos", "crear") ||
    hasPermission("productos", "editar");

  const [product, setProduct] = useState<ProductWithRelations | null>(null);
  const [currentImage, setCurrentImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    null,
  );
  const [selectedTalla, setSelectedTalla] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!id) {
      setProduct(null);
      return;
    }
    const found = products.find((p) => p.id === id) || null;
    setProduct(found);
    setCurrentImage(0);
    setSelectedVariant(null);
    setSelectedTalla(null);
    setAdded(false);
  }, [id, products]);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);

  const galleryImages = useMemo<GalleryImage[]>(
    () =>
      (product?.imagenes.length
        ? product.imagenes
        : ["/placeholder-product.svg"]
      ).map((url, index) => ({
        id: `public-${product?.id ?? "pending"}-${index}`,
        url,
      })),
    [product?.id, product?.imagenes],
  );

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (
    !product ||
    (!isAdmin && (product.estado === "borrador" || product.estado === "oculto"))
  ) {
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

  const productTallas = useMemo(
    () => new Set(product.tallas || []),
    [product.tallas],
  );

  const handleAdd = () => {
    const hasTallas = sizes.some((s) => productTallas.has(s.id));
    if (hasTallas && !selectedTalla) {
      toast.error("Selecciona una talla");
      return;
    }
    const tallaName = selectedTalla
      ? sizes.find((s) => s.id === selectedTalla)?.nombre
      : undefined;
    addToCart({
      productoId: product.id,
      nombre:
        product.nombre +
        (selectedVariant ? ` - ${selectedVariant.nombre}` : ""),
      imagen: images[0],
      precio: displayPrice,
      cantidad: 1,
      talla: tallaName,
    });
    setAdded(true);
    toast.success("Agregado al carrito");
    setTimeout(() => setAdded(false), 2500);
  };

  const handleShare = async () => {
    const ok = await shareContent(
      {
        title: product.nombre,
        text: `${product.nombre} - ${settings.empresa.nombre}`,
        url: window.location.href,
      },
      () => toast.success("Enlace copiado"),
    );
    if (!ok) toast.error("No se pudo compartir");
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
        onOpenCart={openCartDrawer}
        onSelectProduct={(p) => router.push(`/producto/${p.id}`)}
      />

      {/* Breadcrumb — desktop only */}
      <div className="hidden border-b border-border bg-white sm:block">
        <div className="mx-auto flex max-w-7xl items-center px-6 py-2.5 lg:px-10">
          <button
            onClick={() => router.push("/catalogo")}
            className="mr-3 flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-muted"
            aria-label="Volver al catálogo"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span className="transition-colors hover:text-foreground">
              Catálogo
            </span>
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
        <button
          onClick={() => router.push("/catalogo")}
          className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground transition-colors hover:text-primary sm:hidden"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al catálogo
        </button>
        <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr] lg:gap-10 xl:grid-cols-[1.25fr_440px]">
          {/* ── Left: Gallery ── */}
          <div className="space-y-3">
            <ProductImageGallery
              images={galleryImages}
              onCurrentImageChange={setCurrentImage}
              productName={product.nombre}
              aspectRatio="1 / 1"
            />

            {/* Badges */}
            <div className="flex gap-1.5">
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

            {/* Sizes */}
            {sizes.length > 0 && (
              <div className="rounded-2xl border border-border bg-white p-4 shadow-sm sm:p-5">
                <p className="mb-3 text-sm font-semibold text-foreground">
                  Talla
                </p>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((size) => {
                    const available = productTallas.has(size.id);
                    const selected = selectedTalla === size.id;
                    return (
                      <button
                        key={size.id}
                        type="button"
                        disabled={!available}
                        onClick={() =>
                          setSelectedTalla(selected ? null : size.id)
                        }
                        className={cn(
                          "rounded-xl border px-4 py-2 text-sm font-medium transition-all",
                          selected
                            ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20"
                            : available
                              ? "border-border bg-white text-foreground hover:border-primary/40"
                              : "border-border bg-muted/40 text-muted-foreground cursor-not-allowed",
                        )}
                      >
                        {size.nombre}
                      </button>
                    );
                  })}
                </div>
                {selectedTalla && (
                  <p className="mt-2 text-xs text-primary">
                    Talla seleccionada:{" "}
                    {sizes.find((s) => s.id === selectedTalla)?.nombre}
                  </p>
                )}
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

            {/* Admin-only reference code */}
            {isAdmin && (product.codigoInterno || product.sku) && (
              <div className="rounded-2xl border border-dashed border-border bg-gray-50 p-4 text-xs text-muted-foreground">
                <p className="mb-1 font-semibold uppercase tracking-wide">
                  Referencia interna
                </p>
                {product.codigoInterno && (
                  <p>
                    Código:{" "}
                    <span className="font-mono font-medium text-foreground">
                      {product.codigoInterno}
                    </span>
                  </p>
                )}
                {product.sku && product.sku !== product.codigoInterno && (
                  <p className="mt-0.5">
                    SKU:{" "}
                    <span className="font-mono font-medium text-foreground">
                      {product.sku}
                    </span>
                  </p>
                )}
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
