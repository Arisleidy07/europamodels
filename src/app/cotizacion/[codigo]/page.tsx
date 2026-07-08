"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { getQuoteByCode } from "@/lib/quotes";
import { useSettings } from "@/context/SettingsContext";
import { Share2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { Quote } from "@/types";
import toast from "react-hot-toast";

export default function QuotePage() {
  const { codigo } = useParams<{ codigo: string }>();
  const { settings } = useSettings();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!codigo) return;
    getQuoteByCode(codigo).then((q) => {
      setQuote(q);
      setLoading(false);
    });
  }, [codigo]);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({
        title: `Cotización ${quote?.codigo}`,
        text: `Cotización de ${settings.empresa.nombre}`,
        url,
      });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Enlace copiado");
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-white px-6 text-center">
        <h1 className="text-2xl font-bold text-foreground">Cotización no encontrada</h1>
        <p className="mt-2 text-muted-foreground">El enlace que abriste no es válido o ha expirado.</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white p-4 py-8 sm:p-8">
      <div className="mx-auto max-w-3xl rounded-3xl border border-border bg-white p-6 shadow-sm sm:p-10">
        <header className="flex flex-col items-start justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            {settings.empresa.logo ? (
              <img src={settings.empresa.logo} alt="" className="h-14 w-auto object-contain" />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-xl font-bold text-white">
                EM
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-foreground">{settings.empresa.nombre}</h1>
              <p className="text-sm text-muted-foreground">{settings.empresa.descripcion}</p>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Cotización</p>
            <p className="text-lg font-bold text-primary">{quote.codigo}</p>
            <p className="text-sm text-muted-foreground">{new Date(quote.fechaCreacion).toLocaleDateString("es-DO")}</p>
          </div>
        </header>

        {quote.cliente.nombre && (
          <section className="mt-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Cliente</h2>
            <p className="mt-1 text-base text-foreground">{quote.cliente.nombre}</p>
            {quote.cliente.empresa && <p className="text-sm text-muted-foreground">{quote.cliente.empresa}</p>}
            {quote.cliente.telefono && <p className="text-sm text-muted-foreground">{quote.cliente.telefono}</p>}
            {quote.cliente.correo && <p className="text-sm text-muted-foreground">{quote.cliente.correo}</p>}
          </section>
        )}

        <section className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Productos</h2>
          <div className="mt-4 space-y-4">
            {quote.productos.map((p, idx) => (
              <div key={idx} className="flex gap-4 rounded-2xl border border-border p-3">
                <img
                  src={p.imagen || "/placeholder-product.svg"}
                  alt={p.nombre}
                  className="h-20 w-20 rounded-xl object-cover"
                />
                <div className="flex flex-1 flex-col justify-center">
                  <h3 className="font-semibold text-foreground">{p.nombre}</h3>
                  <p className="text-sm text-muted-foreground">Cantidad: {p.cantidad}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-foreground">{formatCurrency(p.precio)}</p>
                  <p className="text-sm text-muted-foreground">{formatCurrency(p.subtotal)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 border-t border-border pt-6">
          <div className="flex items-center justify-between text-base">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-semibold text-foreground">{formatCurrency(quote.subtotal)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-2xl font-bold text-foreground">
            <span>Total</span>
            <span>{formatCurrency(quote.total)}</span>
          </div>
        </section>

        {quote.observaciones && (
          <section className="mt-6 rounded-2xl bg-muted/50 p-4">
            <h3 className="text-sm font-semibold text-foreground">Observaciones</h3>
            <p className="mt-1 text-sm text-muted-foreground">{quote.observaciones}</p>
          </section>
        )}

        <footer className="mt-8 border-t border-border pt-6 text-center text-sm text-muted-foreground">
          <p>{settings.empresa.direccion}</p>
          <p>{settings.empresa.telefono} · {settings.empresa.correo}</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={handleShare}>
            <Share2 className="mr-2 h-4 w-4" /> Compartir cotización
          </Button>
        </footer>
      </div>
    </main>
  );
}
