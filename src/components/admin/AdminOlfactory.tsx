"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Upload,
  Loader2,
  Droplets,
  Wind,
  Heart,
  Layers,
  ImageIcon,
  EyeOff,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useCatalogData } from "@/hooks/useCatalogData";
import {
  getOlfactoryNotes,
  createOlfactoryNote,
  updateOlfactoryNote,
  deleteOlfactoryNote,
  uploadOlfactoryImage,
  deleteOlfactoryImage,
  INITIAL_OLFACTORY_DATA,
  normalizeSearch,
} from "@/lib/olfactory";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import type { OlfactoryNote, OlfactoryCategory } from "@/types";

const CATEGORY_TABS: {
  id: OlfactoryCategory;
  label: string;
  icon: React.ElementType;
}[] = [
  { id: "acordes", label: "Acordes", icon: Layers },
  { id: "notasSalida", label: "Salida", icon: Wind },
  { id: "notasCorazon", label: "Corazón", icon: Heart },
  { id: "notasFondo", label: "Fondo", icon: Droplets },
];

function NoteImage({
  src,
  alt,
  size = "md",
}: {
  src: string;
  alt: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = { sm: "h-10 w-10", md: "h-14 w-14", lg: "h-20 w-20" };
  if (src && src.startsWith("http")) {
    return (
      <div
        className={cn(
          "shrink-0 overflow-hidden rounded-xl bg-gray-50",
          sizes[size],
        )}
      >
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      </div>
    );
  }
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl border border-dashed border-border bg-gray-50/80",
        sizes[size],
      )}
    >
      <ImageIcon className="h-5 w-5 text-muted-foreground/40" />
    </div>
  );
}

