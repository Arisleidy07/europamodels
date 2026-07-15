"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updatePassword,
  User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase";
import type { AppUser, UserPermissions } from "@/types";

interface AuthContextValue {
  user: AppUser | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  requiresPasswordChange: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  hasPermission: (scope: keyof UserPermissions, action: string) => boolean;
  canManageUser: (target: AppUser) => boolean;
}

const defaultPermissions: Required<UserPermissions> = {
  productos: {
    crear: false,
    editar: false,
    eliminar: false,
    ocultar: false,
    cambiarPrecios: false,
    cambiarStock: false,
    subirImagenes: false,
  },
  categorias: {
    crear: false,
    editar: false,
    eliminar: false,
    cambiarOrden: false,
  },
  marcas: { crear: false, editar: false, eliminar: false },
  cotizaciones: {
    crear: true,
    verPropias: true,
    verTodas: false,
    eliminar: false,
    cambiarEstado: false,
  },
  usuarios: {
    invitar: false,
    editarPermisos: false,
    desactivar: false,
    eliminar: false,
  },
  configuracion: { editar: false },
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [requiresPasswordChange, setRequiresPasswordChange] = useState(false);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const firestore = getFirebaseDb();
    if (!auth || !firestore) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        const userDoc = await getDoc(doc(firestore, "users", fbUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data() as Omit<AppUser, "id">;
          setUser({ ...data, id: fbUser.uid });
          setRequiresPasswordChange(!!data.requiresPasswordChange);
          await updateDoc(doc(firestore, "users", fbUser.uid), {
            ultimoAcceso: new Date().toISOString(),
          });
        }
      } else {
        setUser(null);
        setRequiresPasswordChange(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const auth = getFirebaseAuth();
    const firestore = getFirebaseDb();
    if (!auth || !firestore) throw new Error("Firebase no está configurado");
    const result = await signInWithEmailAndPassword(auth, email, password);
    const userDoc = await getDoc(doc(firestore, "users", result.user.uid));
    if (!userDoc.exists()) throw new Error("Usuario no encontrado");
    const data = userDoc.data() as Omit<AppUser, "id">;
    if (!data.activo) throw new Error("Cuenta suspendida");
    setUser({ ...data, id: result.user.uid });
    setRequiresPasswordChange(!!data.requiresPasswordChange);
  };

  const loginWithGoogle = async () => {
    const auth = getFirebaseAuth();
    const firestore = getFirebaseDb();
    if (!auth || !firestore) throw new Error("Firebase no está configurado");
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const userDoc = await getDoc(doc(firestore, "users", result.user.uid));
    if (!userDoc.exists()) {
      // Usuario nuevo con Google: crear documento con permisos básicos de vendedor
      const newUser: Omit<AppUser, "id"> = {
        nombre:
          result.user.displayName ||
          result.user.email?.split("@")[0] ||
          "Usuario",
        correo: result.user.email || "",
        rol: "vendedor",
        activo: true,
        cargo: "Vendedor",
        fechaCreacion: new Date().toISOString(),
        permisos: defaultPermissions,
      };
      await setDoc(doc(firestore, "users", result.user.uid), newUser);
      setUser({ ...newUser, id: result.user.uid });
    } else {
      const data = userDoc.data() as Omit<AppUser, "id">;
      if (!data.activo) throw new Error("Cuenta suspendida");
      setUser({ ...data, id: result.user.uid });
    }
  };

  const logout = async () => {
    const auth = getFirebaseAuth();
    if (auth) await signOut(auth);
    setUser(null);
    setRequiresPasswordChange(false);
  };

  const changePassword = async (newPassword: string) => {
    const auth = getFirebaseAuth();
    const firestore = getFirebaseDb();
    if (!auth?.currentUser || !firestore) throw new Error("No autenticado");
    await updatePassword(auth.currentUser, newPassword);
    await updateDoc(doc(firestore, "users", auth.currentUser.uid), {
      requiresPasswordChange: false,
    });
    setRequiresPasswordChange(false);
    if (user) setUser({ ...user, requiresPasswordChange: false });
  };

  const refreshUser = async () => {
    const auth = getFirebaseAuth();
    const firestore = getFirebaseDb();
    if (!auth?.currentUser || !firestore) return;
    const userDoc = await getDoc(doc(firestore, "users", auth.currentUser.uid));
    if (userDoc.exists()) {
      const data = userDoc.data() as Omit<AppUser, "id">;
      setUser({ ...data, id: auth.currentUser.uid });
    }
  };

  const hasPermission = (
    scope: keyof UserPermissions,
    action: string,
  ): boolean => {
    if (!user) return false;
    if (user.isSuperAdmin) return true;
    if (user.rol === "administrador") return true;
    const scopePerms = user.permisos?.[scope] || {};
    const defaultScope = defaultPermissions[scope] || {};
    return (
      (scopePerms as Record<string, boolean>)[action] ??
      (defaultScope as Record<string, boolean>)[action] ??
      false
    );
  };

  const canManageUser = (target: AppUser): boolean => {
    if (!user) return false;
    if (user.isSuperAdmin) return true;
    if (target.isSuperAdmin) return false;
    if (target.id === user.id) return true;
    return user.rol === "administrador";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        requiresPasswordChange,
        login,
        loginWithGoogle,
        logout,
        changePassword,
        refreshUser,
        hasPermission,
        canManageUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return context;
}
