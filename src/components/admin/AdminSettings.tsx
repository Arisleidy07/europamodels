"use client";

import { useEffect, useRef, useState } from "react";
import {
  Save,
  Loader2,
  Upload,
  Trash2,
  Video,
  Monitor,
  RefreshCw,
  Palette,
} from "lucide-react";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useSettings } from "@/context/SettingsContext";
import { updateSettings } from "@/lib/users";
import { getFirebaseStorage } from "@/lib/firebase";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

export default function AdminSettings() {
  const { settings } = useSettings();
  const [form, setForm] = useState({ ...settings });
  const [saving, setSaving] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [replaceVideoIndex, setReplaceVideoIndex] = useState<number | null>(
    null,
  );
  const videoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setForm({ ...settings });
  }, [settings]);

  const handleChange = (
    path: string,
    value: string | boolean | number | string[],
  ) => {
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

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const storage = getFirebaseStorage();
    if (!storage) {
      toast.error("Firebase Storage no está configurado");
      return;
    }
    setUploadingVideo(true);
    try {
      const currentVideos = form.inicio.videos || [];
      const newVideos = [...currentVideos];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileName = `videos/${Date.now()}_${file.name}`;
        const storageRef = ref(storage, fileName);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        if (replaceVideoIndex !== null && i === 0) {
          newVideos[replaceVideoIndex] = url;
        } else {
          newVideos.push(url);
        }
      }
      handleChange("inicio.videos", newVideos);
      toast.success(
        replaceVideoIndex !== null
          ? "Video reemplazado"
          : `${files.length} video(s) subido(s)`,
      );
    } catch (err: any) {
      toast.error(err.message || "Error al subir video");
    } finally {
      setUploadingVideo(false);
      setReplaceVideoIndex(null);
      if (videoInputRef.current) videoInputRef.current.value = "";
    }
  };

  const handleRemoveVideo = async (index: number) => {
    const currentVideos = form.inicio.videos || [];
    const url = currentVideos[index];
    const storage = getFirebaseStorage();
    if (storage && url.includes("firebasestorage.googleapis.com")) {
      try {
        const storageRef = ref(storage, url);
        await deleteObject(storageRef);
      } catch {
        // File may already be deleted
      }
    }
    const updated = currentVideos.filter((_: string, i: number) => i !== index);
    handleChange("inicio.videos", updated);
    toast.success("Video eliminado");
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
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-gradient-to-br from-white to-primary/[0.04] p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
            Administración
          </p>
          <h2 className="mt-1 text-xl font-bold text-foreground">
            Configuración de la plataforma
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Personaliza la experiencia del catálogo y la pantalla de inicio.
          </p>
        </div>
        <Button onClick={handleSubmit} disabled={saving} className="shrink-0">
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Guardar cambios
        </Button>
      </div>

      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <h3 className="mb-1 text-lg font-bold">Empresa</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Información visible en el encabezado y las comunicaciones.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Nombre de la empresa"
            value={form.empresa.nombre}
            onChange={(e) => handleChange("empresa.nombre", e.target.value)}
          />
          <Input
            label="Descripción"
            value={form.empresa.descripcion || ""}
            onChange={(e) =>
              handleChange("empresa.descripcion", e.target.value)
            }
          />
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Monitor className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-bold">Pantalla de inicio</h3>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
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
          <Video className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-bold">Videos de fondo</h3>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          Sube videos que se reproducirán como carrusel en la pantalla de
          inicio.
        </p>

        {(form.inicio.videos || []).length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {(form.inicio.videos || []).map((url: string, idx: number) => (
              <article
                key={url}
                className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm"
              >
                <video
                  src={url}
                  controls
                  preload="metadata"
                  className="aspect-video w-full bg-slate-950 object-cover"
                />
                <div className="flex items-center justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      Video {idx + 1}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      Fondo de inicio
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setReplaceVideoIndex(idx);
                        videoInputRef.current?.click();
                      }}
                      className="rounded-lg p-2 text-primary transition-colors hover:bg-primary/10"
                      title="Reemplazar video"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveVideo(idx)}
                      className="rounded-lg p-2 text-danger transition-colors hover:bg-red-50"
                      title="Eliminar video"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          multiple
          onChange={handleVideoUpload}
          className="hidden"
        />
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => videoInputRef.current?.click()}
          disabled={uploadingVideo}
        >
          {uploadingVideo ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Upload className="mr-2 h-4 w-4" />
          )}
          {uploadingVideo ? "Subiendo..." : "Subir videos"}
        </Button>
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
        <div className="mb-4 flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-bold">Apariencia</h3>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3">
            <span className="text-sm font-medium">Color principal</span>
            <input
              type="color"
              value={form.apariencia.colorPrincipal}
              onChange={(e) =>
                handleChange("apariencia.colorPrincipal", e.target.value)
              }
              className="h-8 w-10 cursor-pointer rounded border-0 bg-transparent p-0"
              aria-label="Color principal"
            />
          </label>
          <label className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3">
            <span className="text-sm font-medium">Color secundario</span>
            <input
              type="color"
              value={form.apariencia.colorSecundario}
              onChange={(e) =>
                handleChange("apariencia.colorSecundario", e.target.value)
              }
              className="h-8 w-10 cursor-pointer rounded border-0 bg-transparent p-0"
              aria-label="Color secundario"
            />
          </label>
          <Toggle
            label="Modo oscuro"
            checked={form.apariencia.modoOscuro}
            onChange={(value) => handleChange("apariencia.modoOscuro", value)}
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
          <Input
            label="Mensaje automático"
            value={form.cotizaciones.mensajeAutomatico}
            onChange={(e) =>
              handleChange("cotizaciones.mensajeAutomatico", e.target.value)
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
