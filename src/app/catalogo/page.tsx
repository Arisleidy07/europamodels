"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { SearchBar } from "@/components/SearchBar";
import { ProductCard } from "@/components/ProductCard";
import { ProductDrawer } from "@/components/ProductDrawer";
import { CartDrawer } from "@/components/CartDrawer";
import { QuoteForm } from "@/components/QuoteForm";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { useCatalogData } from "@/hooks/useCatalogData";
import { useCart } from "@/context/CartContext";
import { useSettings } from "@/context/SettingsContext";
import { normalizeText, formatCurrency } from "@/lib/utils";
import { LicenseGuard } from "@/components/LicenseGuard";
import type { ProductWithRelations } from "@/types";
import toast from "react-hot-toast";

export default function CatalogoPage() {
  const router = useRouter();
  const { products, categories, subcategories, brands, loading } = useCatalogData();
  const { addToCart } = useCart();
  const { settings } = useSettings();

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("todos");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("todos");
  const [selectedBrand, setSelectedBrand] = useState<string>("todos");
  const [selectedProduct, setSelectedProduct] = useState<ProductWithRelations | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [quoteFormOpen, setQuoteFormOpen] = useState(false);
  const [quoteCreated, setQuoteCreated] = useState<{ codigo: string; id: string } | null>(null);

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
        selectedSubcategory === "todos" || p.subcategoriaId === selectedSubcategory;
      const matchesBrand = selectedBrand === "todos" || p.marcaId === selectedBrand;

      return matchesSearch && matchesCategory && matchesSubcategory && matchesBrand;
    });
  }, [products, search, selectedCategory, selectedSubcategory, selectedBrand]);

  const availableSubcategories = useMemo(() => {
    if (selectedCategory === "todos") return [];
    return subcategories.filter((s) => s.categoriaId === selectedCategory && s.activo);
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
    setQuoteCreated(quote);
    setQuoteFormOpen(false);
    setCartOpen(false);
    shareQuote(quote);
  };

  const shareQuote = async (quote: { codigo: string; id: string }) => {
    const url = `${window.location.origin}/cotizacion/${quote.codigo}`;
    const text = `${settings.cotizaciones.mensajeAutomatico}\n\nCotización: ${quote.codigo}\n${url}`;
    if (navigator.share) {
      await navigator.share({ title: `Cotización ${quote.codigo}`, text, url });
    } else {
      await navigator.clipboard.writeText(text);
      toast.success("Cotización copiada al portapapeles");
    }
  };

  return (
    <LicenseGuard>
      <div className="flex min-h-screen flex-col bg-background">
        <Header
          search={search}
          onSearchChange={setSearch}
          onOpenCart={() => setCartOpen(true)}
          showMenu={false}
        />

        <div className="border-b border-border bg-white px-4 py-3 lg:px-8">
          <div className="mx-auto max-w-2xl md:hidden">
            <SearchBar value={search} onChange={setSearch} />
          </div>

          <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-2 md:mt-0">
            <button
              onClick={() => {
                setSelectedCategory("todos");
                setSelectedSubcategory("todos");
              }}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                selectedCategory === "todos"
                  ? "bg-primary text-white"
                  : "bg-muted text-foreground hover:bg-gray-200"
              }`}
            >
              Todos
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setSelectedSubcategory("todos");
                }}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  selectedCategory === cat.id
                    ? "bg-primary text-white"
                    : "bg-muted text-foreground hover:bg-gray-200"
                }`}
              >
                {cat.nombre}
              </button>
            ))}
          </div>

          {availableSubcategories.length > 0 && (
            <div className="mt-2 flex items-center gap-2 overflow-x-auto pb-2">
              <button
                onClick={() => setSelectedSubcategory("todos")}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  selectedSubcategory === "todos"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-white text-muted-foreground hover:bg-muted"
                }`}
              >
                Todos
              </button>
              {availableSubcategories.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => setSelectedSubcategory(sub.id)}
                  className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    selectedSubcategory === sub.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-white text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {sub.nombre}
                </button>
              ))}
            </div>
          )}
        </div>

        <main className="flex-1 px-4 py-6 lg:px-8">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {filteredProducts.length} producto{filteredProducts.length !== 1 ? "s" : ""}
            </p>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="todos">Todas las marcas</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nombre}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: 10 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-lg font-medium text-foreground">No se encontraron productos</p>
              <p className="text-sm text-muted-foreground">Prueba con otros términos o filtros.</p>
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

        <ProductDrawer product={selectedProduct} onClose={() => setSelectedProduct(null)} />
        <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} onCreateQuote={() => setQuoteFormOpen(true)} />
        <QuoteForm
          open={quoteFormOpen}
          onClose={() => setQuoteFormOpen(false)}
          onQuoteCreated={(q) => handleQuoteCreated({ codigo: q.codigo, id: q.id })}
        />
      </div>
    </LicenseGuard>
  );
}
