"use client";

import { useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useCatalogData } from "@/hooks/useCatalogData";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/lib/categories";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import type { Category } from "@/types";

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

export default function AdminCategories() {
  const { categories, loading } = useCatalogData();
  const [editing, setEditing] = useState<Category | null>(null);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const handleSave = async () => {
    const target = editing;
    const name = target ? target.nombre : newName;
    const color = target ? target.color : newColor;
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (target) {
        await updateCategory(target.id, { nombre: name.trim(), color });
        toast.success("Categoría actualizada");
      } else {
        await createCategory({
          nombre: name.trim(),
          color,
          orden: categories.length + 1,
          activo: true,
        });
        toast.success("Categoría creada");
        setNewName("");
      }
      setEditing(null);
    } catch (err: any) {
      toast.error(err.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCategory(deleteTarget.id);
      toast.success("Categoría eliminada");
    } catch (err: any) {
      toast.error(err.message || "Error al eliminar");
    } finally {
      setDeleteTarget(null);
    }
  };

  const move = async (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= categories.length) return;
    const current = categories[index];
    const other = categories[newIndex];
    try {
      await Promise.all([
        updateCategory(current.id, { orden: other.orden }),
        updateCategory(other.id, { orden: current.orden }),
      ]);
    } catch (err: any) {
      toast.error(err.message || "Error al reordenar");
    }
  };

  if (loading)
    return <div className="text-center text-muted-foreground">Cargando...</div>;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-base font-semibold">Nueva categoría</h3>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Input
              label="Nombre"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nombre de la categoría"
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
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
                  onClick={() => setNewColor(c)}
                  className={cn(
                    "h-8 w-8 rounded-full border-2 transition-all",
                    newColor === c
                      ? "border-foreground scale-110"
                      : "border-transparent",
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving || !newName.trim()}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Agregar
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Orden</th>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Color</th>
              <th className="px-4 py-3 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {categories.map((cat, idx) => (
              <tr key={cat.id}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => move(idx, -1)}
                      disabled={idx === 0}
                      className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => move(idx, 1)}
                      disabled={idx === categories.length - 1}
                      className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {editing?.id === cat.id ? (
                    <Input
                      value={editing.nombre}
                      onChange={(e) =>
                        setEditing({ ...editing, nombre: e.target.value })
                      }
                      onKeyDown={(e) => e.key === "Enter" && handleSave()}
                    />
                  ) : (
                    <span className="font-medium">{cat.nombre}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {editing?.id === cat.id ? (
                    <div className="flex flex-wrap gap-2">
                      {PRESET_COLORS.map((c) => (
                        <button
                          key={c}
                          onClick={() => setEditing({ ...editing, color: c })}
                          className={cn(
                            "h-6 w-6 rounded-full border-2 transition-all",
                            editing.color === c
                              ? "border-foreground scale-110"
                              : "border-transparent",
                          )}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  ) : (
                    <div
                      className="h-6 w-6 rounded-full"
                      style={{ backgroundColor: cat.color || PRESET_COLORS[0] }}
                    />
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {editing?.id === cat.id ? (
                    <Button size="sm" onClick={handleSave} disabled={saving}>
                      Guardar
                    </Button>
                  ) : (
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditing(cat)}
                        className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(cat)}
                        className="rounded-lg p-2 text-danger hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ConfirmModal
        open={!!deleteTarget}
        title="Eliminar categoría"
        message={`¿Deseas eliminar la categoría "${deleteTarget?.nombre}"?`}
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
