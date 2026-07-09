"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Trash2,
  Loader2,
  Mail,
  Shield,
  UserCircle,
  X,
  Check,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  getUsers,
  updateUser,
  deleteUser,
  createInvitation,
} from "@/lib/users";
import { useAuth } from "@/context/AuthContext";
import { getInitials } from "@/lib/utils";
import toast from "react-hot-toast";
import type { AppUser, UserRole, UserPermissions } from "@/types";

const ROLES: { value: UserRole; label: string }[] = [
  { value: "administrador", label: "Administrador" },
  { value: "vendedor", label: "Vendedor" },
  { value: "fotografa", label: "Fotógrafa" },
  { value: "empleado", label: "Empleado" },
];

const PERMISSION_GROUPS: {
  key: keyof UserPermissions;
  label: string;
  actions: string[];
}[] = [
  {
    key: "productos",
    label: "Productos",
    actions: ["crear", "editar", "eliminar", "cambiarPrecios", "cambiarStock"],
  },
  {
    key: "categorias",
    label: "Categorías",
    actions: ["crear", "editar", "eliminar", "cambiarOrden"],
  },
  { key: "marcas", label: "Marcas", actions: ["crear", "editar", "eliminar"] },
  {
    key: "cotizaciones",
    label: "Cotizaciones",
    actions: ["crear", "verTodas", "eliminar", "cambiarEstado"],
  },
  {
    key: "usuarios",
    label: "Equipo",
    actions: ["invitar", "editarPermisos", "desactivar", "eliminar"],
  },
  { key: "configuracion", label: "Configuración", actions: ["editar"] },
];

export default function AdminTeam() {
  const { user: currentUser, canManageUser } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("vendedor");
  const [saving, setSaving] = useState(false);

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

  const handleToggleActive = async (u: AppUser) => {
    if (!canManageUser(u)) {
      toast.error("No tienes permiso para modificar este usuario");
      return;
    }
    try {
      await updateUser(u.id, { activo: !u.activo });
      toast.success(`Usuario ${u.activo ? "desactivado" : "activado"}`);
      loadUsers();
    } catch (err: any) {
      toast.error(err.message || "Error");
    }
  };

  const handleDelete = async (u: AppUser) => {
    if (!canManageUser(u)) {
      toast.error("No tienes permiso para eliminar este usuario");
      return;
    }
    if (!confirm("¿Eliminar este usuario?")) return;
    try {
      await deleteUser(u.id);
      toast.success("Usuario eliminado");
      loadUsers();
    } catch (err: any) {
      toast.error(err.message || "Error al eliminar");
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !inviteName.trim() || !currentUser) return;
    setSaving(true);
    try {
      await createInvitation({
        correo: inviteEmail.trim(),
        nombre: inviteName.trim(),
        cargo: ROLES.find((r) => r.value === inviteRole)?.label,
        permisos: {},
        creadoPor: currentUser.id,
      });
      toast.success("Invitación enviada");
      setInviteOpen(false);
      setInviteEmail("");
      setInviteName("");
    } catch (err: any) {
      toast.error(err.message || "Error al invitar");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveUser = async () => {
    if (!editingUser || !currentUser) return;
    if (!canManageUser(editingUser)) {
      toast.error("No tienes permiso para modificar este usuario");
      return;
    }
    setSaving(true);
    try {
      const updates: Partial<AppUser> = {
        nombre: editingUser.nombre,
        apellido: editingUser.apellido,
        cargo: editingUser.cargo,
        permisos: editingUser.permisos,
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

  const togglePermission = (permKey: keyof UserPermissions, action: string) => {
    if (!editingUser) return;
    setEditingUser((prev) => {
      if (!prev) return null;
      const group = { ...(prev.permisos[permKey] || {}) } as Record<
        string,
        boolean
      >;
      group[action] = !group[action];
      return { ...prev, permisos: { ...prev.permisos, [permKey]: group } };
    });
  };

  if (loading)
    return <div className="text-center text-muted-foreground">Cargando...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setInviteOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Invitar usuario
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {users.map((u) => {
          const canManage = canManageUser(u);
          return (
            <div
              key={u.id}
              className="flex flex-col rounded-2xl border border-border bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
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
                    <p className="text-sm text-muted-foreground">{u.correo}</p>
                  </div>
                </div>
                {u.isSuperAdmin && <Shield className="h-5 w-5 text-warning" />}
              </div>

              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Rol</span>
                  <span className="rounded-full bg-muted px-2.5 py-1 font-medium capitalize">
                    {u.rol}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Cargo</span>
                  <span className="text-foreground">{u.cargo || "-"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Estado</span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      u.activo
                        ? "bg-green-50 text-success"
                        : "bg-gray-100 text-muted-foreground"
                    }`}
                  >
                    {u.activo ? "Activo" : "Inactivo"}
                  </span>
                </div>
              </div>

              <div className="mt-5 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleToggleActive(u)}
                  disabled={!canManage}
                >
                  {u.activo ? "Desactivar" : "Activar"}
                </Button>
                <button
                  onClick={() => setEditingUser(u)}
                  disabled={!canManage}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-white text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(u)}
                  disabled={!canManage}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-white text-danger transition-colors hover:bg-red-50 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {inviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold">Invitar usuario</h3>
            <div className="mt-4 space-y-4">
              <Input
                label="Nombre"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="Nombre del usuario"
              />
              <Input
                label="Correo"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
              />
              <div>
                <label className="mb-1 block text-sm font-medium">Rol</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as UserRole)}
                  className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm"
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setInviteOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleInvite}
                disabled={saving || !inviteEmail.trim() || !inviteName.trim()}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4" />
                )}
                Enviar invitación
              </Button>
            </div>
          </div>
        </div>
      )}

      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">Editar usuario</h3>
              <button
                onClick={() => setEditingUser(null)}
                className="rounded-full p-2 hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Nombre"
                value={editingUser.nombre}
                onChange={(e) =>
                  setEditingUser({ ...editingUser, nombre: e.target.value })
                }
              />
              <Input
                label="Apellido"
                value={editingUser.apellido || ""}
                onChange={(e) =>
                  setEditingUser({ ...editingUser, apellido: e.target.value })
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
                <label className="mb-1.5 block text-sm font-medium">Rol</label>
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
            </div>

            <div className="mt-6 space-y-4">
              <h4 className="font-semibold">Permisos</h4>
              {PERMISSION_GROUPS.map((group) => (
                <div
                  key={group.key}
                  className="rounded-xl border border-border p-4"
                >
                  <p className="mb-3 text-sm font-medium">{group.label}</p>
                  <div className="flex flex-wrap gap-2">
                    {group.actions.map((action) => {
                      const groupPerms = editingUser.permisos[group.key] as
                        | Record<string, boolean>
                        | undefined;
                      const active = !!groupPerms?.[action];
                      return (
                        <button
                          key={action}
                          onClick={() => togglePermission(group.key, action)}
                          className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                            active
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-white text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          {active ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Plus className="h-3 w-3" />
                          )}
                          {action}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setEditingUser(null)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveUser} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserCircle className="h-4 w-4" />
                )}
                Guardar usuario
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
