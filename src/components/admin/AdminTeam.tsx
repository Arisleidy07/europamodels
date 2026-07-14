"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  Loader2,
  Shield,
  UserCircle,
  X,
  Pencil,
  KeyRound,
  Copy,
  RefreshCw,
  Eye,
  EyeOff,
  Calendar,
  MoreVertical,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { getUsers, updateUser } from "@/lib/users";
import { useAuth } from "@/context/AuthContext";
import { getInitials, cn } from "@/lib/utils";
import toast from "react-hot-toast";
import type { AppUser, UserRole } from "@/types";

const ROLES: { value: UserRole; label: string }[] = [
  { value: "administrador", label: "Administrador" },
  { value: "vendedor", label: "Vendedor" },
  { value: "fotografa", label: "Fotógrafa" },
  { value: "empleado", label: "Empleado" },
];

function generatePassword(): string {
  const chars = "abcdefghijkmnpqrstuvwxyz23456789";
  let pass = "";
  for (let i = 0; i < 8; i++)
    pass += chars[Math.floor(Math.random() * chars.length)];
  return pass;
}

export default function AdminTeam() {
  const { user: currentUser, canManageUser } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [resetTarget, setResetTarget] = useState<AppUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AppUser | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Create form
  const [newName, setNewName] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("empleado");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Credentials modal
  const [createdCredentials, setCreatedCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);

  // Reset password
  const [resetPassword, setResetPassword] = useState("");

  const loadUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (err: any) {
      toast.error(err.message || "Error al cargar equipo");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreate = async () => {
    const nombre = newName.trim();
    const username = newUsername.trim().toLowerCase().replace(/\s+/g, "");
    const password = newPassword;

    if (!nombre || !username || !password) {
      toast.error("Completa todos los campos");
      return;
    }
    if (!/^[a-z0-9._-]+$/.test(username)) {
      toast.error(
        "El usuario solo puede contener letras, números, puntos, guiones y guiones bajos",
      );
      return;
    }
    if (password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, nombre, rol: newRole, password }),
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        throw new Error(`Error del servidor (${res.status})`);
      }

      if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
      setCreatedCredentials({ email: data.email, password });
      setCreateOpen(false);
      setNewName("");
      setNewUsername("");
      setNewPassword("");
      setNewRole("empleado");
      loadUsers();
      toast.success("Empleado creado exitosamente");
    } catch (err: any) {
      toast.error(err.message || "Error al crear empleado");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (u: AppUser) => {
    if (!canManageUser(u)) return;
    try {
      await updateUser(u.id, { activo: !u.activo });
      toast.success(`Usuario ${u.activo ? "desactivado" : "activado"}`);
      loadUsers();
    } catch (err: any) {
      toast.error(err.message || "Error");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      const res = await fetch("/api/users/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: deleteTarget.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Usuario eliminado");
      setDeleteTarget(null);
      loadUsers();
    } catch (err: any) {
      toast.error(err.message || "Error al eliminar");
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetTarget || !resetPassword.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/users/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: resetTarget.id,
          newPassword: resetPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCreatedCredentials({
        email: resetTarget.correo,
        password: resetPassword,
      });
      setResetTarget(null);
      setResetPassword("");
      toast.success("Contraseña restablecida");
    } catch (err: any) {
      toast.error(err.message || "Error al restablecer");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveUser = async () => {
    if (!editingUser || !currentUser) return;
    setSaving(true);
    try {
      const updates: Partial<AppUser> = {
        nombre: editingUser.nombre,
        cargo: editingUser.cargo,
      };
      if (currentUser.isSuperAdmin || currentUser.id !== editingUser.id) {
        updates.rol = editingUser.rol;
      }
      await updateUser(editingUser.id, updates);
      toast.success("Usuario actualizado");
      setEditingUser(null);
      loadUsers();
    } catch (err: any) {
      toast.error(err.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-gray-100" />
        ))}
      </div>
    );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-end">
        <Button
          onClick={() => {
            setCreateOpen(true);
            setNewPassword(generatePassword());
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> Nuevo empleado
        </Button>
      </div>

      {/* User cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {users.map((u) => {
          const canManage = canManageUser(u);
          const isSelf = u.id === currentUser?.id;
          return (
            <motion.div
              key={u.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative flex flex-col rounded-2xl border border-border bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-lg font-bold text-primary">
                    {u.foto ? (
                      <img
                        src={u.foto}
                        alt=""
                        className="h-full w-full rounded-xl object-cover"
                      />
                    ) : (
                      getInitials(u.nombre)
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {u.nombre}
                    </h3>
                    <p className="text-xs text-muted-foreground">{u.correo}</p>
                  </div>
                </div>
                {canManage && !isSelf && (
                  <div className="relative">
                    <button
                      onClick={() =>
                        setMenuOpen(menuOpen === u.id ? null : u.id)
                      }
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    {menuOpen === u.id && (
                      <div className="absolute right-0 z-10 mt-1 w-48 rounded-xl border border-border bg-white p-1 shadow-lg">
                        <button
                          onClick={() => {
                            setEditingUser(u);
                            setMenuOpen(null);
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted"
                        >
                          <Pencil className="h-4 w-4" /> Editar
                        </button>
                        <button
                          onClick={() => {
                            setResetTarget(u);
                            setResetPassword(generatePassword());
                            setMenuOpen(null);
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted"
                        >
                          <KeyRound className="h-4 w-4" /> Restablecer
                          contraseña
                        </button>
                        <button
                          onClick={() => {
                            handleToggleActive(u);
                            setMenuOpen(null);
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted"
                        >
                          <RefreshCw className="h-4 w-4" />{" "}
                          {u.activo ? "Desactivar" : "Activar"}
                        </button>
                        <button
                          onClick={() => {
                            setDeleteTarget(u);
                            setMenuOpen(null);
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-danger hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" /> Eliminar
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Rol</span>
                  <span className="rounded-full bg-muted px-2.5 py-1 font-medium capitalize">
                    {u.rol}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Estado</span>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-medium",
                      u.activo
                        ? "bg-green-50 text-success"
                        : "bg-gray-100 text-muted-foreground",
                    )}
                  >
                    {u.activo ? "Activo" : "Inactivo"}
                  </span>
                </div>
                {u.fechaCreacion && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Creado</span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {new Date(u.fechaCreacion).toLocaleDateString("es-DO")}
                    </span>
                  </div>
                )}
              </div>
              {u.isSuperAdmin && (
                <div className="mt-3 flex items-center gap-1 text-xs text-amber-600">
                  <Shield className="h-3.5 w-3.5" /> Super Admin
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* CREATE MODAL */}
      <AnimatePresence>
        {createOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCreateOpen(false)}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div
                className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mb-5 flex items-center justify-between">
                  <h3 className="text-lg font-bold">Nuevo empleado</h3>
                  <button
                    onClick={() => setCreateOpen(false)}
                    className="rounded-full p-2 hover:bg-muted"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="space-y-4">
                  <Input
                    label="Nombre completo"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Ej: Juan Pérez"
                  />
                  <div>
                    <Input
                      label="Usuario"
                      value={newUsername}
                      onChange={(e) =>
                        setNewUsername(
                          e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9._-]/g, ""),
                        )
                      }
                      placeholder="juan"
                    />
                    {newUsername && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Se creará:{" "}
                        <span className="font-medium text-foreground">
                          {newUsername}@europamodels.com
                        </span>
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">
                      Rol
                    </label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as UserRole)}
                      className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm"
                    >
                      {ROLES.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">
                      Contraseña temporal
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full rounded-xl border border-border bg-white px-4 py-3 pr-10 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => setNewPassword(generatePassword())}
                        className="shrink-0"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setCreateOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleCreate}
                    disabled={
                      saving ||
                      !newName.trim() ||
                      !newUsername.trim() ||
                      !newPassword.trim()
                    }
                  >
                    {saving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <UserCircle className="mr-2 h-4 w-4" />
                    )}
                    Crear empleado
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* CREDENTIALS MODAL */}
      <AnimatePresence>
        {createdCredentials && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50">
                  <KeyRound className="h-7 w-7 text-success" />
                </div>
                <h3 className="text-lg font-bold">Credenciales creadas</h3>
                <div className="mt-4 space-y-3 rounded-xl bg-muted p-4 text-left text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Usuario</p>
                    <p className="font-medium">{createdCredentials.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Contraseña temporal
                    </p>
                    <p className="font-mono font-medium">
                      {createdCredentials.password}
                    </p>
                  </div>
                </div>
                <div className="mt-5 flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `Usuario: ${createdCredentials.email}\nContraseña: ${createdCredentials.password}`,
                      );
                      toast.success("Credenciales copiadas");
                    }}
                  >
                    <Copy className="mr-2 h-4 w-4" /> Copiar
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => setCreatedCredentials(null)}
                  >
                    Cerrar
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* EDIT MODAL */}
      <AnimatePresence>
        {editingUser && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingUser(null)}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div
                className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mb-5 flex items-center justify-between">
                  <h3 className="text-lg font-bold">Editar empleado</h3>
                  <button
                    onClick={() => setEditingUser(null)}
                    className="rounded-full p-2 hover:bg-muted"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="space-y-4">
                  <Input
                    label="Nombre"
                    value={editingUser.nombre}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, nombre: e.target.value })
                    }
                  />
                  <Input
                    label="Cargo"
                    value={editingUser.cargo || ""}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, cargo: e.target.value })
                    }
                  />
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">
                      Rol
                    </label>
                    <select
                      value={editingUser.rol}
                      disabled={
                        !currentUser?.isSuperAdmin &&
                        editingUser.id === currentUser?.id
                      }
                      onChange={(e) =>
                        setEditingUser({
                          ...editingUser,
                          rol: e.target.value as UserRole,
                        })
                      }
                      className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm disabled:opacity-60"
                    >
                      {ROLES.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">
                      Estado
                    </label>
                    <select
                      value={editingUser.activo ? "activo" : "inactivo"}
                      onChange={(e) =>
                        setEditingUser({
                          ...editingUser,
                          activo: e.target.value === "activo",
                        })
                      }
                      className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm"
                    >
                      <option value="activo">Activo</option>
                      <option value="inactivo">Inactivo</option>
                    </select>
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setEditingUser(null)}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveUser} disabled={saving}>
                    {saving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <UserCircle className="mr-2 h-4 w-4" />
                    )}
                    Guardar
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* RESET PASSWORD MODAL */}
      <AnimatePresence>
        {resetTarget && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setResetTarget(null)}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div
                className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-lg font-bold">Restablecer contraseña</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Para: {resetTarget.nombre}
                </p>
                <div className="mt-4">
                  <label className="mb-1.5 block text-sm font-medium">
                    Nueva contraseña temporal
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={resetPassword}
                      onChange={(e) => setResetPassword(e.target.value)}
                      className="flex-1 rounded-xl border border-border bg-white px-4 py-3 font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      onClick={() => setResetPassword(generatePassword())}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="mt-5 flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setResetTarget(null)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleResetPassword}
                    disabled={saving || !resetPassword.trim()}
                  >
                    {saving && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Restablecer
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRM */}
      <ConfirmModal
        open={!!deleteTarget}
        title="Eliminar empleado"
        message={`¿Deseas eliminar permanentemente a "${deleteTarget?.nombre}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
