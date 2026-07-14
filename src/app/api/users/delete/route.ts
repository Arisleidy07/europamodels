import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebaseAdmin";
import { getFirestore } from "firebase-admin/firestore";
import { getApps } from "firebase-admin/app";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { uid } = body;

    if (!uid) {
      return NextResponse.json({ error: "uid requerido" }, { status: 400 });
    }

    const auth = getAdminAuth();
    await auth.deleteUser(uid);

    const db = getFirestore(getApps()[0]);
    await db.collection("users").doc(uid).delete();

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Error deleting user:", err);
    return NextResponse.json({ error: err.message || "Error interno" }, { status: 500 });
  }
}
