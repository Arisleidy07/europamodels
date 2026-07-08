"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import { getSettings, saveSettings } from "@/lib/localDb";
import type { AppSettings } from "@/types";

const defaultSettings: AppSettings = {
  empresa: {
    nombre: "Europa Models",
    descripcion: "Catálogo exclusivo de perfumes, ropa, relojes y accesorios.",
  },
  catalogo: {
    mostrarPrecio: true,
    mostrarStock: false,
    mostrarMarca: true,
    mostrarCategoria: true,
    productosPorPagina: 24,
    ordenDefault: "recientes",
  },
  cotizaciones: {
    prefijo: "COT",
    longitudNumeros: 6,
    mensajeAutomatico:
      "Hola, le comparto la cotización solicitada de Europa Models.",
    validezDias: 7,
  },
  apariencia: {
    colorPrincipal: "#2563eb",
    colorSecundario: "#ffffff",
    modoOscuro: false,
  },
  inicio: {
    tituloPrincipal: "Descubre nuestro catálogo exclusivo",
    subtitulo: "Perfumes, ropa, relojes y accesorios seleccionados para ti.",
    textoBoton: "Ver catálogo",
  },
  licenseStatus: "active",
};

interface SettingsContextValue {
  settings: AppSettings;
  loading: boolean;
  suspended: boolean;
  licenseReason?: string;
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: defaultSettings,
  loading: true,
  suspended: false,
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe = () => {};

    const setup = async () => {
      const local = await getSettings();
      if (local) setSettings(local);

      const firestore = getFirebaseDb();
      if (!firestore) {
        setLoading(false);
        return;
      }

      unsubscribe = onSnapshot(
        doc(firestore, "settings", "main"),
        (snap) => {
          if (snap.exists()) {
            const data = { ...defaultSettings, ...snap.data() } as AppSettings;
            setSettings(data);
            saveSettings(data);
          }
          setLoading(false);
        },
        () => {
          setLoading(false);
        },
      );
    };

    setup();
    return () => unsubscribe();
  }, []);

  const suspended = settings.licenseStatus === "suspended";

  return (
    <SettingsContext.Provider
      value={{
        settings,
        loading,
        suspended,
        licenseReason: settings.licenseReason,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}

export { defaultSettings };
