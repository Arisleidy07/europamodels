"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getUsers, updateUser, deleteUser, createInvitation } from "@/lib/users";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import type { AppUser, UserRole } from "@/types";

const ROLES: { value: UserRole; label: string }[] = [
  { value: "administrador", label: "Administrador" },
  { value: "vendedor", label: "Vendedor" },
  { value: "fotografa", label: "Fotógrafa" },
  { value: "empleado", label: "Empleado" },
];

export default function AdminTeam() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
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
    try {
      await updateUser(u.id, { activo: !u.activo });
      toast.success(`Usuario ${u.activo ? "desactivado" : "activado"}`);
      loadUsers();
    } catch (err: any) {
      toast.error(err.message || "Error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este usuario?")) return;
    try {
      await deleteUser(id);
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

  if (loading) return <div className="text-center text-muted-foreground">Cargando...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setInviteOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Invitar usuario
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Correo</th>
              <th className="px-4 py-3 font-medium">Rol</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3 font-medium">{u.nombre}</td>
                <td className="px-4 py-3 text-muted-foreground">{u.correo}</td>
                <td className="px-4 py-3 capitalize">{u.rol}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      u.activo ? "bg-green-50 text-success" : "bg-gray-100 text-muted-foreground"
                    }`}
                  >
                    {u.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleToggleActive(u)}
                      className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
                      title={u.activo ? "Desactivar" : "Activar"}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(u.id)}
                      className="rounded-lg p-2 text-danger hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
              <Button onClick={handleInvite} disabled={saving || !inviteEmail.trim() || !inviteName.trim()}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                Enviar invitación
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
