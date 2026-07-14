"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Search, X } from "lucide-react";
import { useCatalogData } from "@/hooks/useCatalogData";
import { useSettings } from "@/context/SettingsContext";
import { normalizeText, formatCurrency } from "@/lib/utils";
import type { ProductWithRelations } from "@/types";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSelectProduct?: (product: ProductWithRelations) => void;
  placeholder?: string;
  className?: string;
}

function normalizeSearch(t: string) {
  if (!t) return "";
  return t
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function SearchBar({
  value,
  onChange,
  onSelectProduct,
  placeholder = "Buscar productos, marcas, códigos...",
  className,
}: SearchBarProps) {
  const { products } = useCatalogData();
  const { settings } = useSettings();
  const [open, setOpen] = useState(false);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 });
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions: ProductWithRelations[] = React.useMemo(() => {
    const q = normalizeSearch(value);
    if (!q || q.length < 1) return [];
    return products
      .filter((p) => p.visible && p.estado !== "borrador")
      .filter((p) => {
        return (
          normalizeSearch(p.nombre).includes(q) ||
          normalizeSearch(p.marca?.nombre || "").includes(q) ||
          normalizeSearch(p.categoria?.nombre || "").includes(q) ||
          normalizeSearch(p.codigoInterno || "").includes(q) ||
          normalizeSearch(p.descripcion || "").includes(q) ||
          normalizeSearch((p.etiquetas || []).join(" ")).includes(q)
        );
      })
      .slice(0, 8);
  }, [value, products]);

  const updatePos = useCallback(() => {
    if (!wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    setDropPos({
      top: rect.bottom + 6,
      left: rect.left,
      width: rect.width,
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePos();
    window.addEventListener("resize", updatePos);
    window.addEventListener("scroll", updatePos, true);
    return () => {
      window.removeEventListener("resize", updatePos);
      window.removeEventListener("scroll", updatePos, true);
    };
  }, [open, updatePos]);

  useEffect(() => {
    setOpen(
      suggestions.length > 0 && document.activeElement === inputRef.current,
    );
  }, [suggestions]);

  const handleSelect = (product: ProductWithRelations) => {
    setOpen(false);
    if (onSelectProduct) {
      onSelectProduct(product);
      onChange("");
    } else {
      onChange(product.nombre);
    }
  };

  const handleBlur = () => {
    setTimeout(() => setOpen(false), 150);
  };

  const discountPct = (p: ProductWithRelations) => {
    if (!p.precioOferta || p.precioOferta <= 0) return 0;
    return Math.round(((p.precio - p.precioOferta) / p.precio) * 100);
  };

  const dropdown =
    open &&
    typeof window !== "undefined" &&
    suggestions.length > 0 &&
    createPortal(
      <div
        className="fixed z-[9999] overflow-hidden rounded-2xl border border-border bg-white shadow-2xl"
        style={{
          top: dropPos.top,
          left: dropPos.left,
          width: dropPos.width,
          maxHeight: 480,
        }}
        onMouseDown={(e) => e.preventDefault()}
      >
        <div className="max-h-[480px] overflow-y-auto">
          <div className="px-4 py-2.5 border-b border-border/50">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {suggestions.length} resultado
              {suggestions.length !== 1 ? "s" : ""}
            </p>
          </div>
          {suggestions.map((product) => {
            const img = product.imagenes?.[0] || "/placeholder-product.svg";
            const price = product.precioOferta || product.precio;
            const disc = discountPct(product);
            return (
              <button
                key={product.id}
                onClick={() => handleSelect(product)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60"
              >
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-border bg-gray-50">
                  <img
                    src={img}
                    alt=""
                    className="h-full w-full object-contain p-1"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {product.nombre}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {product.marca && (
                      <span className="text-xs text-muted-foreground">
                        {product.marca.nombre}
                      </span>
                    )}
                    {product.codigoInterno && (
                      <span className="font-mono text-[10px] text-muted-foreground/70">
                        {product.codigoInterno}
                      </span>
                    )}
                  </div>
                </div>
                {settings.catalogo.mostrarPrecio && (
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold text-foreground">
                      {formatCurrency(price)}
                    </p>
                    {disc > 0 && (
                      <p className="text-[10px] font-semibold text-green-600">
                        -{disc}%
                      </p>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>,
      document.body,
    );

  return (
    <div ref={wrapRef} className={"relative w-full " + (className || "")}>
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          updatePos();
        }}
        onFocus={() => {
          updatePos();
          setOpen(suggestions.length > 0);
        }}
        onBlur={handleBlur}
        placeholder={placeholder}
        className="w-full rounded-xl border border-border bg-muted/50 py-2.5 pl-10 pr-9 text-sm outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
      />
      {value && (
        <button
          onClick={() => {
            onChange("");
            setOpen(false);
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
      {dropdown}
    </div>
  );
}
