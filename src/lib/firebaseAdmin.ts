import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

let app: App;

function getAdminApp(): App {
  if (getApps().length > 0) return getApps()[0];

  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccount) {
    throw new Error(
      "La configuración privada de Firebase no está disponible en el servidor",
    );
  }

  let credentials: Record<string, string>;
  try {
    credentials = JSON.parse(serviceAccount);
  } catch {
    throw new Error(
      "La configuración privada de Firebase tiene un formato inválido",
    );
  }

  app = initializeApp({
    credential: cert(credentials),
  });
  return app;
}

export function getAdminAuth() {
  return getAuth(getAdminApp());
}

export function getAdminFirestore() {
  return getFirestore(getAdminApp());
}
