import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminFirestore } from "@/lib/firebaseAdmin";
import { requireAdministrator } from "@/lib/serverAuth";

export async function POST(req: NextRequest) {
  try {
    await requireAdministrator(req);
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "El cuerpo de la solicitud no es JSON válido" },
        { status: 400 },
      );
    }
    const { username, nombre, rol, password, foto } = body;

    if (
      typeof username !== "string" ||
      typeof nombre !== "string" ||
      typeof password !== "string" ||
      !username.trim() ||
      !nombre.trim() ||
      !password
    ) {
      return NextResponse.json(
        { error: "Campos requeridos: username, nombre, password" },
        { status: 400 },
      );
    }
    if (!/^[a-z0-9._-]+$/.test(username.trim().toLowerCase())) {
      return NextResponse.json(
        { error: "El usuario contiene caracteres inválidos" },
        { status: 400 },
      );
    }

    if (rol !== "administrador" && rol !== "vendedor") {
      return NextResponse.json(
        { error: "El rol debe ser Administrador o Vendedor" },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 },
      );
    }

    const email = `${username.toLowerCase().trim()}@europamodels.com`;
    const auth = getAdminAuth();
    const db = getAdminFirestore();

    const userRecord = await auth.createUser({
      email,
      password,
      displayName: nombre,
    });

    try {
      await db
        .collection("users")
        .doc(userRecord.uid)
        .set({
          nombre,
          correo: email,
          rol,
          activo: true,
          foto: foto || null,
          fechaCreacion: new Date().toISOString(),
          requiresPasswordChange: true,
          permisos: {},
        });
    } catch (error) {
      await auth.deleteUser(userRecord.uid).catch(() => undefined);
      throw error;
    }

    return NextResponse.json({
      uid: userRecord.uid,
      email,
      nombre,
    });
  } catch (err: any) {
    console.error("Error creating user:", err);
    const code = typeof err?.code === "string" ? err.code : "";
    const message = String(err?.message || "");
    if (message === "Debes iniciar sesión para realizar esta acción") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    if (
      message === "No tienes permisos para administrar usuarios" ||
      message === "Tu cuenta no está activa"
    ) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    if (code === "auth/email-already-exists") {
      return NextResponse.json(
        { error: "Este usuario ya existe" },
        { status: 409 },
      );
    }
    if (code === "auth/invalid-password") {
      return NextResponse.json(
        { error: "La contraseña no cumple los requisitos de Firebase" },
        { status: 400 },
      );
    }
    if (
      code === "auth/invalid-credential" ||
      code === "app/invalid-credential"
    ) {
      return NextResponse.json(
        { error: "Las credenciales privadas de Firebase no son válidas" },
        { status: 503 },
      );
    }
    if (message.includes("configuración privada de Firebase")) {
      return NextResponse.json({ error: message }, { status: 503 });
    }
    return NextResponse.json(
      {
        error:
          "No se pudo crear el empleado. Revisa la configuración de Firebase e inténtalo de nuevo.",
      },
      { status: 503 },
    );
  }
}
