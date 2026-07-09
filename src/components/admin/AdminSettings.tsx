"use client";

import { useState } from "react";
import { Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useSettings } from "@/context/SettingsContext";
import { updateSettings } from "@/lib/users";
import toast from "react-hot-toast";

export default function AdminSettings() {
  const { settings } = useSettings();
  const [form, setForm] = useState({ ...settings });
  const [saving, setSaving] = useState(false);

  const handleChange = (path: string, value: string | boolean | number) => {
    const keys = path.split(".");
    setForm((prev: any) => {
      const next = { ...prev };
      let current = next;
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await updateSettings(form);
      toast.success("Configuración guardada");
    } catch (err: any) {
      toast.error(err.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-white p-6">
        <h3 className="mb-4 text-lg font-bold">Empresa</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Nombre"
            value={form.empresa.nombre}
            onChange={(e) => handleChange("empresa.nombre", e.target.value)}
          />
          <Input
            label="Teléfono"
            value={form.empresa.telefono || ""}
            onChange={(e) => handleChange("empresa.telefono", e.target.value)}
          />
          <Input
            label="Correo"
            value={form.empresa.correo || ""}
            onChange={(e) => handleChange("empresa.correo", e.target.value)}
          />
          <Input
            label="Sitio web"
            value={form.empresa.sitioWeb || ""}
            onChange={(e) => handleChange("empresa.sitioWeb", e.target.value)}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-white p-6">
        <h3 className="mb-4 text-lg font-bold">Pantalla de inicio</h3>
        <div className="space-y-4">
          <Input
            label="Título principal"
            value={form.inicio.tituloPrincipal}
            onChange={(e) => handleChange("inicio.tituloPrincipal", e.target.value)}
          />
          <Input
            label="Subtítulo"
            value={form.inicio.subtitulo || ""}
            onChange={(e) => handleChange("inicio.subtitulo", e.target.value)}
          />
          <Input
            label="Texto del botón"
            value={form.inicio.textoBoton}
            onChange={(e) => handleChange("inicio.textoBoton", e.target.value)}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-white p-6">
        <h3 className="mb-4 text-lg font-bold">Cotizaciones</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Prefijo del código"
            value={form.cotizaciones.prefijo}
            onChange={(e) => handleChange("cotizaciones.prefijo", e.target.value)}
          />
          <Input
            label="Mensaje automático"
            value={form.cotizaciones.mensajeAutomatico}
            onChange={(e) => handleChange("cotizaciones.mensajeAutomatico", e.target.value)}
          />
        </div>
      </section>

      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Guardar configuración
        </Button>
      </div>
    </div>
  );
}
