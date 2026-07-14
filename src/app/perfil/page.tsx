"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Save,
  LogOut,
  Mail,
  Shield,
  Loader2,
  Camera,
  Lock,
  Eye,
  EyeOff,
  Calendar,
  User,
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
  const { user, logout, changePassword } = useAuth();
  const [form, setForm] = useState({
    nombre: user?.nombre || "",
    apellido: user?.apellido || "",
  });
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(user?.foto || "");
  const photoRef = useRef<HTMLInputElement>(null);

  // Password change
  const [showPassSection, setShowPassSection] = useState(false);
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [changingPass, setChangingPass] = useState(false);

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
      });
      toast.success("Perfil actualizado");
    } catch (err: any) {
      toast.error(err.message || "Error al actualizar");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPass.length < 6) {
      toast.error("Mínimo 6 caracteres");
      return;
    }
    if (newPass !== confirmPass) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    setChangingPass(true);
    try {
      await changePassword(newPass);
      toast.success("Contraseña actualizada");
      setNewPass("");
      setConfirmPass("");
      setShowPassSection(false);
    } catch (err: any) {
      toast.error(err.message || "Error al cambiar contraseña");
    } finally {
      setChangingPass(false);
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
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden rounded-3xl border border-border bg-white shadow-sm"
          >
            <div className="relative h-36 bg-gradient-to-br from-primary via-primary/90 to-primary/70">
              <div className="absolute -bottom-14 left-8">
                <div className="group relative flex h-28 w-28 items-center justify-center rounded-2xl border-4 border-white bg-muted text-3xl font-bold text-foreground shadow-lg">
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

            <div className="px-8 pb-8 pt-18">
              <div className="mt-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    {user.nombre}
                  </h1>
                  <p className="text-muted-foreground">{user.correo}</p>
                </div>
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="shrink-0"
                >
                  <LogOut className="mr-2 h-4 w-4" /> Cerrar sesión
                </Button>
              </div>

              {/* Info pills */}
              <div className="mt-6 flex flex-wrap gap-3">
                <div className="flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                  <Shield className="h-4 w-4" />
                  <span className="capitalize">{user.rol}</span>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  {user.activo ? "Activo" : "Inactivo"}
                </div>
                {user.fechaCreacion && (
                  <div className="flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Desde{" "}
                    {new Date(user.fechaCreacion).toLocaleDateString("es-DO", {
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Edit Section */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-3xl border border-border bg-white p-6 shadow-sm sm:p-8"
          >
            <h2 className="text-lg font-bold text-foreground">
              Información personal
            </h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <Input
                label="Nombre"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              />
              <Input
                label="Apellido"
                value={form.apellido || ""}
                onChange={(e) => setForm({ ...form, apellido: e.target.value })}
              />
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">
                  Usuario
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm text-foreground">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {user.correo}
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Guardar cambios
              </Button>
            </div>
          </motion.div>

          {/* Password Section */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-3xl border border-border bg-white p-6 shadow-sm sm:p-8"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">Contraseña</h2>
              {!showPassSection && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPassSection(true)}
                >
                  <Lock className="mr-2 h-4 w-4" /> Cambiar
                </Button>
              )}
            </div>
            {showPassSection && (
              <div className="mt-5 space-y-4">
                <div className="relative">
                  <Input
                    label="Nueva contraseña"
                    type={showPass ? "text" : "password"}
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-[2.1rem] text-muted-foreground"
                  >
                    {showPass ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <Input
                  label="Confirmar contraseña"
                  type={showPass ? "text" : "password"}
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  placeholder="Repite tu contraseña"
                />
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowPassSection(false);
                      setNewPass("");
                      setConfirmPass("");
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleChangePassword}
                    disabled={changingPass || !newPass || !confirmPass}
                  >
                    {changingPass && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Actualizar contraseña
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
