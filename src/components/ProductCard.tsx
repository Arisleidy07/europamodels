"use client";

import React from "react";
import { motion } from "framer-motion";
import { Plus, Heart } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useSettings } from "@/context/SettingsContext";
import { formatCurrency } from "@/lib/utils";
import type { ProductWithRelations } from "@/types";

interface ProductCardProps {
  product: ProductWithRelations;
  onClick: () => void;
  onAdd: () => void;
}

export function ProductCard({ product, onClick, onAdd }: ProductCardProps) {
  const { settings } = useSettings();
  const imageUrl = product.imagenes[0] || "/placeholder-product.svg";
  const categoryColor = product.categoria?.color || product.marca?.color;

  const statusBadge = () => {
    if (product.estado === "agotado")
      return <Badge variant="danger">Agotado</Badge>;
    if (product.stock <= 3 && product.stock > 0)
      return <Badge variant="warning">Pocas unidades</Badge>;
    if (product.nuevo) return <Badge variant="info">Nuevo</Badge>;
    if (product.oferta) return <Badge variant="success">Oferta</Badge>;
    return null;
  };

  const categoryStyle = categoryColor
    ? {
        borderColor: categoryColor,
        color: categoryColor,
        backgroundColor: `${categoryColor}10`,
      }
    : undefined;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      whileHover={{ y: -6 }}
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-border/80 bg-white p-3 shadow-[0_2px_12px_rgba(15,23,42,0.05)] transition-all duration-300 hover:border-primary/20 hover:shadow-[0_16px_32px_rgba(15,23,42,0.13)]"
      onClick={onClick}
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-gradient-to-br from-slate-50 via-white to-primary/[0.04]">
        <img
          src={imageUrl}
          alt={product.nombre}
          className="h-full w-full object-contain p-4 transition-transform duration-500 ease-out group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {statusBadge()}
        </div>
        {settings.catalogo.mostrarCategoria && product.categoria && (
          <div className="absolute bottom-3 left-3">
            <span
              className="rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide"
              style={categoryStyle}
            >
              {product.categoria.nombre}
            </span>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-1 flex-col">
        {settings.catalogo.mostrarMarca && product.marca && (
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {product.marca.nombre}
          </p>
        )}
        <h3 className="mt-1 line-clamp-2 text-[15px] font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
          {product.nombre}
        </h3>

        <div className="mt-auto flex items-center justify-between pt-3">
          {settings.catalogo.mostrarPrecio ? (
            <div>
              <span className="text-lg font-bold text-foreground">
                {formatCurrency(product.precioOferta || product.precio)}
              </span>
              {product.precioOferta ? (
                <span className="ml-2 text-sm text-muted-foreground line-through">
                  {formatCurrency(product.precio)}
                </span>
              ) : null}
            </div>
          ) : (
            <span />
          )}

          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onAdd();
            }}
            disabled={product.estado === "agotado"}
            className="h-9 w-9 rounded-full p-0 shadow-md transition-all group-hover:scale-105 active:scale-90"
          >
            {product.estado === "agotado" ? (
              <Heart className="h-4 w-4" />
            ) : (
              <Plus className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
