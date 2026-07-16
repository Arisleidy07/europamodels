import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminFirestore } from "@/lib/firebaseAdmin";
import { assertManageableUser, requireAdministrator } from "@/lib/serverAuth";

export async function POST(req: NextRequest) {
  try {
    await requireAdministrator(req);
    const body = await req.json();
    const { uid, newPassword } = body;

    if (!uid || typeof newPassword !== "string") {
      return NextResponse.json(
        { error: "uid y newPassword requeridos" },
        { status: 400 },
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 },
      );
    }

    await assertManageableUser(uid);
    const auth = getAdminAuth();
    await auth.updateUser(uid, { password: newPassword });

    const db = getAdminFirestore();
    await db.collection("users").doc(uid).update({
      requiresPasswordChange: true,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Error resetting password:", err);
    const message = String(
      err?.message || "No se pudo restablecer la contraseña",
    );
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
