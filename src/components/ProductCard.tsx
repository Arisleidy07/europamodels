"use client";

import React from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
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

  const statusBadge = () => {
    if (product.estado === "agotado") return <Badge variant="danger">Agotado</Badge>;
    if (product.stock <= 3 && product.stock > 0) return <Badge variant="warning">Pocas unidades</Badge>;
    if (product.nuevo) return <Badge variant="info">Nuevo</Badge>;
    if (product.oferta) return <Badge variant="success">Oferta</Badge>;
    return null;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-border bg-white p-3 shadow-sm transition-shadow duration-200 hover:shadow-md"
      onClick={onClick}
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-gray-50">
        <img
          src={imageUrl}
          alt={product.nombre}
          className="h-full w-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {statusBadge()}
        </div>
      </div>

      <div className="mt-3 flex flex-1 flex-col">
        {settings.catalogo.mostrarMarca && product.marca && (
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {product.marca.nombre}
          </p>
        )}
        <h3 className="mt-1 line-clamp-2 text-base font-semibold text-foreground">
          {product.nombre}
        </h3>
        {settings.catalogo.mostrarCategoria && product.categoria && (
          <p className="mt-0.5 text-xs text-muted-foreground">{product.categoria.nombre}</p>
        )}

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
            className="h-9 w-9 rounded-full p-0"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
