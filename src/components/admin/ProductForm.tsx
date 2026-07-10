"use client";

import React, {
  useState,
  useRef,
  useMemo,
  useEffect,
  useCallback,
} from "react";
import { X, Upload, Trash2, Star, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import {
  createProduct,
  updateProduct,
  uploadProductImages,
  deleteProductImage,
} from "@/lib/products";
import {
  createCategory,
  deleteCategory,
  createBrand,
  deleteBrand,
} from "@/lib/categories";
import { useAuth } from "@/context/AuthContext";
import { generateId, cn } from "@/lib/utils";
import toast from "react-hot-toast";
import type { Product, Category, Subcategory, Brand } from "@/types";

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

function QuickManageModal({
  title,
  open,
  onClose,
  items,
  onCreated,
  onDelete,
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  items: { id: string; nombre: string; color?: string }[];
  onCreated: (name: string, color: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [name, setName] = React.useState("");
  const [color, setColor] = React.useState(PRESET_COLORS[0]);
  const [saving, setSaving] = React.useState(false);

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

  const [confirmTarget, setConfirmTarget] = React.useState<{
    id: string;
    nombre: string;
  } | null>(null);

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
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {items.length > 0 && (
          <div className="max-h-48 overflow-y-auto border-b border-border px-6 py-3">
            <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
              Existentes
            </p>
            <div className="space-y-1">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-muted/50"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="h-4 w-4 shrink-0 rounded-full"
                      style={{
                        backgroundColor: item.color || PRESET_COLORS[0],
                      }}
                    />
                    <span className="text-sm font-medium">{item.nombre}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id, item.nombre)}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-red-50 hover:text-danger"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4 p-6">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Nombre
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="Nuevo nombre..."
              autoFocus
              className="w-full rounded-xl border border-border bg-white px-4 py-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Color
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    "h-8 w-8 rounded-full border-2 transition-all",
                    color === c
                      ? "border-foreground scale-110"
                      : "border-transparent",
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving || !name.trim()}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? "Creando..." : "Crear"}
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

interface ProductFormProps {
  product?: Product | null;
  categories: Category[];
  subcategories: Subcategory[];
  brands: Brand[];
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
  genero: "unisex",
  precio: 0,
  precioOferta: undefined,
  stock: 0,
  imagenes: [],
  estado: "publicado",
  etiquetas: [],
  visible: true,
  oferta: false,
  nuevo: false,
};

const DRAFT_KEY = "europa_product_draft";

function loadDraft(): Partial<Product> | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveDraft(data: Partial<Product>) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
  } catch {}
}

function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {}
}

