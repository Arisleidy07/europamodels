import { NextRequest } from "next/server";
import { getAdminAuth, getAdminFirestore } from "@/lib/firebaseAdmin";

export async function requireAdministrator(req: NextRequest): Promise<string> {
  const authorization = req.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : null;

  if (!token) {
    throw new Error("Debes iniciar sesión para realizar esta acción");
  }

  const decoded = await getAdminAuth().verifyIdToken(token);
  const userDoc = await getAdminFirestore().collection("users").doc(decoded.uid).get();
  const user = userDoc.data();

  if (!user?.activo) {
    throw new Error("Tu cuenta no está activa");
  }
  if (user.rol !== "administrador" && !user.isSuperAdmin) {
    throw new Error("No tienes permisos para administrar usuarios");
  }

  return decoded.uid;
}

export async function assertManageableUser(uid: string): Promise<void> {
  const target = await getAdminFirestore().collection("users").doc(uid).get();
  if (!target.exists) throw new Error("El usuario no existe");
  if (target.data()?.isSuperAdmin) {
    throw new Error("El Administrador Principal no puede modificarse desde esta acción");
  }
}
