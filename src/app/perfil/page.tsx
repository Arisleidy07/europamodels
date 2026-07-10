"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Save,
  LogOut,
  Mail,
  Shield,
  Briefcase,
  Loader2,
  Camera,
} from "lucide-react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/context/AuthContext";
import { updateUser } from "@/lib/users";
import { getFirebaseStorage } from "@/lib/firebase";
import { getInitials } from "@/lib/utils";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [form, setForm] = useState({
    nombre: user?.nombre || "",
    apellido: user?.apellido || "",
    correo: user?.correo || "",
    cargo: user?.cargo || "",
  });
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(user?.foto || "");
  const photoRef = useRef<HTMLInputElement>(null);

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center">
        <h1 className="text-2xl font-bold text-foreground">
          Acceso restringido
        </h1>
        <p className="mt-2 text-muted-foreground">
          Debes iniciar sesión para ver tu perfil.
        </p>
        <Button onClick={() => router.push("/login")} className="mt-6">
          Iniciar sesión
        </Button>
      </div>
    );
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const storage = getFirebaseStorage();
    if (!storage) {
      toast.error("Firebase Storage no está configurado");
      return;
    }
    setUploadingPhoto(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const storageRef = ref(storage, `profiles/${user.id}/photo.${ext}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await updateUser(user.id, { foto: url });
      setPhotoPreview(url);
      toast.success("Foto actualizada");
    } catch (err: any) {
      toast.error(err.message || "Error al subir foto");
    } finally {
      setUploadingPhoto(false);
      if (photoRef.current) photoRef.current.value = "";
    }
  };

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

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1 px-4 py-8 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden rounded-3xl border border-border bg-white shadow-sm"
          >
            <div className="relative h-32 bg-gradient-to-r from-primary to-primary/80">
              <div className="absolute -bottom-12 left-8">
                <div className="group relative flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-white bg-muted text-3xl font-bold text-foreground shadow-sm">
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt=""
                      className="h-full w-full rounded-xl object-cover"
                    />
                  ) : (
                    getInitials(user.nombre)
                  )}
                  <button
                    onClick={() => photoRef.current?.click()}
                    disabled={uploadingPhoto}
                    className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    {uploadingPhoto ? (
                      <Loader2 className="h-6 w-6 animate-spin text-white" />
                    ) : (
                      <Camera className="h-6 w-6 text-white" />
                    )}
                  </button>
                  <input
                    ref={photoRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                </div>
              </div>
            </div>

            <div className="px-8 pb-8 pt-16">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    {user.nombre}
                  </h1>
                  <p className="text-muted-foreground">
                    {user.cargo || user.rol}
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="shrink-0"
                >
                  <LogOut className="mr-2 h-4 w-4" /> Cerrar sesión
                </Button>
              </div>

              <div className="mt-8 grid gap-6 sm:grid-cols-2">
                <Input
                  label="Nombre"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                />
                <Input
                  label="Apellido"
                  value={form.apellido}
                  onChange={(e) =>
                    setForm({ ...form, apellido: e.target.value })
                  }
                />
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">
                    Correo
                  </label>
                  <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm text-foreground">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {form.correo}
                  </div>
                </div>
                <Input
                  label="Cargo"
                  value={form.cargo}
                  onChange={(e) => setForm({ ...form, cargo: e.target.value })}
                />
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">
                    Rol
                  </label>
                  <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm capitalize text-foreground">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    {user.rol}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">
                    Estado
                  </label>
                  <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm text-foreground">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    {user.activo ? "Activo" : "Inactivo"}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Guardar cambios
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
