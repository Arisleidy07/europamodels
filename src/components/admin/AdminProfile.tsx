"use client";

import { useState } from "react";
import { Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/context/AuthContext";
import { updateUser } from "@/lib/users";
import toast from "react-hot-toast";

export default function AdminProfile() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    nombre: user?.nombre || "",
    apellido: user?.apellido || "",
    correo: user?.correo || "",
    cargo: user?.cargo || "",
  });
  const [saving, setSaving] = useState(false);

  if (!user) return <div className="text-center text-muted-foreground">No has iniciado sesión</div>;

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateUser(user.id, {
        nombre: form.nombre,
        apellido: form.apellido,
        cargo: form.cargo,
      });
      toast.success("Perfil actualizado");
    } catch (err: any) {
      toast.error(err.message || "Error al actualizar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl space-y-6">
      <section className="rounded-2xl border border-border bg-white p-6">
        <h3 className="mb-4 text-lg font-bold">Mi perfil</h3>
        <div className="space-y-4">
          <Input
            label="Nombre"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          />
          <Input
            label="Apellido"
            value={form.apellido}
            onChange={(e) => setForm({ ...form, apellido: e.target.value })}
          />
          <Input label="Correo" value={form.correo} disabled />
          <Input
            label="Cargo"
            value={form.cargo}
            onChange={(e) => setForm({ ...form, cargo: e.target.value })}
          />
          <div className="text-sm text-muted-foreground">
            Rol actual: <span className="font-medium capitalize">{user.rol}</span>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Guardar cambios
          </Button>
        </div>
      </section>
    </div>
  );
}
