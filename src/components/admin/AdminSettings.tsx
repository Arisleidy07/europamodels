"use client";

import { useState } from "react";
import { Save, Loader2, Image, Palette } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useSettings } from "@/context/SettingsContext";
import { updateSettings } from "@/lib/users";
import { cn } from "@/lib/utils";
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

  const Toggle = ({
    checked,
    onChange,
    label,
  }: {
    checked: boolean;
    onChange: (v: boolean) => void;
    label: string;
  }) => (
    <label className="flex cursor-pointer items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3">
      <span className="text-sm font-medium">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 rounded-full transition-colors",
          checked ? "bg-primary" : "bg-gray-300",
        )}
      >
        <span
          className={cn(
            "absolute top-1 h-4 w-4 rounded-full bg-white transition-transform",
            checked ? "left-6" : "left-1",
          )}
        />
      </button>
    </label>
  );

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
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
            label="Dirección"
            value={form.empresa.direccion || ""}
            onChange={(e) => handleChange("empresa.direccion", e.target.value)}
          />
          <Input
            label="Instagram"
            value={form.empresa.redesSociales?.instagram || ""}
            onChange={(e) =>
              handleChange("empresa.redesSociales.instagram", e.target.value)
            }
          />
          <Input
            label="Facebook"
            value={form.empresa.redesSociales?.facebook || ""}
            onChange={(e) =>
              handleChange("empresa.redesSociales.facebook", e.target.value)
            }
          />
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Image className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-bold">Pantalla de inicio</h3>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="URL del video"
            value={form.inicio.videoInicio || ""}
            onChange={(e) => handleChange("inicio.videoInicio", e.target.value)}
          />
          <Input
            label="Imagen de respaldo"
            value={form.inicio.imagenRespaldo || ""}
            onChange={(e) =>
              handleChange("inicio.imagenRespaldo", e.target.value)
            }
          />
          <Input
            label="Título principal"
            value={form.inicio.tituloPrincipal}
            onChange={(e) =>
              handleChange("inicio.tituloPrincipal", e.target.value)
            }
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

      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-bold">Apariencia</h3>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Color principal
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-border px-3 py-2.5">
              <input
                type="color"
                value={form.apariencia.colorPrincipal}
                onChange={(e) =>
                  handleChange("apariencia.colorPrincipal", e.target.value)
                }
                className="h-8 w-8 cursor-pointer rounded border-0 bg-transparent p-0"
              />
              <span className="text-sm text-muted-foreground">
                {form.apariencia.colorPrincipal}
              </span>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Color secundario
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-border px-3 py-2.5">
              <input
                type="color"
                value={form.apariencia.colorSecundario}
                onChange={(e) =>
                  handleChange("apariencia.colorSecundario", e.target.value)
                }
                className="h-8 w-8 cursor-pointer rounded border-0 bg-transparent p-0"
              />
              <span className="text-sm text-muted-foreground">
                {form.apariencia.colorSecundario}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-bold">Catálogo</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Productos por página"
            type="number"
            value={form.catalogo.productosPorPagina}
            onChange={(e) =>
              handleChange(
                "catalogo.productosPorPagina",
                parseInt(e.target.value) || 12,
              )
            }
          />
          <Input
            label="Orden por defecto"
            value={form.catalogo.ordenDefault || "recientes"}
            onChange={(e) =>
              handleChange("catalogo.ordenDefault", e.target.value)
            }
          />
          <Toggle
            label="Mostrar precios"
            checked={form.catalogo.mostrarPrecio}
            onChange={(v) => handleChange("catalogo.mostrarPrecio", v)}
          />
          <Toggle
            label="Mostrar stock"
            checked={form.catalogo.mostrarStock}
            onChange={(v) => handleChange("catalogo.mostrarStock", v)}
          />
          <Toggle
            label="Mostrar marca"
            checked={form.catalogo.mostrarMarca}
            onChange={(v) => handleChange("catalogo.mostrarMarca", v)}
          />
          <Toggle
            label="Mostrar categoría"
            checked={form.catalogo.mostrarCategoria}
            onChange={(v) => handleChange("catalogo.mostrarCategoria", v)}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-bold">Cotizaciones</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Prefijo del código"
            value={form.cotizaciones.prefijo}
            onChange={(e) =>
              handleChange("cotizaciones.prefijo", e.target.value)
            }
          />
          <Input
            label="Longitud numérica"
            type="number"
            value={form.cotizaciones.longitudNumeros}
            onChange={(e) =>
              handleChange(
                "cotizaciones.longitudNumeros",
                parseInt(e.target.value) || 4,
              )
            }
          />
          <Input
            label="Mensaje automático"
            value={form.cotizaciones.mensajeAutomatico}
            onChange={(e) =>
              handleChange("cotizaciones.mensajeAutomatico", e.target.value)
            }
          />
          <Input
            label="Validez (días)"
            type="number"
            value={form.cotizaciones.validezDias || 7}
            onChange={(e) =>
              handleChange(
                "cotizaciones.validezDias",
                parseInt(e.target.value) || 7,
              )
            }
          />
        </div>
      </section>

      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={saving}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Guardar configuración
        </Button>
      </div>
    </div>
  );
}
