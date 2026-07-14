import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebaseAdmin";
import { getFirestore } from "firebase-admin/firestore";
import { getApps } from "firebase-admin/app";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { uid, newPassword } = body;

    if (!uid || !newPassword) {
      return NextResponse.json({ error: "uid y newPassword requeridos" }, { status: 400 });
    }

    const auth = getAdminAuth();
    await auth.updateUser(uid, { password: newPassword });

    // Mark user as needing password change
    const db = getFirestore(getApps()[0]);
    await db.collection("users").doc(uid).update({
      requiresPasswordChange: true,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Error resetting password:", err);
    return NextResponse.json({ error: err.message || "Error interno" }, { status: 500 });
  }
}
