"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useCatalogData } from "@/hooks/useCatalogData";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/lib/categories";
import toast from "react-hot-toast";

export default function AdminCategories() {
  const { categories, loading } = useCatalogData();
  const [editing, setEditing] = useState<{ id: string; nombre: string } | null>(
    null,
  );
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const name = editing ? editing.nombre : newName;
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await updateCategory(editing.id, { nombre: name.trim() });
        toast.success("Categoría actualizada");
      } else {
        await createCategory({
          nombre: name.trim(),
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

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta categoría?")) return;
    try {
      await deleteCategory(id);
      toast.success("Categoría eliminada");
    } catch (err: any) {
      toast.error(err.message || "Error al eliminar");
    }
  };

  if (loading)
    return <div className="text-center text-muted-foreground">Cargando...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium">
            Nueva categoría
          </label>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nombre de la categoría"
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
          />
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

      <div className="overflow-hidden rounded-2xl border border-border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {categories.map((cat) => (
              <tr key={cat.id}>
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
                <td className="px-4 py-3 text-right">
                  {editing?.id === cat.id ? (
                    <Button size="sm" onClick={handleSave} disabled={saving}>
                      Guardar
                    </Button>
                  ) : (
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() =>
                          setEditing({ id: cat.id, nombre: cat.nombre })
                        }
                        className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id)}
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
    </div>
  );
}
