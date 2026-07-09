"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useCatalogData } from "@/hooks/useCatalogData";
import { useSettings } from "@/context/SettingsContext";
import { Logo } from "@/components/Logo";
import { formatCurrency } from "@/lib/utils";
import { Share2, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { ProductWithRelations } from "@/types";
import toast from "react-hot-toast";

export default function PublicProductPage() {
  const { id } = useParams<{ id: string }>();
  const { products, loading } = useCatalogData();
  const { settings } = useSettings();
  const [product, setProduct] = useState<ProductWithRelations | null>(null);
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    if (!id) return;
    const found = products.find((p) => p.id === id);
    if (found) setProduct(found);
  }, [id, products]);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({
        title: product?.nombre,
        text: settings.empresa.descripcion,
        url,
      });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Enlace copiado");
    }
  };

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
      </div>
    );
  }

  const images =
    product.imagenes.length > 0
      ? product.imagenes
      : ["/placeholder-product.svg"];

  return (
    <main className="min-h-screen bg-white p-4 py-8 sm:p-8">
      <div className="mx-auto max-w-4xl rounded-3xl border border-border bg-white p-6 shadow-sm sm:p-10">
        <header className="mb-8 flex items-center justify-between border-b border-border pb-6">
          <div className="flex items-center gap-4">
            <Logo variant="horizontal" height={38} />
            <h1 className="hidden text-xl font-bold text-foreground sm:block">
              {settings.empresa.nombre}
            </h1>
          </div>
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="mr-2 h-4 w-4" /> Compartir
          </Button>
        </header>

        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <div className="aspect-square w-full overflow-hidden rounded-2xl bg-gray-50">
              <img
                src={images[currentImage]}
                alt={product.nombre}
                className="h-full w-full object-contain p-6"
              />
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
          </div>

          <div>
            {product.marca && (
              <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                {product.marca.nombre}
              </p>
            )}
            <h2 className="mt-2 text-3xl font-bold text-foreground">
              {product.nombre}
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {product.categoria && <Badge>{product.categoria.nombre}</Badge>}
              {product.subcategoria && (
                <Badge variant="info">{product.subcategoria.nombre}</Badge>
              )}
              {product.genero && (
                <Badge variant="default">{product.genero}</Badge>
              )}
            </div>

            {settings.catalogo.mostrarPrecio && (
              <p className="mt-6 text-3xl font-bold text-foreground">
                {formatCurrency(product.precioOferta || product.precio)}
              </p>
            )}

            {product.descripcion && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Descripción
                </h3>
                <p className="mt-2 whitespace-pre-line leading-relaxed text-foreground">
                  {product.descripcion}
                </p>
              </div>
            )}

            <div className="mt-8 rounded-2xl bg-muted/50 p-5">
              <h3 className="text-sm font-semibold text-foreground">
                Contacto
              </h3>
              <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                {settings.empresa.telefono && (
                  <p className="flex items-center gap-2">
                    <Phone className="h-4 w-4" /> {settings.empresa.telefono}
                  </p>
                )}
                {settings.empresa.correo && (
                  <p className="flex items-center gap-2">
                    <Mail className="h-4 w-4" /> {settings.empresa.correo}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
