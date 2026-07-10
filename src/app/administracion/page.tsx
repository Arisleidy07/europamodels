"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  LayoutGrid,
  Tag,
  Users,
  Settings,
  Plus,
  Search,
  MoreVertical,
  Trash2,
  Edit,
  Copy,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { ProductForm } from "@/components/admin/ProductForm";
import AdminCategories from "@/components/admin/AdminCategories";
import AdminBrands from "@/components/admin/AdminBrands";
import AdminTeam from "@/components/admin/AdminTeam";
import AdminSettings from "@/components/admin/AdminSettings";
import { useAuth } from "@/context/AuthContext";
import { useCatalogData } from "@/hooks/useCatalogData";
import { deleteProduct } from "@/lib/products";
import { normalizeText, formatCurrency, cn } from "@/lib/utils";
import toast from "react-hot-toast";
import type { Product } from "@/types";

export default function AdminPage() {
  const router = useRouter();
  const { user, hasPermission } = useAuth();
  const { products, categories, subcategories, brands, loading } =
    useCatalogData();

  const tabs = [
    { id: "productos", label: "Productos", icon: Package, visible: true },
    {
      id: "categorias",
      label: "Categorías",
      icon: LayoutGrid,
      visible:
        hasPermission("categorias", "crear") ||
        hasPermission("categorias", "editar") ||
        hasPermission("categorias", "eliminar"),
    },
    {
      id: "marcas",
      label: "Marcas",
      icon: Tag,
      visible:
        hasPermission("marcas", "crear") ||
        hasPermission("marcas", "editar") ||
        hasPermission("marcas", "eliminar"),
    },
    {
      id: "equipo",
      label: "Equipo",
      icon: Users,
      visible:
        hasPermission("usuarios", "invitar") ||
        hasPermission("usuarios", "editarPermisos") ||
        hasPermission("usuarios", "desactivar") ||
        hasPermission("usuarios", "eliminar") ||
        user?.rol === "administrador",
    },
    {
      id: "configuracion",
      label: "Configuración",
      icon: Settings,
      visible: hasPermission("configuracion", "editar"),
    },
  ].filter((t) => t.visible);

  const [activeTab, setActiveTab] = useState(tabs[0]?.id || "productos");

  useEffect(() => {
    if (!tabs.find((t) => t.id === activeTab)) {
      setActiveTab(tabs[0]?.id || "productos");
    }
  }, [tabs, activeTab]);

  const [search, setSearch] = useState("");
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  if (!user) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-white px-6 text-center">
        <h1 className="text-2xl font-bold text-foreground">
          Acceso restringido
        </h1>
        <p className="mt-2 text-muted-foreground">
          Debes iniciar sesión para acceder al panel.
        </p>
        <Button onClick={() => router.push("/login")} className="mt-6">
          Iniciar sesión
        </Button>
      </div>
    );
  }

  const canManageProducts =
    hasPermission("productos", "crear") || hasPermission("productos", "editar");
  const canDeleteProducts = hasPermission("productos", "eliminar");

  const filteredProducts = products.filter((p) => {
    const term = normalizeText(search);
    return (
      !term ||
      normalizeText(p.nombre).includes(term) ||
      normalizeText(p.marca?.nombre || "").includes(term) ||
      normalizeText(p.categoria?.nombre || "").includes(term)
    );
  });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteProduct(deleteTarget.id);
      toast.success("Producto eliminado");
    } catch (err: any) {
      toast.error(err.message || "Error al eliminar");
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      {/* Admin tab bar */}
      <div className="border-b border-border bg-white">
        <div className="flex items-center gap-1 overflow-x-auto px-4 lg:px-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                  active
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 px-4 py-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-2xl font-bold text-foreground">
              {tabs.find((t) => t.id === activeTab)?.label}
            </h1>
            {activeTab === "productos" && canManageProducts && (
              <Button
                onClick={() => {
                  setEditingProduct(null);
                  setProductFormOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" /> Nuevo producto
              </Button>
            )}
          </div>

          {activeTab === "productos" && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar productos..."
                  className="pl-10"
                />
              </div>

              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-16 animate-pulse rounded-xl bg-gray-100"
                    />
                  ))}
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-muted/50 text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 font-medium">Producto</th>
                        <th className="hidden px-4 py-3 font-medium md:table-cell">
                          Marca
                        </th>
                        <th className="hidden px-4 py-3 font-medium md:table-cell">
                          Categoría
                        </th>
                        <th className="px-4 py-3 font-medium">Precio</th>
                        <th className="px-4 py-3 font-medium">Estado</th>
                        <th className="px-4 py-3 font-medium"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredProducts.map((product) => (
                        <tr key={product.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <img
                                src={
                                  product.imagenes[0] ||
                                  "/placeholder-product.svg"
                                }
                                alt=""
                                className="h-10 w-10 rounded-lg object-cover"
                              />
                              <span className="font-medium text-foreground">
                                {product.nombre}
                              </span>
                            </div>
                          </td>
                          <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                            {product.marca?.nombre}
                          </td>
                          <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                            {product.categoria?.nombre}
                          </td>
                          <td className="px-4 py-3 font-medium text-foreground">
                            {formatCurrency(
                              product.precioOferta || product.precio,
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={cn(
                                "rounded-full px-2.5 py-1 text-xs font-medium",
                                product.estado === "publicado"
                                  ? "bg-green-50 text-success"
                                  : product.estado === "agotado"
                                    ? "bg-red-50 text-danger"
                                    : "bg-gray-100 text-muted-foreground",
                              )}
                            >
                              {product.estado}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="relative inline-block">
                              <button
                                onClick={() =>
                                  setMenuOpen(
                                    menuOpen === product.id ? null : product.id,
                                  )
                                }
                                className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </button>
                              {menuOpen === product.id && (
                                <div className="absolute right-0 z-10 mt-1 w-40 rounded-xl border border-border bg-white p-1 shadow-lg">
                                  <button
                                    onClick={() => {
                                      setEditingProduct(product);
                                      setProductFormOpen(true);
                                      setMenuOpen(null);
                                    }}
                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted"
                                  >
                                    <Edit className="h-4 w-4" /> Editar
                                  </button>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(
                                        `${window.location.origin}/producto/${product.id}`,
                                      );
                                      toast.success("Enlace copiado");
                                      setMenuOpen(null);
                                    }}
                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted"
                                  >
                                    <Copy className="h-4 w-4" /> Copiar enlace
                                  </button>
                                  {canDeleteProducts && (
                                    <button
                                      onClick={() => {
                                        setDeleteTarget(product);
                                        setMenuOpen(null);
                                      }}
                                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-danger hover:bg-red-50"
                                    >
                                      <Trash2 className="h-4 w-4" /> Eliminar
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === "categorias" && <AdminCategories />}
          {activeTab === "marcas" && <AdminBrands />}
          {activeTab === "equipo" && <AdminTeam />}
          {activeTab === "configuracion" && <AdminSettings />}
        </div>
      </main>

      <ConfirmModal
        open={!!deleteTarget}
        title="Eliminar producto"
        message={`¿Deseas eliminar "${deleteTarget?.nombre}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <AnimatePresence>
        {productFormOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setProductFormOpen(false)}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl overflow-hidden bg-white shadow-2xl"
            >
              <ProductForm
                product={editingProduct}
                categories={categories}
                subcategories={subcategories}
                brands={brands}
                onClose={() => setProductFormOpen(false)}
                onSaved={() => {
                  toast.success("Catálogo actualizado");
                }}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
