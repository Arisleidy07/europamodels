"use client";

import React, { useState, useRef } from "react";
import { X, Upload, GripVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createProduct, updateProduct, uploadProductImages } from "@/lib/products";
import { useAuth } from "@/context/AuthContext";
import { generateId } from "@/lib/utils";
import toast from "react-hot-toast";
import type { Product, Category, Subcategory, Brand } from "@/types";

interface ProductFormProps {
  product?: Product | null;
  categories: Category[];
  subcategories: Subcategory[];
  brands: Brand[];
  onClose: () => void;
  onSaved: () => void;
}

const initialProduct: Partial<Product> = {
  nombre: "",
  descripcion: "",
  codigoInterno: "",
  sku: "",
  marcaId: "",
  categoriaId: "",
  subcategoriaId: "",
  genero: "unisex",
  precio: 0,
  stock: 0,
  imagenes: [],
  estado: "publicado",
  etiquetas: [],
  visible: true,
};

export function ProductForm({ product, categories, subcategories, brands, onClose, onSaved }: ProductFormProps) {
  const { user } = useAuth();
  const [form, setForm] = useState<Partial<Product>>(product ? { ...product } : initialProduct);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>(product?.imagenes || []);
  const [loading, setLoading] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const filteredSubcategories = subcategories.filter(
    (s) => s.categoriaId === form.categoriaId && s.activo
  );

  const handleFiles = (selected: FileList | null) => {
    if (!selected) return;
    const newFiles = Array.from(selected);
    setFiles((prev) => [...prev, ...newFiles]);
    const newPreviews = newFiles.map((f) => URL.createObjectURL(f));
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    setPreviews((prev) => prev.filter((_, i) => i !== index));
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const moveImage = (from: number, to: number) => {
    const arr = [...previews];
    const [removed] = arr.splice(from, 1);
    arr.splice(to, 0, removed);
    setPreviews(arr);
    const filesArr = [...files];
    const [removedFile] = filesArr.splice(from, 1);
    filesArr.splice(to, 0, removedFile);
    setFiles(filesArr);
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (!t) return;
    setForm((prev) => ({ ...prev, etiquetas: [...(prev.etiquetas || []), t] }));
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    setForm((prev) => ({ ...prev, etiquetas: (prev.etiquetas || []).filter((x) => x !== tag) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre || !form.categoriaId || !form.marcaId || form.precio === undefined) {
      toast.error("Completa los campos requeridos");
      return;
    }

    setLoading(true);
    try {
      let imageUrls = previews.filter((p) => p.startsWith("http"));

      const tempId = product?.id || generateId();
      if (files.length > 0) {
        const uploaded = await uploadProductImages(tempId, files);
        imageUrls = [...imageUrls, ...uploaded];
      }

      const payload = {
        ...form,
        imagenes: imageUrls,
        precio: Number(form.precio),
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
        <h2 className="text-lg font-semibold">{product ? "Editar producto" : "Nuevo producto"}</h2>
        <button onClick={onClose} className="rounded-full p-2 transition-colors hover:bg-muted">
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
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
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Código interno"
                  value={form.codigoInterno || ""}
                  onChange={(e) => setForm({ ...form, codigoInterno: e.target.value })}
                />
                <Input
                  label="SKU"
                  value={form.sku || ""}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Descripción</label>
                <textarea
                  value={form.descripcion || ""}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
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
                <label className="mb-1.5 block text-sm font-medium text-foreground">Marca *</label>
                <select
                  value={form.marcaId}
                  onChange={(e) => setForm({ ...form, marcaId: e.target.value })}
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
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Categoría *</label>
                <select
                  value={form.categoriaId}
                  onChange={(e) => {
                    setForm({ ...form, categoriaId: e.target.value, subcategoriaId: "" });
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
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Subcategoría</label>
                <select
                  value={form.subcategoriaId || ""}
                  onChange={(e) => setForm({ ...form, subcategoriaId: e.target.value })}
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
                <label className="mb-1.5 block text-sm font-medium text-foreground">Género</label>
                <select
                  value={form.genero}
                  onChange={(e) => setForm({ ...form, genero: e.target.value as any })}
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
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Precio e inventario</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <Input
                label="Precio *"
                type="number"
                min={0}
                step="0.01"
                value={form.precio}
                onChange={(e) => setForm({ ...form, precio: parseFloat(e.target.value) || 0 })}
                required
              />
              <Input
                label="Precio oferta"
                type="number"
                min={0}
                step="0.01"
                value={form.precioOferta || ""}
                onChange={(e) => setForm({ ...form, precioOferta: parseFloat(e.target.value) || undefined })}
              />
              <Input
                label="Stock"
                type="number"
                min={0}
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) || 0 })}
              />
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Imágenes</h3>
            <div
              onClick={() => fileRef.current?.click()}
              className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/30 p-8 transition-colors hover:bg-muted/50"
            >
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-sm font-medium text-foreground">Haz clic o arrastra imágenes aquí</p>
              <p className="text-xs text-muted-foreground">La primera imagen será la portada</p>
              <input
                ref={fileRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
            </div>

            {previews.length > 0 && (
              <div className="mt-4 space-y-2">
                {previews.map((preview, idx) => (
                  <div key={idx} className="flex items-center gap-3 rounded-xl border border-border p-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <img src={preview} alt="" className="h-14 w-14 rounded-lg object-cover" />
                    <span className="text-sm text-muted-foreground">Imagen {idx + 1}</span>
                    <div className="ml-auto flex gap-1">
                      {idx > 0 && (
                        <button
                          type="button"
                          onClick={() => moveImage(idx, idx - 1)}
                          className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
                        >
                          ↑
                        </button>
                      )}
                      {idx < previews.length - 1 && (
                        <button
                          type="button"
                          onClick={() => moveImage(idx, idx + 1)}
                          className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
                        >
                          ↓
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="rounded-lg p-2 text-danger hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Estado y etiquetas</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Estado</label>
                <select
                  value={form.estado}
                  onChange={(e) => setForm({ ...form, estado: e.target.value as any })}
                  className="w-full rounded-xl border border-border bg-white px-4 py-3 text-base outline-none focus:border-primary"
                >
                  <option value="publicado">Publicado</option>
                  <option value="borrador">Borrador</option>
                  <option value="oculto">Oculto</option>
                  <option value="agotado">Agotado</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Etiquetas</label>
                <div className="flex gap-2">
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
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
                    <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} className="hover:text-danger">
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
        <Button type="submit" size="lg" className="w-full" onClick={handleSubmit} loading={loading}>
          {product ? "Guardar cambios" : "Crear producto"}
        </Button>
      </div>
    </div>
  );
}
