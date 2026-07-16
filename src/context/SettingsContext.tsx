"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import { getSettings, saveSettings } from "@/lib/localDb";
import type { AppSettings } from "@/types";

function hexToHsl(hex: string): string | null {
  const normalized = hex.replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(normalized)) return null;
  const red = parseInt(normalized.slice(0, 2), 16) / 255;
  const green = parseInt(normalized.slice(2, 4), 16) / 255;
  const blue = parseInt(normalized.slice(4, 6), 16) / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const lightness = (max + min) / 2;
  const delta = max - min;
  const saturation =
    delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));
  let hue = 0;
  if (delta !== 0) {
    if (max === red) hue = ((green - blue) / delta) % 6;
    else if (max === green) hue = (blue - red) / delta + 2;
    else hue = (red - green) / delta + 4;
  }
  hue = Math.round(hue * 60);
  if (hue < 0) hue += 360;
  return `${hue} ${Math.round(saturation * 100)}% ${Math.round(lightness * 100)}%`;
}

const defaultSettings: AppSettings = {
  empresa: {
    nombre: "Europa Models",
    descripcion: "Catálogo exclusivo para el equipo de ventas.",
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
    tituloPrincipal: "Bienvenido a Europa Models",
    subtitulo: "Tu catálogo exclusivo",
    textoBoton: "Ver catálogo",
    videos: [],
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
            const persisted = snap.data() as Partial<AppSettings>;
            const data: AppSettings = {
              ...defaultSettings,
              ...persisted,
              empresa: { ...defaultSettings.empresa, ...persisted.empresa },
              catalogo: { ...defaultSettings.catalogo, ...persisted.catalogo },
              cotizaciones: {
                ...defaultSettings.cotizaciones,
                ...persisted.cotizaciones,
              },
              apariencia: {
                ...defaultSettings.apariencia,
                ...persisted.apariencia,
              },
              inicio: { ...defaultSettings.inicio, ...persisted.inicio },
            };
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

  useEffect(() => {
    const root = document.documentElement;
    const primary = hexToHsl(settings.apariencia.colorPrincipal);
    const background = hexToHsl(settings.apariencia.colorSecundario);
    if (primary) root.style.setProperty("--primary", primary);
    if (settings.apariencia.modoOscuro) {
      root.style.removeProperty("--background");
    } else if (background) {
      root.style.setProperty("--background", background);
    }
    root.classList.toggle("dark", settings.apariencia.modoOscuro);
  }, [settings.apariencia]);

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