export function ProductForm({
  product,
  categories,
  subcategories,
  brands,
  onClose,
  onSaved,
}: ProductFormProps) {
  const { user } = useAuth();
  const [draftRestored, setDraftRestored] = useState(false);
  const [showDraftPrompt, setShowDraftPrompt] = useState(false);

  const getInitialForm = useCallback((): Partial<Product> => {
    if (product) return { ...initialProduct, ...product };
    const draft = loadDraft();
    if (draft && draft.nombre) {
      setShowDraftPrompt(true);
      return draft;
    }
    return { ...initialProduct };
  }, [product]);

  const [form, setForm] = useState<Partial<Product>>(getInitialForm);

  // Auto-save draft every 3 seconds for new products
  useEffect(() => {
    if (product) return; // don't draft edits
    const timer = setInterval(() => {
      if (form.nombre || form.categoriaId || form.marcaId) {
        saveDraft(form);
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [form, product]);

  const initialImages = useMemo<ImageItem[]>(() => {
    return (product?.imagenes || []).map((url, i) => ({
      id: `existing-${i}`,
      type: "url" as const,
      url,
    }));
  }, [product?.imagenes]);

  const [images, setImages] = useState<ImageItem[]>(initialImages);
  const [loading, setLoading] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [dragging, setDragging] = useState<string | null>(null);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [showNewBrand, setShowNewBrand] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !form.nombre ||
      !form.categoriaId ||
      !form.marcaId ||
      form.precio === undefined
    ) {
      toast.error("Completa los campos requeridos");
      return;
    }

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

      const payload = {
        ...form,
        imagenes: orderedUrls,
        oferta:
          !!form.precioOferta &&
          form.precioOferta > 0 &&
          form.precioOferta < form.precio,
        precio: Number(form.precio),
        precioOferta:
          form.precioOferta && form.precioOferta > 0
            ? Number(form.precioOferta)
            : undefined,
        stock: Number(form.stock || 0),
        visible: form.estado === "publicado" || form.estado === "agotado",
        fechaActualizacion: new Date().toISOString(),
        creadoPor: product ? form.creadoPor : user?.id,
        actualizadoPor: user?.id,
      } as Product;

      if (product) {
        await updateProduct(product.id, payload);
        toast.success("Producto actualizado");
      } else {
        await createProduct(payload);
        toast.success("Producto creado");
        clearDraft();
      }
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <h2 className="text-lg font-semibold">
          {product ? "Editar producto" : "Nuevo producto"}
        </h2>
        <button
          onClick={onClose}
          className="rounded-full p-2 transition-colors hover:bg-muted"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
        {showDraftPrompt && !product && (
          <div className="mb-4 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <span className="text-sm font-medium text-amber-800">
              Se restauró un borrador pendiente
            </span>
            <button
              type="button"
              onClick={() => {
                clearDraft();
                setForm({ ...initialProduct });
                setShowDraftPrompt(false);
              }}
              className="text-xs font-medium text-amber-700 underline hover:text-amber-900"
            >
              Descartar
            </button>
          </div>
        )}
        <div className="space-y-8">
          <section>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Información principal
            </h3>
            <div className="space-y-4">
              <Input
                label="Nombre del producto *"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                required
              />
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Descripción
                </label>
                <textarea
                  value={form.descripcion || ""}
                  onChange={(e) =>
                    setForm({ ...form, descripcion: e.target.value })
                  }
                  rows={3}
                  className="w-full rounded-xl border border-border bg-white px-4 py-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Clasificación
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Marca *
                </label>
                <select
                  value={form.marcaId}
                  onChange={(e) =>
                    setForm({ ...form, marcaId: e.target.value })
                  }
                  className="w-full rounded-xl border border-border bg-white px-4 py-3 text-base outline-none focus:border-primary"
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
                  onChange={(e) => {
                    setForm({
                      ...form,
                      categoriaId: e.target.value,
                      subcategoriaId: "",
                    });
                  }}
                  className="w-full rounded-xl border border-border bg-white px-4 py-3 text-base outline-none focus:border-primary"
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
                <select
                  value={form.subcategoriaId || ""}
                  onChange={(e) =>
                    setForm({ ...form, subcategoriaId: e.target.value })
                  }
                  className="w-full rounded-xl border border-border bg-white px-4 py-3 text-base outline-none focus:border-primary"
                >
                  <option value="">Seleccionar subcategoría</option>
                  {filteredSubcategories.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Género
                </label>
                <select
                  value={form.genero}
                  onChange={(e) =>
                    setForm({ ...form, genero: e.target.value as any })
                  }
                  className="w-full rounded-xl border border-border bg-white px-4 py-3 text-base outline-none focus:border-primary"
                >
                  <option value="unisex">Unisex</option>
                  <option value="hombre">Hombre</option>
                  <option value="mujer">Mujer</option>
                  <option value="ninos">Niños</option>
                </select>
              </div>
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Precio e inventario
            </h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <Input
                label="Precio *"
                type="number"
                min={0}
                step="0.01"
                placeholder="0.00"
                value={form.precio || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    precio:
                      e.target.value === "" ? 0 : parseFloat(e.target.value),
                  })
                }
                required
              />
              <Input
                label="Precio oferta"
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
              />
              <Input
                label="Stock"
                type="number"
                min={0}
                placeholder="0"
                value={form.stock || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    stock: e.target.value === "" ? 0 : parseInt(e.target.value),
                  })
                }
              />
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Imágenes
            </h3>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleFiles(e.dataTransfer.files);
              }}
              onClick={() => fileRef.current?.click()}
              className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/30 p-8 transition-colors hover:bg-muted/50"
            >
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-sm font-medium text-foreground">
                Haz clic o arrastra imágenes aquí
              </p>
              <p className="text-xs text-muted-foreground">
                Arrastra para ordenar, selecciona ★ para portada
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
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
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
                        isMain ? "border-primary" : "border-border",
                      )}
                    >
                      <img
                        src={img.url}
                        alt=""
                        className="h-full w-full object-contain p-2"
                      />
                      {isMain && (
                        <div className="absolute left-2 top-2 rounded-full bg-primary p-1 text-white">
                          <Star className="h-3.5 w-3.5 fill-current" />
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                        {!isMain && (
                          <button
                            type="button"
                            onClick={() => setMainImage(idx)}
                            className="rounded-full bg-white p-2 text-primary shadow-sm"
                            title="Convertir en portada"
                          >
                            <Star className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => moveImage(idx, idx - 1)}
                          disabled={idx === 0}
                          className="rounded-full bg-white p-2 text-foreground shadow-sm disabled:opacity-40"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveImage(idx, idx + 1)}
                          disabled={idx === images.length - 1}
                          className="rounded-full bg-white p-2 text-foreground shadow-sm disabled:opacity-40"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeImage(img.id)}
                          className="rounded-full bg-white p-2 text-danger shadow-sm"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Estado y etiquetas
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Estado
                </label>
                <select
                  value={form.estado}
                  onChange={(e) =>
                    setForm({ ...form, estado: e.target.value as any })
                  }
                  className="w-full rounded-xl border border-border bg-white px-4 py-3 text-base outline-none focus:border-primary"
                >
                  <option value="publicado">Publicado</option>
                  <option value="borrador">Borrador</option>
                  <option value="oculto">Oculto</option>
                  <option value="agotado">Agotado</option>
                </select>
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
                    placeholder="Agregar etiqueta"
                    className="flex-1 rounded-xl border border-border bg-white px-4 py-2 text-base outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="rounded-xl bg-muted px-4 py-2 text-sm font-medium text-foreground hover:bg-gray-200"
                  >
                    +
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(form.etiquetas || []).map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-danger"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </form>

      <div className="border-t border-border p-6">
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
          if (form.marcaId === id) {
            setForm((prev) => ({ ...prev, marcaId: "" }));
          }
        }}
      />
    </div>
  );
}
