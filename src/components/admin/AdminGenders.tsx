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
import { createGender, updateGender, deleteGender } from "@/lib/genders";
import toast from "react-hot-toast";
import type { Gender } from "@/types";

export default function AdminGenders() {
  const { genders, loading, removeGender } = useCatalogData();
  const [editing, setEditing] = useState<Gender | null>(null);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Gender | null>(null);

  const handleSave = async () => {
    const name = editing ? editing.nombre : newName;
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await updateGender(editing.id, { nombre: name.trim() });
        toast.success("Género actualizado");
      } else {
        await createGender({
          nombre: name.trim(),
          orden: genders.length + 1,
          activo: true,
        });
        toast.success("Género creado");
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
      await deleteGender(deleteTarget.id);
      removeGender(deleteTarget.id);
      toast.success("Género eliminado");
    } catch (err: any) {
      toast.error(err.message || "Error al eliminar");
    } finally {
      setDeleteTarget(null);
    }
  };

  const move = async (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= genders.length) return;
    const current = genders[index];
    const other = genders[newIndex];
    try {
      await Promise.all([
        updateGender(current.id, { orden: other.orden }),
        updateGender(other.id, { orden: current.orden }),
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
        <h3 className="mb-4 text-base font-semibold">Nuevo género</h3>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Input
              label="Nombre"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ej: Hombre, Mujer, Unisex, Niños..."
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
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Orden</th>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {genders.map((gender, idx) => (
              <tr key={gender.id}>
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
                      disabled={idx === genders.length - 1}
                      className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {editing?.id === gender.id ? (
                    <Input
                      value={editing.nombre}
                      onChange={(e) =>
                        setEditing({ ...editing, nombre: e.target.value })
                      }
                      onKeyDown={(e) => e.key === "Enter" && handleSave()}
                    />
                  ) : (
                    <span className="font-medium">{gender.nombre}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {editing?.id === gender.id ? (
                    <Button size="sm" onClick={handleSave} disabled={saving}>
                      Guardar
                    </Button>
                  ) : (
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditing(gender)}
                        className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(gender)}
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
        title="Eliminar género"
        message={`¿Deseas eliminar el género "${deleteTarget?.nombre}"?`}
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
