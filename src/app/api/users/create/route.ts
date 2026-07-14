import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebaseAdmin";
import { getFirestore } from "firebase-admin/firestore";
import { getApps } from "firebase-admin/app";

export async function POST(req: NextRequest) {
  try {
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

    if (!username || !nombre || !password) {
      return NextResponse.json(
        { error: "Campos requeridos: username, nombre, password" },
        { status: 400 },
      );
    }
    if (!/^[a-z0-9._-]+$/.test(username)) {
      return NextResponse.json(
        { error: "El usuario contiene caracteres inválidos" },
        { status: 400 },
      );
    }

    const email = `${username.toLowerCase().trim()}@europamodels.com`;
    const auth = getAdminAuth();

    // Create Firebase Auth user
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: nombre,
    });

    // Create Firestore document
    const db = getFirestore(getApps()[0]);
    await db
      .collection("users")
      .doc(userRecord.uid)
      .set({
        nombre,
        correo: email,
        rol: rol || "empleado",
        activo: true,
        foto: foto || null,
        fechaCreacion: new Date().toISOString(),
        requiresPasswordChange: true,
        permisos: {},
      });

    return NextResponse.json({
      uid: userRecord.uid,
      email,
      nombre,
    });
  } catch (err: any) {
    console.error("Error creating user:", err);
    if (err.code === "auth/email-already-exists") {
      return NextResponse.json(
        { error: "Este usuario ya existe" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: err.message || "Error interno" },
      { status: 500 },
    );
  }
}
