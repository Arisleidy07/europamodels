import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminFirestore } from "@/lib/firebaseAdmin";
import { assertManageableUser, requireAdministrator } from "@/lib/serverAuth";

export async function POST(req: NextRequest) {
  try {
    await requireAdministrator(req);
    const body = await req.json();
    const { uid } = body;

    if (!uid) {
      return NextResponse.json({ error: "uid requerido" }, { status: 400 });
    }

    await assertManageableUser(uid);
    const auth = getAdminAuth();
    const db = getAdminFirestore();
    await auth.deleteUser(uid);
    await db.collection("users").doc(uid).delete();

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Error deleting user:", err);
    const message = String(err?.message || "No se pudo eliminar el usuario");
    const status =
      message === "Debes iniciar sesión para realizar esta acción"
        ? 401
        : message.includes("permisos") ||
            message.includes("no puede modificarse")
          ? 403
          : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
