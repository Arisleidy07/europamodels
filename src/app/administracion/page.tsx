"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
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
  FileText,
  Droplets,
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
import AdminQuotes from "@/components/admin/AdminQuotes";
import AdminOlfactory from "@/components/admin/AdminOlfactory";
import AdminGenders from "@/components/admin/AdminGenders";
import AdminSubcategories from "@/components/admin/AdminSubcategories";
import { useAuth } from "@/context/AuthContext";
import { useCatalogData } from "@/hooks/useCatalogData";
import { deleteProduct } from "@/lib/products";
import { normalizeText, formatCurrency, cn } from "@/lib/utils";
import toast from "react-hot-toast";
import type { Product } from "@/types";

export default function AdminPage() {
  const router = useRouter();
  const { user, hasPermission } = useAuth();
  const {
    products,
    categories,
    subcategories,
    brands,
    genders,
    loading,
    markDeleted,
  } = useCatalogData();

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
      id: "generos",
      label: "Géneros",
      icon: Users,
      visible:
        user?.rol === "administrador" ||
        hasPermission("productos", "crear") ||
        hasPermission("productos", "editar"),
    },
    {
      id: "subcategorias",
      label: "Subcategorías",
      icon: LayoutGrid,
      visible:
        hasPermission("categorias", "crear") ||
        hasPermission("categorias", "editar") ||
        hasPermission("categorias", "eliminar"),
    },
    {
      id: "biblioteca",
      label: "Biblioteca Olfativa",
      icon: Droplets,
      visible:
        user?.rol === "administrador" || hasPermission("productos", "crear"),
    },
    {
      id: "cotizaciones",
      label: "Cotizaciones",
      icon: FileText,
      visible:
        hasPermission("cotizaciones", "verTodas") ||
        user?.rol === "administrador",
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
  const [stateFilter, setStateFilter] = useState<string>("todos");
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const openMenu = useCallback((id: string, btn: HTMLButtonElement) => {
    const rect = btn.getBoundingClientRect();
    setMenuPos({
      top: rect.bottom + 4 + window.scrollY,
      right: window.innerWidth - rect.right,
    });
    setMenuOpen((prev) => (prev === id ? null : id));
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const close = () => setTimeout(() => setMenuOpen(null), 80);
    window.addEventListener("click", close, { capture: true, once: true });
    return () => window.removeEventListener("click", close, { capture: true });
  }, [menuOpen]);

  if (!user || user.rol !== "administrador") {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-white px-6 text-center">
        <h1 className="text-2xl font-bold text-foreground">
          Acceso restringido
        </h1>
        <p className="mt-2 text-muted-foreground">
          {!user
            ? "Debes iniciar sesión para acceder al panel."
            : "Tu rol no tiene acceso al panel de administración."}
        </p>
        <Button
          onClick={() => router.push(user ? "/catalogo" : "/login")}
          className="mt-6"
        >
          {user ? "Ir al catálogo" : "Iniciar sesión"}
        </Button>
      </div>
    );
  }

  const canManageProducts =
    user?.rol === "administrador" ||
    hasPermission("productos", "crear") ||
    hasPermission("productos", "editar");
  const canDeleteProducts =
    user?.rol === "administrador" || hasPermission("productos", "eliminar");

  const filteredProducts = products.filter((p) => {
    const term = normalizeText(search);
    const matchesSearch =
      !term ||
      normalizeText(p.nombre).includes(term) ||
      normalizeText(p.marca?.nombre || "").includes(term) ||
      normalizeText(p.categoria?.nombre || "").includes(term);
    const matchesState = stateFilter === "todos" || p.estado === stateFilter;
    return matchesSearch && matchesState;
  });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    try {
      await deleteProduct(target.id);
      markDeleted(target.id);
      toast.success("Producto eliminado");
    } catch (err: any) {
      toast.error(err.message || "Error al eliminar");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      {/* Admin tab bar */}
      <div className="border-b border-border bg-white">
        <div className="flex items-center gap-1 overflow-x-auto px-4 py-1 scrollbar-none lg:px-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-lg border-b-2 px-3 py-2.5 text-xs font-medium transition-colors sm:gap-2 sm:px-4 sm:py-3 sm:text-sm",
                  active
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground",
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
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar productos"
                    className="pl-10"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: "todos", label: "Todos" },
                    { value: "publicado", label: "Publicado" },
                    { value: "borrador", label: "Borrador" },
                    { value: "oculto", label: "Oculto" },
                    { value: "agotado", label: "Agotado" },
                  ].map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setStateFilter(s.value)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                        stateFilter === s.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-white text-foreground hover:bg-muted",
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-20 animate-pulse rounded-xl bg-gray-100"
                    />
                  ))}
                </div>
              ) : (
                <>
                  {/* Mobile cards */}
                  <div className="grid gap-3 md:hidden">
                    {filteredProducts.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center gap-3 rounded-2xl border border-border bg-white p-3 shadow-sm"
                      >
                        <img
                          src={
                            product.imagenes[0] || "/placeholder-product.svg"
                          }
                          alt=""
                          className="h-16 w-16 shrink-0 rounded-xl object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-foreground">
                            {product.nombre}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {product.marca?.nombre} ·{" "}
                            {product.categoria?.nombre}
                          </p>
                          <div className="mt-1.5 flex items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">
                              {formatCurrency(
                                product.precioOferta || product.precio,
                              )}
                            </span>
                            <span
                              className={cn(
                                "rounded-full px-2 py-0.5 text-[10px] font-medium",
                                product.estado === "publicado"
                                  ? "bg-green-50 text-success"
                                  : product.estado === "agotado"
                                    ? "bg-red-50 text-danger"
                                    : "bg-gray-100 text-muted-foreground",
                              )}
                            >
                              {product.estado}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openMenu(product.id, e.currentTarget);
                          }}
                          className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Desktop table */}
                  <div className="hidden overflow-hidden rounded-2xl border border-border bg-white shadow-sm md:block">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-muted/50 text-muted-foreground">
                        <tr>
                          <th className="px-4 py-3 font-medium">Producto</th>
                          <th className="px-4 py-3 font-medium">Marca</th>
                          <th className="px-4 py-3 font-medium">Categoría</th>
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
                            <td className="px-4 py-3 text-muted-foreground">
                              {product.marca?.nombre}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
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
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openMenu(product.id, e.currentTarget);
                                }}
                                className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === "categorias" && <AdminCategories />}
          {activeTab === "marcas" && <AdminBrands />}
          {activeTab === "generos" && <AdminGenders />}
          {activeTab === "subcategorias" && <AdminSubcategories />}
          {activeTab === "biblioteca" && <AdminOlfactory />}
          {activeTab === "cotizaciones" && <AdminQuotes />}
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

      {/* Portal menu — renders above all containers */}
      {menuOpen &&
        typeof window !== "undefined" &&
        createPortal(
          <div
            className="fixed z-[9999] w-48 rounded-xl border border-border bg-white p-1 shadow-xl"
            style={{ top: menuPos.top, right: menuPos.right }}
            onClick={(e) => e.stopPropagation()}
          >
            {filteredProducts
              .filter((p) => p.id === menuOpen)
              .map((product) => (
                <React.Fragment key={product.id}>
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
                </React.Fragment>
              ))}
          </div>,
          document.body,
        )}

      <AnimatePresence>
        {productFormOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col bg-white"
          >
            <ProductForm
              product={editingProduct}
              categories={categories}
              subcategories={subcategories}
              brands={brands}
              genders={genders}
              onClose={() => setProductFormOpen(false)}
              onSaved={() => {
                toast.success("Catálogo actualizado");
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
