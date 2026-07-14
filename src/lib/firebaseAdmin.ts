import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

let app: App;

function getAdminApp(): App {
  if (getApps().length > 0) return getApps()[0];
  
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccount) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY env variable not set");
  }
  
  app = initializeApp({
    credential: cert(JSON.parse(serviceAccount)),
  });
  return app;
}

export function getAdminAuth() {
  return getAuth(getAdminApp());
}
