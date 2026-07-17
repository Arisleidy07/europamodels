"use client";

import Link from "next/link";
import { WifiOff, RefreshCw } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/Button";

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <section className="w-full max-w-md rounded-3xl border border-border bg-white p-8 text-center shadow-xl">
        <Logo variant="horizontal" height={56} className="mx-auto" />
        <div className="mx-auto mt-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <WifiOff className="h-8 w-8" />
        </div>
        <h1 className="mt-6 text-2xl font-bold text-foreground">Sin conexión</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Puedes seguir usando el catálogo y el contenido que ya se guardó en este dispositivo.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <Link href="/catalogo">
            <Button size="lg" className="w-full">Abrir catálogo guardado</Button>
          </Link>
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Reintentar conexión
          </Button>
        </div>
      </section>
    </main>
  );
}
