"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Plus, Share2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useCart } from "@/context/CartContext";
import { useSettings } from "@/context/SettingsContext";
import { formatCurrency, shareContent } from "@/lib/utils";
import toast from "react-hot-toast";
import type { ProductWithRelations } from "@/types";

interface ProductDrawerProps {
  product: ProductWithRelations | null;
  onClose: () => void;
}

export function ProductDrawer({ product, onClose }: ProductDrawerProps) {
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
    const ok = await shareContent(
      {
        title: product.nombre,
        text: `${product.nombre} - ${settings.empresa.nombre}`,
        url: `${window.location.origin}/producto/${product.id}`,
      },
      () => toast.success("Enlace copiado"),
    );
    if (!ok) toast.error("No se pudo compartir");
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
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[92vh] overflow-hidden rounded-t-[2rem] bg-white shadow-2xl md:inset-y-0 md:right-0 md:left-auto md:max-h-none md:w-[45vw] md:rounded-none md:rounded-l-[2rem]"
          >
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <h2 className="text-lg font-semibold">Detalle del producto</h2>
                <button
                  onClick={onClose}
                  className="rounded-full p-2 transition-colors hover:bg-muted"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-gray-50">
                  <img
                    src={images[currentImage]}
                    alt={product.nombre}
                    className="h-full w-full object-contain p-6"
                  />
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-sm"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-sm"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </div>

                {images.length > 1 && (
                  <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
                    {images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImage(idx)}
                        className={`h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 ${
                          idx === currentImage
                            ? "border-primary"
                            : "border-transparent"
                        }`}
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

                <div className="mt-6">
                  {product.marca && (
                    <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                      {product.marca.nombre}
                    </p>
                  )}
                  <h1 className="mt-1 text-2xl font-bold text-foreground">
                    {product.nombre}
                  </h1>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {product.categoria && (
                      <Badge>{product.categoria.nombre}</Badge>
                    )}
                    {product.subcategoria && (
                      <Badge variant="info">
                        {product.subcategoria.nombre}
                      </Badge>
                    )}
                    {product.genero && (
                      <Badge variant="default">{product.genero}</Badge>
                    )}
                    {product.estado === "agotado" && (
                      <Badge variant="danger">Agotado</Badge>
                    )}
                  </div>

                  {settings.catalogo.mostrarPrecio && (
                    <div className="mt-5">
                      <span className="text-3xl font-bold text-foreground">
                        {formatCurrency(product.precioOferta || product.precio)}
                      </span>
                      {product.precioOferta && (
                        <span className="ml-3 text-lg text-muted-foreground line-through">
                          {formatCurrency(product.precio)}
                        </span>
                      )}
                    </div>
                  )}

                  {settings.catalogo.mostrarStock && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      Disponibilidad: {product.stock} unidades
                    </p>
                  )}

                  {product.descripcion && (
                    <div className="mt-6">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        Descripción
                      </h3>
                      <p className="mt-2 whitespace-pre-line text-base leading-relaxed text-foreground">
                        {product.descripcion}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 border-t border-border p-6">
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1"
                  onClick={handleShare}
                >
                  <Share2 className="mr-2 h-5 w-5" /> Compartir
                </Button>
                <Button
                  size="lg"
                  className="flex-[2]"
                  onClick={handleAdd}
                  disabled={product.estado === "agotado"}
                >
                  <Plus className="mr-2 h-5 w-5" /> Agregar
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
