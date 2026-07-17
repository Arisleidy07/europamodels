"use client";

import React, {
  useState,
  useRef,
  useMemo,
  useEffect,
  useCallback,
} from "react";
import {
  X,
  Upload,
  Trash2,
  Star,
  ArrowUp,
  ArrowDown,
  Plus,
  Edit,
  ImageIcon,
  Search,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import {
  createProduct,
  updateProduct,
  uploadProductImages,
  deleteProductImage,
  uploadProductInfoImage,
} from "@/lib/products";
import {
  createCategory,
  deleteCategory,
  createBrand,
  deleteBrand,
  createSubcategory,
  deleteSubcategory,
} from "@/lib/categories";
import { createGender, deleteGender } from "@/lib/genders";
import { useAuth } from "@/context/AuthContext";
import { useCatalogData } from "@/hooks/useCatalogData";
import { generateId, cn } from "@/lib/utils";
import {
  getOlfactoryNotes,
  createOlfactoryNote,
  normalizeSearch,
} from "@/lib/olfactory";
import toast from "react-hot-toast";
import type {
  Product,
  ProductVariant,
  ProductAccord,
  OlfactoryNote,
  Category,
  Subcategory,
  Brand,
  Gender,
} from "@/types";

const PRESET_COLORS = [
  "#2563eb",
  "#7c3aed",
  "#db2777",
  "#ea580c",
  "#16a34a",
  "#0891b7",
  "#4f46e5",
  "#be123c",
];

function QuickSubcategoryModal({
  open,
  onClose,
  categories,
  subcategories,
  currentCategoryId,
  onCreated,
  onDelete,
}: {
  open: boolean;
  onClose: () => void;
  categories: { id: string; nombre: string }[];
  subcategories: { id: string; nombre: string; categoriaId: string }[];
  currentCategoryId?: string;
  onCreated: (name: string, categoryId: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [name, setName] = React.useState("");
  const [categoryId, setCategoryId] = React.useState(currentCategoryId || "");
  const [saving, setSaving] = React.useState(false);
  const [confirmTarget, setConfirmTarget] = React.useState<{
    id: string;
    nombre: string;
  } | null>(null);

  React.useEffect(() => {
    if (open) {
      setName("");
      setCategoryId(currentCategoryId || "");
    }
  }, [open, currentCategoryId]);

  const handleSubmit = async () => {
    if (!name.trim() || !categoryId) return;
    setSaving(true);
    try {
      await onCreated(name.trim(), categoryId);
      setName("");
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Error al crear");
    } finally {
      setSaving(false);
    }
  };

  const executeDelete = async () => {
    if (!confirmTarget) return;
    try {
      await onDelete(confirmTarget.id);
    } catch (err: any) {
      toast.error(err.message || "Error al eliminar");
    } finally {
      setConfirmTarget(null);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="mb-4 text-lg font-bold text-foreground">
          Subcategorías
        </h2>
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-foreground">
              Categoría
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-xl border border-border bg-white px-4 py-3 text-base outline-none focus:border-primary"
            >
              <option value="">Seleccionar categoría</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-foreground">
              Nombre
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="Nueva subcategoría"
              autoFocus
              className="w-full rounded-xl border border-border bg-white px-4 py-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="max-h-40 space-y-1 overflow-y-auto rounded-xl border border-border p-2">
            {subcategories.map((s) => {
              const cat = categories.find((c) => c.id === s.categoriaId);
              return (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-muted"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {s.nombre}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {cat?.nombre || "—"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setConfirmTarget(s)}
                    className="rounded p-1 text-danger hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving || !name.trim() || !categoryId}
              className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? "Creando..." : "Crear subcategoría"}
            </button>
          </div>
        </div>
      </div>
      <ConfirmModal
        open={!!confirmTarget}
        title="Confirmar eliminación"
        message={`¿Eliminar "${confirmTarget?.nombre}"?`}
        confirmLabel="Eliminar"
        onConfirm={executeDelete}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
}

function QuickManageModal({
  title,
  open,
  onClose,
  items,
  onCreated,
  onDelete,
  showColors = true,
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  items: { id: string; nombre: string; color?: string }[];
  onCreated: (name: string, color: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  showColors?: boolean;
}) {
  const [name, setName] = React.useState("");
  const [color, setColor] = React.useState(PRESET_COLORS[0]);
  const [saving, setSaving] = React.useState(false);
  const [confirmTarget, setConfirmTarget] = React.useState<{
    id: string;
    nombre: string;
  } | null>(null);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onCreated(name.trim(), color);
      setName("");
      setColor(PRESET_COLORS[0]);
    } catch (err: any) {
      toast.error(err.message || "Error al crear");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, nombre: string) => {
    setConfirmTarget({ id, nombre });
  };

  const executeDelete = async () => {
    if (!confirmTarget) return;
    try {
      await onDelete(confirmTarget.id);
      toast.success(`"${confirmTarget.nombre}" eliminado`);
    } catch (err: any) {
      toast.error(err.message || "Error al eliminar");
    } finally {
      setConfirmTarget(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-8 py-5">
          <div>
            <h3 className="text-xl font-bold text-foreground">{title}</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Gestiona y crea nuevas entradas
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Existing items */}
        {items.length > 0 && (
          <div className="border-b border-border px-8 py-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Existentes ({items.length})
            </p>
            <div className="max-h-52 space-y-1 overflow-y-auto">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl px-4 py-2.5 hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-4 w-4 shrink-0 rounded-full shadow-sm"
                      style={{
                        backgroundColor: item.color || PRESET_COLORS[0],
                      }}
                    />
                    <span className="text-sm font-medium text-foreground">
                      {item.nombre}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id, item.nombre)}
                    className="rounded-lg p-2 text-muted-foreground hover:bg-red-50 hover:text-danger"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Create form */}
        <div className="space-y-5 px-8 py-6">
          <div>
            <label className="mb-2 block text-sm font-semibold text-foreground">
              Nombre
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="Escribe el nombre..."
              autoFocus
              className="w-full rounded-xl border border-border bg-white px-4 py-3 text-base outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          {showColors && (
            <div>
              <label className="mb-2 block text-sm font-semibold text-foreground">
                Color de identificación
              </label>
              <div className="flex flex-wrap gap-3">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={cn(
                      "h-9 w-9 rounded-full border-2 transition-all hover:scale-110",
                      color === c
                        ? "border-foreground scale-110 shadow-md"
                        : "border-transparent",
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              {color && (
                <div className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-4 py-2.5">
                  <div
                    className="h-5 w-5 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-sm font-medium text-foreground">
                    {name || "Vista previa"}
                  </span>
                </div>
              )}
            </div>
          )}
          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving || !name.trim()}
              className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
            >
              {saving
                ? "Creando..."
                : `Crear ${title.slice(0, -1).toLowerCase()}`}
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={!!confirmTarget}
        title="Confirmar eliminación"
        message={`¿Estás seguro de que deseas eliminar "${confirmTarget?.nombre}"?`}
        confirmLabel="Eliminar"
        onConfirm={executeDelete}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
}

/* ─── Section Header ─── */
function SectionHeader({
  label,
  icon,
  description,
}: {
  label: string;
  icon: string;
  description?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-xl leading-none mt-0.5">{icon}</span>
      <div>
        <h3 className="text-sm font-semibold text-foreground">{label}</h3>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
    </div>
  );
}

/* ─── Variants Editor ─── */
function VariantsEditor({
  variants,
  onChange,
}: {
  variants: ProductVariant[];
  onChange: (v: ProductVariant[]) => void;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [precioOferta, setPrecioOferta] = useState("");
  const [stock, setStock] = useState("");
  const [codigo, setCodigo] = useState("");
  const [imagen, setImagen] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setNombre("");
    setPrecio("");
    setPrecioOferta("");
    setStock("");
    setCodigo("");
    setImagen("");
    setEditId(null);
    setShowAdd(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setImagen(URL.createObjectURL(file));
  };

  const addOrUpdateVariant = () => {
    if (!nombre.trim()) return;
    const variant: ProductVariant = {
      id: editId || generateId(),
      nombre: nombre.trim(),
      imagen: imagen || undefined,
      precio: precio ? parseFloat(precio) : undefined,
      precioOferta: precioOferta ? parseFloat(precioOferta) : undefined,
      stock: stock ? parseInt(stock) : undefined,
      codigo: codigo.trim() || undefined,
    };
    if (editId) {
      onChange(variants.map((v) => (v.id === editId ? variant : v)));
    } else {
      onChange([...variants, variant]);
    }
    resetForm();
  };

  const startEdit = (v: ProductVariant) => {
    setEditId(v.id);
    setNombre(v.nombre);
    setPrecio(v.precio?.toString() || "");
    setPrecioOferta(v.precioOferta?.toString() || "");
    setStock(v.stock?.toString() || "");
    setCodigo(v.codigo || "");
    setImagen(v.imagen || "");
    setShowAdd(true);
  };

  return (
    <div className="space-y-4">
      {/* Existing variants list */}
      {variants.length > 0 && (
        <div className="space-y-2">
          {variants.map((v) => (
            <div
              key={v.id}
              className="group flex items-center gap-3 rounded-xl border border-border bg-white p-3 transition-all hover:border-primary/30 hover:shadow-sm"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-50">
                {v.imagen ? (
                  <img
                    src={v.imagen}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <ImageIcon className="h-5 w-5 text-muted-foreground/30" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {v.nombre}
                </p>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                  {v.precio !== undefined && <span>Precio: ${v.precio}</span>}
                  {v.precioOferta !== undefined && (
                    <span className="text-green-600">
                      Oferta: ${v.precioOferta}
                    </span>
                  )}
                  {v.stock !== undefined && <span>Stock: {v.stock}</span>}
                  {v.codigo && <span>COD: {v.codigo}</span>}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => startEdit(v)}
                  className="rounded-lg p-1.5 text-primary hover:bg-primary/10"
                >
                  <Edit className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onChange(variants.filter((x) => x.id !== v.id))
                  }
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit form */}
      {showAdd ? (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">
              {editId ? "Editar variante" : "Nueva variante"}
            </p>
            <button
              type="button"
              onClick={resetForm}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre (ej: 100ml, Negro)"
              className="col-span-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <input
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
              placeholder="Precio"
              type="number"
              min={0}
              step="0.01"
              className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <input
              value={precioOferta}
              onChange={(e) => setPrecioOferta(e.target.value)}
              placeholder="Precio oferta (opcional)"
              type="number"
              min={0}
              step="0.01"
              className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <input
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              placeholder="Stock"
              type="number"
              min={0}
              className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <input
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="Código (opcional)"
              className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
          {/* Image */}
          <div className="flex items-center gap-3">
            <div
              onClick={() => fileRef.current?.click()}
              className="flex h-12 w-12 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-white hover:border-primary/50"
            >
              {imagen ? (
                <img
                  src={imagen}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <Upload className="h-4 w-4 text-muted-foreground/50" />
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              Imagen de variante (opcional)
            </span>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={addOrUpdateVariant}
              disabled={!nombre.trim()}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
            >
              {editId ? "Guardar" : "Agregar variante"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-3 text-sm font-medium text-muted-foreground transition-all hover:border-primary/40 hover:text-primary"
        >
          <Plus className="h-4 w-4" />
          Agregar variante
        </button>
      )}
    </div>
  );
}

/* ─── Quick Note Creator Modal ─── */
function QuickCreateNote({
  categoria,
  onCreated,
}: {
  categoria: import("@/types").OlfactoryCategory;
  onCreated: (note: OlfactoryNote) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [nombre, setNombre] = React.useState("");
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [imagePreview, setImagePreview] = React.useState<string>("");
  const [saving, setSaving] = React.useState(false);
  const [recents, setRecents] = React.useState<OlfactoryNote[]>([]);
  const imgRef = React.useRef<HTMLInputElement>(null);
  const canHaveImage = categoria !== "acordes";

  const categoryLabel: Record<string, string> = {
    acordes: "Acorde principal",
    notasSalida: "Nota de salida",
    notasCorazon: "Nota de corazón",
    notasFondo: "Nota de fondo",
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview("");
    if (imgRef.current) imgRef.current.value = "";
  };

  const handleAdd = async () => {
    if (!nombre.trim()) return;
    setSaving(true);
    try {
      let imagenUrl = "";
      if (imageFile) {
        const { uploadOlfactoryImage } = await import("@/lib/olfactory");
        const tempId = `${categoria}-${Date.now()}`;
        imagenUrl = await uploadOlfactoryImage(imageFile, tempId);
      }
      const created = await createOlfactoryNote({
        nombre: nombre.trim(),
        imagen: imagenUrl,
        categoria,
        activo: true,
      });
      onCreated(created);
      setRecents((prev) => [created, ...prev]);
      setNombre("");
      clearImage();
      toast.success(`"${created.nombre}" agregado`);
    } catch (err: any) {
      toast.error(err.message || "Error al crear");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setNombre("");
    clearImage();
    setRecents([]);
  };

  React.useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-xl border border-dashed border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
      >
        <Plus className="h-3.5 w-3.5" /> Nuevo
      </button>

      {open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Agregar {categoryLabel[categoria] ?? "elemento"}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Se agrega a la lista sin guardar el producto
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-full p-2 text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="space-y-4 px-6 py-5">
              {/* Nombre */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-foreground">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  autoFocus
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAdd();
                  }}
                  placeholder={`Ej: ${categoria === "acordes" ? "Almizcle, Ámbar..." : "Bergamota, Jazmín..."}`}
                  className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Imagen (solo si no es acordes) */}
              {canHaveImage && (
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-foreground">
                    Imagen{" "}
                    <span className="text-xs font-normal text-muted-foreground">
                      (opcional)
                    </span>
                  </label>
                  {imagePreview ? (
                    <div className="flex items-center gap-3">
                      <div className="h-20 w-20 overflow-hidden rounded-xl border border-border bg-gray-50">
                        <img
                          src={imagePreview}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground truncate">
                          {imageFile?.name}
                        </p>
                        <button
                          type="button"
                          onClick={clearImage}
                          className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="h-3 w-3" /> Quitar imagen
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => imgRef.current?.click()}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-6 text-sm text-muted-foreground transition hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                    >
                      <ImageIcon className="h-5 w-5" />
                      Seleccionar imagen
                    </button>
                  )}
                  <input
                    ref={imgRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </div>
              )}

              {/* Recents */}
              {recents.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Agregados en esta sesión
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {recents.map((r) => (
                      <span
                        key={r.id}
                        className="flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                        {r.nombre}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={handleAdd}
                disabled={saving || !nombre.trim()}
                className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white disabled:opacity-40 hover:bg-primary/90"
              >
                {saving ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Agregando...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" /> Agregar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ─── Intensity bar color helper ─── */
function intensityColor(v: number): string {
  if (v >= 90) return "#16a34a";
  if (v >= 70) return "#4ade80";
  if (v >= 50) return "#ca8a04";
  if (v >= 30) return "#ea580c";
  return "#dc2626";
}

/* ─── Acordes Editor ─── */
function AcordesEditor({
  notes,
  acordes,
  onChange,
  onNoteAdded,
}: {
  notes: OlfactoryNote[];
  acordes: ProductAccord[];
  onChange: (a: ProductAccord[]) => void;
  onNoteAdded: (note: OlfactoryNote) => void;
}) {
  const [search, setSearch] = useState("");

  const getIntensidad = (id: string) =>
    acordes.find((a) => a.id === id)?.intensidad ?? 0;

  const isSelected = (id: string) => acordes.some((a) => a.id === id);

  const toggle = (id: string) => {
    if (isSelected(id)) {
      onChange(acordes.filter((a) => a.id !== id));
    } else {
      const updated = [...acordes, { id, intensidad: 75 }];
      onChange(updated.sort((a, b) => b.intensidad - a.intensidad));
    }
  };

  const setIntensidad = (id: string, value: number) => {
    const clamped = Math.max(0, Math.min(100, value));
    const updated = acordes.map((a) =>
      a.id === id ? { ...a, intensidad: clamped } : a,
    );
    onChange(updated.sort((a, b) => b.intensidad - a.intensidad));
  };

  const selected = acordes.filter((a) => notes.some((n) => n.id === a.id));
  const filtered = (
    search.trim()
      ? notes.filter((n) =>
          normalizeSearch(n.nombre).includes(normalizeSearch(search.trim())),
        )
      : notes
  )
    .slice()
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          Acordes principales
          {selected.length > 0 && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
              {selected.length} seleccionado{selected.length !== 1 ? "s" : ""}
            </span>
          )}
        </h3>
        <div className="flex items-center gap-2">
          <QuickCreateNote
            categoria="acordes"
            onCreated={(note) => {
              onNoteAdded(note);
              onChange(
                [...acordes, { id: note.id, intensidad: 75 }].sort(
                  (a, b) => b.intensidad - a.intensidad,
                ),
              );
            }}
          />
          <div className="relative min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar acorde..."
              className="w-full rounded-xl border border-border bg-white py-2 pl-9 pr-9 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Selected acordes with intensity bars */}
      {selected.length > 0 && (
        <div className="rounded-xl border border-border bg-white p-4 space-y-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Intensidades — ordenado de mayor a menor
          </p>
          {selected.map(({ id, intensidad }) => {
            const note = notes.find((n) => n.id === id);
            if (!note) return null;
            const color = intensityColor(intensidad);
            return (
              <div key={id} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    {note.nombre}
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={intensidad}
                      onChange={(e) =>
                        setIntensidad(
                          id,
                          e.target.value === "" ? 0 : parseInt(e.target.value),
                        )
                      }
                      className="w-14 rounded-lg border border-border bg-white px-2 py-0.5 text-center text-xs font-bold outline-none focus:border-primary"
                      style={{ color }}
                    />
                    <span className="text-xs text-muted-foreground">%</span>
                  </div>
                </div>
                <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={intensidad}
                    onChange={(e) =>
                      setIntensidad(id, parseInt(e.target.value))
                    }
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  />
                  <div
                    className="h-full rounded-full transition-all duration-150"
                    style={{ width: `${intensidad}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* All available acordes — checkboxes */}
      {filtered.length === 0 ? (
        <p className="py-3 text-center text-xs text-muted-foreground">
          Sin resultados para &ldquo;{search}&rdquo;
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
          {filtered.map((note) => {
            const sel = isSelected(note.id);
            const intensidad = getIntensidad(note.id);
            const color = sel ? intensityColor(intensidad) : undefined;
            return (
              <button
                key={note.id}
                type="button"
                onClick={() => toggle(note.id)}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-all",
                  sel
                    ? "border-primary/40 bg-primary/5 font-medium text-foreground"
                    : "border-border bg-white text-muted-foreground hover:border-primary/30 hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] font-bold transition-all",
                    sel
                      ? "border-primary bg-primary text-white"
                      : "border-border bg-white",
                  )}
                >
                  {sel && "✓"}
                </span>
                <span className="truncate">{note.nombre}</span>
                {sel && (
                  <span
                    className="ml-auto shrink-0 text-[10px] font-bold"
                    style={{ color }}
                  >
                    {intensidad}%
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

/* ─── Olfactory Selector ─── */
function OlfactorySelector({
  title,
  notes,
  selected,
  onChange,
  onNoteAdded,
}: {
  title: string;
  notes: OlfactoryNote[];
  selected: string[];
  onChange: (ids: string[]) => void;
  onNoteAdded: (note: OlfactoryNote) => void;
}) {
  const [search, setSearch] = useState("");

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  const categoryMap: Record<string, import("@/types").OlfactoryCategory> = {
    "Notas de salida": "notasSalida",
    "Notas de corazón": "notasCorazon",
    "Notas de fondo": "notasFondo",
  };
  const categoria = categoryMap[title] ?? "notasSalida";

  const filtered = (
    search.trim()
      ? notes.filter((n) =>
          normalizeSearch(n.nombre).includes(normalizeSearch(search.trim())),
        )
      : notes
  )
    .slice()
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          {title}
          {selected.length > 0 && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
              {selected.length} seleccionado{selected.length !== 1 ? "s" : ""}
            </span>
          )}
        </h3>
        <div className="flex items-center gap-2">
          <QuickCreateNote
            categoria={categoria}
            onCreated={(note) => {
              onNoteAdded(note);
              onChange([...selected, note.id]);
            }}
          />
          <div className="relative min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar nota..."
              className="w-full rounded-xl border border-border bg-white py-2 pl-9 pr-9 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="py-4 text-center text-xs text-muted-foreground">
          Sin resultados para &ldquo;{search}&rdquo;
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
          {filtered.map((note) => {
            const isSelected = selected.includes(note.id);
            return (
              <button
                key={note.id}
                type="button"
                onClick={() => toggle(note.id)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl border p-3 transition-all",
                  isSelected
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-border bg-white hover:border-primary/30 hover:bg-gray-50",
                )}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50 overflow-hidden">
                  {note.imagen && note.imagen.startsWith("http") ? (
                    <img
                      src={note.imagen}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-lg text-muted-foreground/30">◆</span>
                  )}
                </div>
                <span className="text-center text-[10px] font-medium leading-tight text-foreground">
                  {note.nombre}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

interface ProductFormProps {
  product?: Product | null;
  categories: Category[];
  subcategories: Subcategory[];
  brands: Brand[];
  genders: Gender[];
  onClose: () => void;
  onSaved: () => void;
}

interface ImageItem {
  id: string;
  type: "url" | "file";
  url: string;
  file?: File;
}

const initialProduct: Partial<Product> = {
  nombre: "",
  descripcion: "",
  marcaId: "",
  categoriaId: "",
  subcategoriaId: "",
  genero: "",
  precio: 0,
  precioOferta: undefined,
  stock: 0,
  imagenes: [],
  estado: "publicado",
  etiquetas: [],
  variantes: [],
  acordes: [],
  notasSalida: [],
  notasCorazon: [],
  notasFondo: [],
  visible: true,
  oferta: false,
  nuevo: false,
};

const DRAFTS_KEY = "europa_product_drafts_v2";

interface DraftEntry {
  id: string;
  data: Partial<Product>;
  createdAt: string;
  updatedAt: string;
}

function getDrafts(): DraftEntry[] {
  try {
    const raw = localStorage.getItem(DRAFTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveDraft(data: Partial<Product>, existingId?: string): string {
  try {
    const drafts = getDrafts();
    const now = new Date().toISOString();
    const id = existingId || `draft_${Date.now()}`;
    const idx = drafts.findIndex((d) => d.id === id);
    const entry: DraftEntry = {
      id,
      data,
      createdAt: idx >= 0 ? drafts[idx].createdAt : now,
      updatedAt: now,
    };
    if (idx >= 0) drafts[idx] = entry;
    else drafts.unshift(entry);
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts.slice(0, 20)));
    return id;
  } catch {
    return existingId || "";
  }
}

function deleteDraft(id: string) {
  try {
    const drafts = getDrafts().filter((d) => d.id !== id);
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
  } catch {}
}

function clearAllDrafts() {
  try {
    localStorage.removeItem(DRAFTS_KEY);
  } catch {}
}

// Legacy cleanup
function clearDraft() {
  try {
    localStorage.removeItem("europa_product_draft");
  } catch {}
}

export function ProductForm({
  product,
  categories,
  subcategories,
  brands,
  genders,
  onClose,
  onSaved,
}: ProductFormProps) {
  const { user } = useAuth();
  const {
    removeCategory,
    removeSubcategory,
    removeBrand,
    removeGender,
    olfactoryNotes: cachedOlfactoryNotes,
  } = useCatalogData();
  const [showDraftsPanel, setShowDraftsPanel] = useState(false);
  const [drafts, setDrafts] = useState<DraftEntry[]>(() => getDrafts());
  const currentDraftId = useRef<string | undefined>(undefined);

  const [form, setForm] = useState<Partial<Product>>(() =>
    product ? { ...initialProduct, ...product } : { ...initialProduct },
  );

  const initialImages = useMemo<ImageItem[]>(() => {
    return (product?.imagenes || []).map((url, i) => ({
      id: `existing-${i}`,
      type: "url" as const,
      url,
    }));
  }, [product?.imagenes]);

  const [images, setImages] = useState<ImageItem[]>(initialImages);

  // Auto-save draft every 5 seconds for new products (never auto-restore)
  useEffect(() => {
    if (product) return;
    const timer = setInterval(() => {
      if (form.nombre || form.categoriaId || form.marcaId) {
        // Include already-uploaded image URLs in the draft snapshot
        const imageUrls = images
          .filter((img) => img.type === "url")
          .map((img) => img.url);
        const snapshot = { ...form, imagenes: imageUrls };
        const id = saveDraft(snapshot, currentDraftId.current);
        currentDraftId.current = id;
        setDrafts(getDrafts());
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [form, images, product]);
  const [infoImageUrl, setInfoImageUrl] = useState<string>(
    product?.imagenInformativa || "",
  );
  const [infoImageFile, setInfoImageFile] = useState<File | null>(null);
  const infoImageRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [dragging, setDragging] = useState<string | null>(null);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [showNewBrand, setShowNewBrand] = useState(false);
  const [showNewSubcategory, setShowNewSubcategory] = useState(false);
  const [showNewGender, setShowNewGender] = useState(false);
  const [olfactoryNotes, setOlfactoryNotes] =
    useState<OlfactoryNote[]>(cachedOlfactoryNotes);
  const [formErrors, setFormErrors] = useState<
    { section: string; message: string }[]
  >([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setOlfactoryNotes(cachedOlfactoryNotes);
    if (cachedOlfactoryNotes.length === 0) {
      getOlfactoryNotes()
        .then(setOlfactoryNotes)
        .catch(() => {});
    }
  }, [cachedOlfactoryNotes]);

  const filteredSubcategories = subcategories.filter(
    (s) => s.categoriaId === form.categoriaId && s.activo,
  );

  const handleFiles = (selected: FileList | null) => {
    if (!selected) return;
    const newFiles = Array.from(selected).filter((f) =>
      f.type.startsWith("image/"),
    );
    if (newFiles.length === 0) return;
    const newItems: ImageItem[] = newFiles.map((file) => ({
      id: `new-${generateId()}`,
      type: "file",
      url: URL.createObjectURL(file),
      file,
    }));
    setImages((prev) => [...prev, ...newItems]);
  };

  const removeImage = (id: string) => {
    const img = images.find((i) => i.id === id);
    if (img && img.type === "url") {
      deleteProductImage(img.url);
    }
    setImages((prev) => prev.filter((i) => i.id !== id));
  };

  const moveImage = (from: number, to: number) => {
    if (to < 0 || to >= images.length) return;
    const arr = [...images];
    const [removed] = arr.splice(from, 1);
    arr.splice(to, 0, removed);
    setImages(arr);
  };

  const setMainImage = (index: number) => {
    if (index === 0) return;
    const arr = [...images];
    const [selected] = arr.splice(index, 1);
    arr.unshift(selected);
    setImages(arr);
  };

  const handleDragStart = (id: string) => setDragging(id);
  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (dragging === id) return;
    const from = images.findIndex((i) => i.id === dragging);
    const to = images.findIndex((i) => i.id === id);
    if (from >= 0 && to >= 0) moveImage(from, to);
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (!t) return;
    setForm((prev) => ({
      ...prev,
      etiquetas: [...(prev.etiquetas || []).filter((x) => x !== t), t],
    }));
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    setForm((prev) => ({
      ...prev,
      etiquetas: (prev.etiquetas || []).filter((x) => x !== tag),
    }));
  };

  const validate = () => {
    const errors: { section: string; message: string }[] = [];
    if (!form.nombre?.trim())
      errors.push({
        section: "info",
        message: "El nombre del producto es requerido",
      });
    if (!form.descripcion?.trim())
      errors.push({ section: "info", message: "La descripción es requerida" });
    if (!form.marcaId)
      errors.push({
        section: "clasificacion",
        message: "Selecciona una marca",
      });
    if (!form.categoriaId)
      errors.push({
        section: "clasificacion",
        message: "Selecciona una categoría",
      });
    if (!form.genero)
      errors.push({
        section: "clasificacion",
        message: "Selecciona un género",
      });
    if (form.precio === undefined || form.precio <= 0)
      errors.push({
        section: "precio",
        message: "Ingresa un precio válido mayor a 0",
      });
    if (form.stock === undefined || form.stock < 0)
      errors.push({
        section: "precio",
        message: "El stock no puede ser negativo",
      });
    if (images.length === 0)
      errors.push({
        section: "imagenes",
        message: "Agrega al menos una imagen del producto",
      });
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validate();
    if (errors.length > 0) {
      setFormErrors(errors);
      toast.error(`Revisa ${errors.length} campo(s) antes de guardar`);
      const section = document.getElementById(`section-${errors[0].section}`);
      section?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    setFormErrors([]);

    setLoading(true);
    try {
      const existingUrls = images
        .filter((i) => i.type === "url")
        .map((i) => i.url);
      const fileItems = images.filter((i) => i.type === "file");
      let uploadedUrls: string[] = [];
      if (fileItems.length > 0) {
        const tempId = product?.id || generateId();
        uploadedUrls = await uploadProductImages(
          tempId,
          fileItems.map((i) => i.file!),
        );
      }

      const orderedUrls: string[] = [];
      let fileIdx = 0;
      images.forEach((img) => {
        if (img.type === "url") orderedUrls.push(img.url);
        else if (img.type === "file" && uploadedUrls[fileIdx]) {
          orderedUrls.push(uploadedUrls[fileIdx]);
          fileIdx++;
        }
      });

      // Upload informative image if a new file was selected
      let finalInfoImageUrl: string | null = infoImageUrl || null;
      if (infoImageFile) {
        const tempId = product?.id || generateId();
        finalInfoImageUrl = await uploadProductInfoImage(tempId, infoImageFile);
      }

      const payload = {
        ...form,
        imagenes: orderedUrls,
        imagenInformativa: finalInfoImageUrl || null,
        oferta:
          !!form.precioOferta &&
          form.precioOferta > 0 &&
          form.precioOferta < (form.precio ?? 0),
        precio: Number(form.precio) || 0,
        precioOferta:
          form.precioOferta && form.precioOferta > 0
            ? Number(form.precioOferta)
            : null,
        stock: Number(form.stock || 0),
        visible: form.estado === "publicado" || form.estado === "agotado",
        fechaActualizacion: new Date().toISOString(),
        creadoPor: product ? form.creadoPor || null : user?.id || null,
        actualizadoPor: user?.id || null,
      } as Product;

      // Firestore rejects undefined values — strip them
      Object.keys(payload).forEach((key) => {
        if ((payload as any)[key] === undefined) {
          (payload as any)[key] = null;
        }
      });

      if (product) {
        await updateProduct(product.id, payload);
        toast.success("Producto actualizado");
      } else {
        await createProduct(payload);
        toast.success("Producto creado");
        // Delete this draft on successful save
        if (currentDraftId.current) deleteDraft(currentDraftId.current);
        clearDraft(); // legacy
      }
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  const SECTIONS = [
    { id: "info", label: "Información", icon: "📝" },
    { id: "clasificacion", label: "Clasificación", icon: "🏷️" },
    { id: "precio", label: "Precio e inventario", icon: "💰" },
    { id: "imagenes", label: "Imágenes", icon: "🖼️" },
    { id: "info-image", label: "Img. informativa", icon: "📋" },
    { id: "variantes", label: "Variantes", icon: "🔀" },
    { id: "olfactoria", label: "Biblioteca olfativa", icon: "🌿" },
    { id: "estado", label: "Estado y etiquetas", icon: "⚙️" },
  ];

  const scrollTo = (id: string) => {
    document
      .getElementById(`section-${id}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-white px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <Plus className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground leading-tight">
              {product ? "Editar producto" : "Nuevo producto"}
            </h2>
            {form.nombre && (
              <p className="text-xs text-muted-foreground truncate max-w-xs">
                {form.nombre}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!product && drafts.length > 0 && (
            <button
              type="button"
              onClick={() => setShowDraftsPanel(true)}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700 hover:bg-amber-100"
            >
              <Edit className="h-3.5 w-3.5" />
              Borradores ({drafts.length})
            </button>
          )}
          <Button size="sm" onClick={handleSubmit} loading={loading}>
            {product ? "Guardar" : "Publicar"}
          </Button>
          <button
            onClick={onClose}
            className="rounded-full p-2 transition-colors hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar nav — hidden on mobile */}
        <nav className="hidden w-52 shrink-0 flex-col gap-0.5 overflow-y-auto border-r border-border bg-gray-50/80 p-3 lg:flex">
          {SECTIONS.map((s) => {
            const sectionErrors = formErrors.filter((e) => e.section === s.id);
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => scrollTo(s.id)}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-all hover:bg-white hover:shadow-sm",
                  sectionErrors.length > 0
                    ? "bg-red-50/70 text-red-700"
                    : "text-foreground",
                )}
              >
                <span className="text-base leading-none">{s.icon}</span>
                <span className="font-medium">{s.label}</span>
                {sectionErrors.length > 0 && (
                  <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                    {sectionErrors.length}
                  </span>
                )}
              </button>
            );
          })}
          <div className="mt-4 px-3">
            <Button
              size="sm"
              className="w-full"
              onClick={handleSubmit}
              loading={loading}
            >
              {product ? "Guardar cambios" : "Crear producto"}
            </Button>
          </div>
        </nav>

        {/* Main form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="space-y-0 divide-y divide-border">
            {formErrors.length > 0 && (
              <div className="mx-6 mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-semibold text-red-800">
                  Revisa los siguientes campos antes de guardar:
                </p>
                <ul className="mt-2 space-y-1">
                  {formErrors.map((err, idx) => (
                    <li key={idx}>
                      <button
                        type="button"
                        onClick={() => scrollTo(err.section)}
                        className="text-sm text-red-700 underline hover:text-red-900"
                      >
                        {err.message}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {/* ── Información principal ── */}
            <section id="section-info" className="px-6 py-7">
              <SectionHeader label="Información principal" icon="📝" />
              <div className="mt-4 space-y-4">
                <Input
                  label="Nombre del producto *"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  required
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Código interno"
                    value={form.codigoInterno || ""}
                    onChange={(e) =>
                      setForm({ ...form, codigoInterno: e.target.value })
                    }
                    placeholder="Ej: EUR-001"
                  />
                  <Input
                    label="SKU"
                    value={form.sku || ""}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    placeholder="Ej: SKU-12345"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Descripción
                  </label>
                  <textarea
                    value={form.descripcion || ""}
                    onChange={(e) =>
                      setForm({ ...form, descripcion: e.target.value })
                    }
                    rows={4}
                    placeholder="Describe el producto, sus características y beneficios..."
                    className="w-full resize-none rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </div>
              </div>
            </section>

            {/* ── Clasificación ── */}
            <section id="section-clasificacion" className="px-6 py-7">
              <SectionHeader label="Clasificación" icon="🏷️" />
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Marca *
                  </label>
                  <select
                    value={form.marcaId}
                    onChange={(e) =>
                      setForm({ ...form, marcaId: e.target.value })
                    }
                    className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-primary"
                    required
                  >
                    <option value="">Seleccionar marca</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.nombre}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowNewBrand(true)}
                    className="mt-1.5 text-xs font-medium text-primary hover:underline"
                  >
                    + Nueva marca
                  </button>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Categoría *
                  </label>
                  <select
                    value={form.categoriaId}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        categoriaId: e.target.value,
                        subcategoriaId: "",
                      })
                    }
                    className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-primary"
                    required
                  >
                    <option value="">Seleccionar categoría</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowNewCategory(true)}
                    className="mt-1.5 text-xs font-medium text-primary hover:underline"
                  >
                    + Nueva categoría
                  </button>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Subcategoría
                  </label>
                  <div className="flex items-start gap-2">
                    <select
                      value={form.subcategoriaId || ""}
                      onChange={(e) =>
                        setForm({ ...form, subcategoriaId: e.target.value })
                      }
                      className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-primary"
                    >
                      <option value="">Sin subcategoría</option>
                      {filteredSubcategories.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.nombre}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowNewSubcategory(true)}
                      className="flex shrink-0 items-center gap-1 rounded-xl border border-border bg-white px-3 py-2.5 text-sm font-medium text-primary hover:bg-primary/5"
                      title="Nueva subcategoría"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Género
                  </label>
                  <div className="flex items-start gap-2">
                    <select
                      value={form.genero || ""}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          genero: e.target.value || undefined,
                        })
                      }
                      className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-primary"
                    >
                      <option value="">Sin género</option>
                      {genders
                        .filter((g) => g.activo)
                        .sort((a, b) => a.orden - b.orden)
                        .map((g) => (
                          <option key={g.id} value={g.nombre}>
                            {g.nombre}
                          </option>
                        ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowNewGender(true)}
                      className="flex shrink-0 items-center gap-1 rounded-xl border border-border bg-white px-3 py-2.5 text-sm font-medium text-primary hover:bg-primary/5"
                      title="Nuevo género"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* ── Precio e inventario ── */}
            <section id="section-precio" className="px-6 py-7">
              <SectionHeader label="Precio e inventario" icon="💰" />
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Precio base *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      $
                    </span>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="0.00"
                      value={form.precio || ""}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          precio:
                            e.target.value === ""
                              ? 0
                              : parseFloat(e.target.value),
                        })
                      }
                      required
                      className="w-full rounded-xl border border-border bg-white py-2.5 pl-7 pr-4 text-sm outline-none focus:border-primary"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Precio oferta
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      $
                    </span>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="0.00"
                      value={form.precioOferta || ""}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          precioOferta:
                            e.target.value === ""
                              ? undefined
                              : parseFloat(e.target.value),
                        })
                      }
                      className="w-full rounded-xl border border-border bg-white py-2.5 pl-7 pr-4 text-sm outline-none focus:border-primary"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Stock
                  </label>
                  <input
                    type="number"
                    min={0}
                    placeholder="0"
                    value={form.stock || ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        stock:
                          e.target.value === "" ? 0 : parseInt(e.target.value),
                      })
                    }
                    className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-primary"
                  />
                </div>
              </div>
              {form.precioOferta &&
                form.precio &&
                form.precioOferta < form.precio && (
                  <div className="mt-3 flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-xs font-medium text-green-700">
                    <span>✓</span>
                    <span>
                      Descuento de{" "}
                      {Math.round((1 - form.precioOferta / form.precio) * 100)}%
                      aplicado
                    </span>
                  </div>
                )}
            </section>

            {/* ── Imágenes ── */}
            <section id="section-imagenes" className="px-6 py-7">
              <SectionHeader label="Imágenes del producto" icon="🖼️" />
              <div className="mt-4">
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleFiles(e.dataTransfer.files);
                  }}
                  onClick={() => fileRef.current?.click()}
                  className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/20 py-10 transition-all hover:border-primary/50 hover:bg-primary/5"
                >
                  <Upload className="h-7 w-7 text-muted-foreground/50" />
                  <p className="mt-2 text-sm font-semibold text-foreground">
                    Subir imágenes
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Clic o arrastra aquí · Múltiples imágenes
                  </p>
                  <input
                    ref={fileRef}
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFiles(e.target.files)}
                  />
                </div>

                {images.length > 0 && (
                  <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                    {images.map((img, idx) => {
                      const isMain = idx === 0;
                      return (
                        <div
                          key={img.id}
                          draggable
                          onDragStart={() => handleDragStart(img.id)}
                          onDragOver={(e) => handleDragOver(e, img.id)}
                          onDragEnd={() => setDragging(null)}
                          className={cn(
                            "group relative aspect-square cursor-move overflow-hidden rounded-xl border-2 bg-gray-50 transition-all",
                            isMain
                              ? "border-primary ring-2 ring-primary/20"
                              : "border-border",
                          )}
                        >
                          <img
                            src={img.url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                          {isMain && (
                            <div className="absolute left-1.5 top-1.5 rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-bold text-white">
                              PORTADA
                            </div>
                          )}
                          <div className="absolute inset-0 flex items-center justify-center gap-1.5 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                            {!isMain && (
                              <button
                                type="button"
                                onClick={() => setMainImage(idx)}
                                className="rounded-full bg-white p-1.5 text-primary shadow-sm"
                                title="Portada"
                              >
                                <Star className="h-3.5 w-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => removeImage(img.id)}
                              className="rounded-full bg-white p-1.5 text-red-500 shadow-sm"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>

            {/* ── Imagen informativa ── */}
            <section id="section-info-image" className="px-6 py-7">
              <SectionHeader
                label="Imagen informativa"
                icon="📋"
                description="Pirámide olfativa, infografía, material promocional u otra imagen complementaria. Opcional."
              />
              <div className="mt-4">
                {infoImageUrl ? (
                  <div className="group relative overflow-hidden rounded-2xl border border-border bg-gray-50">
                    <img
                      src={infoImageUrl}
                      alt="Imagen informativa"
                      className="w-full object-contain"
                      style={{ maxHeight: "420px" }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => infoImageRef.current?.click()}
                        className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-medium text-foreground shadow-sm hover:bg-gray-50"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        Reemplazar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setInfoImageUrl("");
                          setInfoImageFile(null);
                        }}
                        className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-medium text-red-600 shadow-sm hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Eliminar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => infoImageRef.current?.click()}
                    className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/20 py-10 transition-all hover:border-primary/50 hover:bg-primary/5"
                  >
                    <ImageIcon className="h-7 w-7 text-muted-foreground/40" />
                    <p className="mt-2 text-sm font-semibold text-foreground">
                      Subir imagen informativa
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG o WebP · Ancho completo
                    </p>
                  </div>
                )}
                <input
                  ref={infoImageRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setInfoImageFile(file);
                    setInfoImageUrl(URL.createObjectURL(file));
                  }}
                />
              </div>
            </section>

            {/* ── Variantes ── */}
            <section id="section-variantes" className="px-6 py-7">
              <SectionHeader
                label="Variantes"
                icon="🔀"
                description="Diferentes versiones del mismo producto (tallas, colores, concentraciones, etc.)"
              />
              <div className="mt-4">
                <VariantsEditor
                  variants={form.variantes || []}
                  onChange={(v) => setForm({ ...form, variantes: v })}
                />
              </div>
            </section>

            {/* ── Biblioteca olfativa ── */}
            <section id="section-olfactoria" className="px-6 py-7">
              <SectionHeader
                label="Pirámide olfativa"
                icon="🌿"
                description="Selecciona los acordes y notas que componen este perfume"
              />
              <div className="mt-4 space-y-6">
                <AcordesEditor
                  notes={olfactoryNotes.filter(
                    (n) => n.categoria === "acordes" && n.activo,
                  )}
                  acordes={form.acordes || []}
                  onChange={(a) => setForm({ ...form, acordes: a })}
                  onNoteAdded={(note) =>
                    setOlfactoryNotes((prev) => [...prev, note])
                  }
                />
                <OlfactorySelector
                  title="Notas de salida"
                  notes={olfactoryNotes.filter(
                    (n) => n.categoria === "notasSalida" && n.activo,
                  )}
                  selected={form.notasSalida || []}
                  onChange={(ids) => setForm({ ...form, notasSalida: ids })}
                  onNoteAdded={(note) =>
                    setOlfactoryNotes((prev) => [...prev, note])
                  }
                />
                <OlfactorySelector
                  title="Notas de corazón"
                  notes={olfactoryNotes.filter(
                    (n) => n.categoria === "notasCorazon" && n.activo,
                  )}
                  selected={form.notasCorazon || []}
                  onChange={(ids) => setForm({ ...form, notasCorazon: ids })}
                  onNoteAdded={(note) =>
                    setOlfactoryNotes((prev) => [...prev, note])
                  }
                />
                <OlfactorySelector
                  title="Notas de fondo"
                  notes={olfactoryNotes.filter(
                    (n) => n.categoria === "notasFondo" && n.activo,
                  )}
                  selected={form.notasFondo || []}
                  onChange={(ids) => setForm({ ...form, notasFondo: ids })}
                  onNoteAdded={(note) =>
                    setOlfactoryNotes((prev) => [...prev, note])
                  }
                />
              </div>
            </section>

            {/* ── Estado y etiquetas ── */}
            <section id="section-estado" className="px-6 py-7">
              <SectionHeader label="Estado y etiquetas" icon="⚙️" />
              <div className="mt-4 space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Estado de publicación
                  </label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {(
                      ["publicado", "borrador", "oculto", "agotado"] as const
                    ).map((s) => {
                      const colors: Record<string, string> = {
                        publicado: "green",
                        borrador: "amber",
                        oculto: "gray",
                        agotado: "red",
                      };
                      const c = colors[s];
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setForm({ ...form, estado: s })}
                          className={cn(
                            "rounded-xl border py-2.5 text-xs font-semibold capitalize transition-all",
                            form.estado === s
                              ? `border-${c}-400 bg-${c}-50 text-${c}-700`
                              : "border-border text-muted-foreground hover:border-primary/30",
                          )}
                        >
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Etiquetas
                  </label>
                  <div className="flex gap-2">
                    <input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && (e.preventDefault(), addTag())
                      }
                      placeholder="Escribir y Enter para agregar..."
                      className="flex-1 rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-primary"
                    />
                    <button
                      type="button"
                      onClick={addTag}
                      className="rounded-xl bg-muted px-4 py-2.5 text-sm font-medium hover:bg-gray-200"
                    >
                      +
                    </button>
                  </div>
                  {(form.etiquetas || []).length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      {(form.etiquetas || []).map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="hover:text-red-500"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Bottom save */}
            <div className="px-6 py-6">
              <Button
                type="submit"
                size="lg"
                className="w-full"
                onClick={handleSubmit}
                loading={loading}
              >
                {product ? "Guardar cambios" : "Crear producto"}
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* ── Drafts Panel ── */}
      {showDraftsPanel && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowDraftsPanel(false)}
          />
          <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-8 py-5">
              <div>
                <h3 className="text-xl font-bold text-foreground">
                  Borradores guardados
                </h3>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Selecciona uno para continuar editando
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDraftsPanel(false)}
                className="rounded-full p-2 text-muted-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto px-8 py-4 space-y-2">
              {drafts.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No hay borradores guardados
                </p>
              ) : (
                drafts.map((draft) => (
                  <div
                    key={draft.id}
                    className="flex items-center gap-3 rounded-xl border border-border bg-white p-3 hover:bg-muted/30"
                  >
                    {/* Thumbnail */}
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border bg-gray-50">
                      {draft.data.imagenes?.[0] ? (
                        <img
                          src={draft.data.imagenes[0]}
                          alt=""
                          className="h-full w-full object-contain p-1"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted-foreground/30">
                          <Package className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">
                        {draft.data.nombre || "(sin nombre)"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {draft.data.imagenes?.length
                          ? `${draft.data.imagenes.length} imagen${draft.data.imagenes.length !== 1 ? "es" : ""} · `
                          : ""}
                        Guardado{" "}
                        {new Date(draft.updatedAt).toLocaleString("es", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setForm({ ...initialProduct, ...draft.data });
                          currentDraftId.current = draft.id;
                          // Restore images from draft URLs
                          const draftImages: ImageItem[] = (
                            draft.data.imagenes || []
                          ).map((url: string, i: number) => ({
                            id: `draft-${draft.id}-${i}`,
                            type: "url" as const,
                            url,
                          }));
                          setImages(draftImages);
                          // Restore informative image
                          setInfoImageUrl(draft.data.imagenInformativa || "");
                          setShowDraftsPanel(false);
                          toast.success("Borrador cargado");
                        }}
                        className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90"
                      >
                        Cargar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          deleteDraft(draft.id);
                          setDrafts(getDrafts());
                        }}
                        className="rounded-xl border border-border p-2 text-muted-foreground hover:bg-red-50 hover:text-danger"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            {drafts.length > 0 && (
              <div className="flex justify-end border-t border-border px-8 py-4">
                <button
                  type="button"
                  onClick={() => {
                    clearAllDrafts();
                    setDrafts([]);
                    setShowDraftsPanel(false);
                    toast.success("Todos los borradores eliminados");
                  }}
                  className="text-sm font-medium text-danger hover:underline"
                >
                  Eliminar todos los borradores
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <QuickManageModal
        title="Categorías"
        open={showNewCategory}
        onClose={() => setShowNewCategory(false)}
        items={categories}
        onCreated={async (name, color) => {
          const created = await createCategory({
            nombre: name,
            color,
            orden: categories.length + 1,
            activo: true,
          });
          setForm((prev) => ({ ...prev, categoriaId: created.id }));
          toast.success("Categoría creada");
        }}
        onDelete={async (id) => {
          await deleteCategory(id);
          removeCategory(id);
          if (form.categoriaId === id) {
            setForm((prev) => ({
              ...prev,
              categoriaId: "",
              subcategoriaId: "",
            }));
          }
        }}
      />

      <QuickManageModal
        title="Marcas"
        open={showNewBrand}
        onClose={() => setShowNewBrand(false)}
        items={brands}
        onCreated={async (name, color) => {
          const created = await createBrand({
            nombre: name,
            color,
            orden: brands.length + 1,
            activo: true,
          });
          setForm((prev) => ({ ...prev, marcaId: created.id }));
          toast.success("Marca creada");
        }}
        onDelete={async (id) => {
          await deleteBrand(id);
          removeBrand(id);
          if (form.marcaId === id) {
            setForm((prev) => ({ ...prev, marcaId: "" }));
          }
        }}
      />

      <QuickManageModal
        title="Géneros"
        open={showNewGender}
        onClose={() => setShowNewGender(false)}
        items={genders}
        showColors={false}
        onCreated={async (name) => {
          const created = await createGender({
            nombre: name,
            orden: genders.length + 1,
            activo: true,
          });
          setForm((prev) => ({ ...prev, genero: created.nombre }));
          toast.success("Género creado");
        }}
        onDelete={async (id) => {
          await deleteGender(id);
          removeGender(id);
          const removed = genders.find((g) => g.id === id);
          if (removed && form.genero === removed.nombre) {
            setForm((prev) => ({ ...prev, genero: "" }));
          }
        }}
      />

      <QuickSubcategoryModal
        open={showNewSubcategory}
        onClose={() => setShowNewSubcategory(false)}
        categories={categories}
        subcategories={subcategories}
        currentCategoryId={form.categoriaId}
        onCreated={async (name, categoryId) => {
          const created = await createSubcategory({
            nombre: name,
            categoriaId: categoryId,
            orden: subcategories.length + 1,
            activo: true,
          });
          setForm((prev) => ({ ...prev, subcategoriaId: created.id }));
          toast.success("Subcategoría creada");
        }}
        onDelete={async (id) => {
          await deleteSubcategory(id);
          removeSubcategory(id);
          if (form.subcategoriaId === id) {
            setForm((prev) => ({ ...prev, subcategoriaId: "" }));
          }
        }}
      />
    </div>
  );
}