export default function AdminOlfactory() {
  const { olfactoryNotes, removeOlfactoryNote } = useCatalogData();
  const [notes, setNotes] = useState<OlfactoryNote[]>(olfactoryNotes);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] =
    useState<OlfactoryCategory>("acordes");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingNote, setEditingNote] = useState<OlfactoryNote | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<OlfactoryNote | null>(null);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    setNotes(olfactoryNotes);
    if (olfactoryNotes.length > 0) setLoading(false);
  }, [olfactoryNotes]);

  const loadNotes = async () => {
    try {
      const data = await getOlfactoryNotes();
      setNotes(data);
      return data;
    } catch {
      toast.error("Error al cargar biblioteca");
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      const data = await loadNotes();
      if (data.length === 0) {
        // Auto-seed when collection is empty
        setSeeding(true);
        try {
          let count = 0;
          for (const item of INITIAL_OLFACTORY_DATA) {
            await createOlfactoryNote(item);
            count++;
          }
          await loadNotes();
          toast.success(`Biblioteca inicializada: ${count} elementos`);
        } catch {
          // Silently fail — user can retry manually
        } finally {
          setSeeding(false);
        }
      }
    };
    init();
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.imagen) await deleteOlfactoryImage(deleteTarget.imagen);
      await deleteOlfactoryNote(deleteTarget.id);
      removeOlfactoryNote(deleteTarget.id);
      setNotes((prev) => prev.filter((n) => n.id !== deleteTarget.id));
      toast.success("Eliminado");
    } catch (err: any) {
      toast.error(err.message || "Error al eliminar");
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleToggleActive = async (note: OlfactoryNote) => {
    try {
      await updateOlfactoryNote(note.id, { activo: !note.activo });
      setNotes((prev) =>
        prev.map((n) => (n.id === note.id ? { ...n, activo: !n.activo } : n)),
      );
    } catch {
      toast.error("Error al actualizar");
    }
  };

  const filteredNotes = notes
    .filter(
      (n) =>
        n.categoria === activeCategory &&
        (!search ||
          normalizeSearch(n.nombre).includes(normalizeSearch(search))),
    )
    .slice()
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

  const isEmpty = notes.length === 0 && !loading;
  const totalInCategory = notes.filter(
    (n) => n.categoria === activeCategory,
  ).length;
  const withImage = filteredNotes.filter(
    (n) => n.imagen && n.imagen.startsWith("http"),
  ).length;
  const isAcordes = activeCategory === "acordes";

  return (
    <div className="space-y-6">
      {/* Category tabs */}
      <div className="flex flex-wrap gap-2">
        {CATEGORY_TABS.map((tab) => {
          const Icon = tab.icon;
          const count = notes.filter((n) => n.categoria === tab.id).length;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id)}
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all",
                activeCategory === tab.id
                  ? "bg-primary text-white shadow-md"
                  : "bg-muted/60 text-foreground hover:bg-muted",
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-bold",
                  activeCategory === tab.id
                    ? "bg-white/20 text-white"
                    : "bg-border text-muted-foreground",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Buscar en ${CATEGORY_TABS.find((t) => t.id === activeCategory)?.label.toLowerCase() ?? "biblioteca"}...`}
              className="w-full rounded-xl border border-border bg-white py-3 pl-11 pr-10 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {!isAcordes && (
            <span className="hidden text-xs text-muted-foreground sm:block">
              {withImage}/{totalInCategory} con imagen
            </span>
          )}
          {isAcordes && (
            <span className="hidden text-xs text-muted-foreground sm:block">
              {totalInCategory} acordes · sin imágenes
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              setEditingNote(null);
              setShowForm(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Agregar
          </Button>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-2xl bg-gray-100"
            />
          ))}
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <Layers className="h-12 w-12 text-muted-foreground/20" />
          <p className="mt-3 text-sm font-medium text-muted-foreground">
            {search
              ? "Sin resultados para esta búsqueda"
              : "No hay elementos en esta categoría"}
          </p>
          {!search && isEmpty && seeding && (
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Inicializando biblioteca automáticamente...
            </div>
          )}
        </div>
      ) : isAcordes ? (
        /* Acordes: compact list, no images */
        <div className="divide-y divide-border rounded-2xl border border-border bg-white overflow-hidden">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className={cn(
                "flex items-center justify-between px-4 py-3 transition-all hover:bg-gray-50",
                !note.activo && "opacity-50",
              )}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                  <Layers className="h-3.5 w-3.5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {note.nombre}
                  </p>
                  {!note.activo && (
                    <span className="text-[10px] font-medium text-amber-600">
                      Inactivo
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    setEditingNote(note);
                    setShowForm(true);
                  }}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                  title="Editar"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleToggleActive(note)}
                  className={cn(
                    "rounded-lg p-1.5",
                    note.activo
                      ? "text-amber-500 hover:bg-amber-50"
                      : "text-green-600 hover:bg-green-50",
                  )}
                  title={note.activo ? "Desactivar" : "Activar"}
                >
                  {note.activo ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={() => setDeleteTarget(note)}
                  className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                  title="Eliminar"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className={cn(
                "group relative flex flex-col items-center rounded-2xl border p-3 transition-all",
                note.activo
                  ? "border-border bg-white hover:shadow-md hover:border-primary/30"
                  : "border-border/50 bg-gray-50 opacity-50",
              )}
            >
              <NoteImage src={note.imagen || ""} alt={note.nombre} />
              <p className="mt-2 text-center text-[11px] font-medium text-foreground leading-tight line-clamp-2">
                {note.nombre}
              </p>
              {!note.activo && (
                <span className="mt-0.5 text-[9px] font-medium text-amber-600">
                  Inactivo
                </span>
              )}

              {/* Actions overlay */}
              <div className="absolute inset-0 flex items-center justify-center gap-1.5 rounded-2xl bg-white/95 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                <button
                  onClick={() => {
                    setEditingNote(note);
                    setShowForm(true);
                  }}
                  className="rounded-lg bg-primary/10 p-2 text-primary hover:bg-primary/20"
                  title="Editar"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleToggleActive(note)}
                  className={cn(
                    "rounded-lg p-2",
                    note.activo
                      ? "bg-amber-50 text-amber-600 hover:bg-amber-100"
                      : "bg-green-50 text-green-600 hover:bg-green-100",
                  )}
                  title={note.activo ? "Desactivar" : "Activar"}
                >
                  {note.activo ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={() => setDeleteTarget(note)}
                  className="rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100"
                  title="Eliminar"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <NoteFormModal
            note={editingNote}
            category={activeCategory}
            onClose={() => {
              setShowForm(false);
              setEditingNote(null);
            }}
            onSaved={(saved) => {
              if (editingNote) {
                setNotes((prev) =>
                  prev.map((n) => (n.id === saved.id ? saved : n)),
                );
              } else {
                setNotes((prev) => [...prev, saved]);
              }
              setShowForm(false);
              setEditingNote(null);
            }}
          />
        )}
      </AnimatePresence>

      <ConfirmModal
        open={!!deleteTarget}
        title="Eliminar elemento"
        message={`¿Deseas eliminar "${deleteTarget?.nombre}"? Esta acción solo es posible si no está asociado a ningún producto.`}
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

/* ─── Note Form Modal ─── */
function NoteFormModal({
  note,
  category,
  onClose,
  onSaved,
}: {
  note: OlfactoryNote | null;
  category: OlfactoryCategory;
  onClose: () => void;
  onSaved: (note: OlfactoryNote) => void;
}) {
  const [nombre, setNombre] = useState(note?.nombre || "");
  const [selectedCategory, setSelectedCategory] = useState<OlfactoryCategory>(
    note?.categoria || category,
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState(note?.imagen || "");
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const isAcordCategory = selectedCategory === "acordes";

  const handleSubmit = async () => {
    if (!nombre.trim()) {
      toast.error("El nombre es requerido");
      return;
    }
    setSaving(true);
    try {
      let finalImage = note?.imagen || "";

      if (!isAcordCategory && imageFile) {
        const tempId = note?.id || Date.now().toString();
        finalImage = await uploadOlfactoryImage(imageFile, tempId);
      }

      const fields = {
        nombre: nombre.trim(),
        categoria: selectedCategory,
        ...(!isAcordCategory ? { imagen: finalImage } : {}),
      };

      if (note) {
        await updateOlfactoryNote(note.id, fields);
        onSaved({ ...note, ...fields });
      } else {
        const created = await createOlfactoryNote({ ...fields, activo: true });
        onSaved(created);
      }
      toast.success(note ? "Actualizado" : "Creado");
    } catch (err: any) {
      toast.error(err.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", damping: 25, stiffness: 400 }}
        className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      >
        <div
          className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-lg font-bold text-foreground">
              {note ? "Editar elemento" : "Nuevo elemento"}
            </h3>
            <button
              onClick={onClose}
              className="rounded-full p-1.5 hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-5">
            <Input
              label="Nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Bergamota, Sándalo, Cítrico..."
            />

            {/* Category selector */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Categoría
              </label>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORY_TABS.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setSelectedCategory(tab.id)}
                      className={cn(
                        "flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-all",
                        selectedCategory === tab.id
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border text-foreground hover:border-primary/30",
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Image upload — only for non-acordes */}
            {!isAcordCategory && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Imagen
                </label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="group cursor-pointer rounded-xl border-2 border-dashed border-border p-6 text-center transition-all hover:border-primary/50 hover:bg-primary/5"
                >
                  {imagePreview &&
                  (imagePreview.startsWith("http") ||
                    imagePreview.startsWith("blob")) ? (
                    <div className="flex flex-col items-center gap-3">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="h-24 w-24 rounded-xl object-cover shadow-sm"
                      />
                      <span className="text-xs text-muted-foreground">
                        Clic para reemplazar
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="h-8 w-8 text-muted-foreground/40 group-hover:text-primary/60" />
                      <span className="text-sm font-medium text-muted-foreground">
                        Subir imagen
                      </span>
                      <span className="text-[11px] text-muted-foreground/60">
                        PNG, JPG, SVG • Fondo transparente recomendado
                      </span>
                    </div>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={saving || !nombre.trim()}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {note ? "Guardar" : "Crear"}
            </Button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
