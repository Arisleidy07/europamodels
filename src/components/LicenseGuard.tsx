"use client";

import React from "react";
import { useSettings } from "@/context/SettingsContext";
import { AlertTriangle, Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function LicenseGuard({ children }: { children: React.ReactNode }) {
  const { suspended, licenseReason, settings, loading } = useSettings();

  if (loading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-white text-foreground">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="mt-4 text-muted-foreground">Cargando configuración...</p>
      </div>
    );
  }

  if (suspended) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center">
        {settings.empresa.logo ? (
          <img src={settings.empresa.logo} alt="Europa Models" className="h-16 w-auto object-contain" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary text-xl font-bold text-white">
            EM
          </div>
        )}
        <div className="mt-8 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50">
          <AlertTriangle className="h-8 w-8 text-warning" />
        </div>
        <h1 className="mt-6 text-2xl font-bold text-foreground">Licencia suspendida</h1>
        <p className="mt-3 max-w-md text-base text-muted-foreground">
          {licenseReason || "El acceso a este sistema ha sido suspendido temporalmente debido a un pago pendiente del servicio de mantenimiento."}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Una vez confirmado el pago, el acceso será restablecido automáticamente.
        </p>
        <Button
          size="lg"
          className="mt-8"
          onClick={() => window.open(`mailto:contacto@europamodels.com?subject=Soporte%20Europa%20Models`)}
        >
          <Mail className="mr-2 h-5 w-5" /> Contactar al desarrollador
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
