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
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
} from "@/lib/categories";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import type { Subcategory, Category } from "@/types";

export default function AdminSubcategories() {
  const { categories, subcategories, loading, removeSubcategory } =
    useCatalogData();
  const [editing, setEditing] = useState<Subcategory | null>(null);
  const [newName, setNewName] = useState("");
  const [newCategoryId, setNewCategoryId] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Subcategory | null>(null);

  const handleSave = async () => {
    const name = editing ? editing.nombre : newName;
    const categoryId = editing ? editing.categoriaId : newCategoryId;
    if (!name.trim() || !categoryId) return;
    setSaving(true);
    try {
      if (editing) {
        await updateSubcategory(editing.id, {
          nombre: name.trim(),
          categoriaId: categoryId,
        });
        toast.success("Subcategoría actualizada");
      } else {
        await createSubcategory({
          nombre: name.trim(),
          categoriaId: categoryId,
          orden: subcategories.length + 1,
          activo: true,
        });
        toast.success("Subcategoría creada");
        setNewName("");
        setNewCategoryId("");
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
      await deleteSubcategory(deleteTarget.id);
      removeSubcategory(deleteTarget.id);
      toast.success("Subcategoría eliminada");
    } catch (err: any) {
      toast.error(err.message || "Error al eliminar");
    } finally {
      setDeleteTarget(null);
    }
  };

  const move = async (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= subcategories.length) return;
    const current = subcategories[index];
    const other = subcategories[newIndex];
    try {
      await Promise.all([
        updateSubcategory(current.id, { orden: other.orden }),
        updateSubcategory(other.id, { orden: current.orden }),
      ]);
    } catch (err: any) {
      toast.error(err.message || "Error al reordenar");
    }
  };

  const sortedCategories = [...categories].sort((a, b) =>
    a.nombre.localeCompare(b.nombre),
  );

  if (loading)
    return <div className="text-center text-muted-foreground">Cargando...</div>;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-base font-semibold">Nueva subcategoría</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Categoría *
            </label>
            <select
              value={newCategoryId}
              onChange={(e) => setNewCategoryId(e.target.value)}
              className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-primary"
            >
              <option value="">Seleccionar categoría</option>
              {sortedCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Nombre *"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nombre de la subcategoría"
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
          />
        </div>
        <div className="mt-4 flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving || !newName.trim() || !newCategoryId}
          >
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
              <th className="px-4 py-3 font-medium">Categoría</th>
              <th className="px-4 py-3 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {subcategories.map((sub, idx) => {
              const category = categories.find((c) => c.id === sub.categoriaId);
              return (
                <tr key={sub.id}>
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
                        disabled={idx === subcategories.length - 1}
                        className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {editing?.id === sub.id ? (
                      <Input
                        value={editing.nombre}
                        onChange={(e) =>
                          setEditing({ ...editing, nombre: e.target.value })
                        }
                        onKeyDown={(e) => e.key === "Enter" && handleSave()}
                      />
                    ) : (
                      <span className="font-medium">{sub.nombre}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {editing?.id === sub.id ? (
                      <select
                        value={editing.categoriaId}
                        onChange={(e) =>
                          setEditing({
                            ...editing,
                            categoriaId: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-border bg-white px-2 py-1 text-sm outline-none focus:border-primary"
                      >
                        {sortedCategories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nombre}
                          </option>
                        ))}
                      </select>
                    ) : (
                      category?.nombre || "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {editing?.id === sub.id ? (
                      <Button size="sm" onClick={handleSave} disabled={saving}>
                        Guardar
                      </Button>
                    ) : (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditing(sub)}
                          className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(sub)}
                          className="rounded-lg p-2 text-danger hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <ConfirmModal
        open={!!deleteTarget}
        title="Eliminar subcategoría"
        message={`¿Deseas eliminar la subcategoría "${deleteTarget?.nombre}"?`}
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
