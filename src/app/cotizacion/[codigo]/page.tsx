"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { formatCurrency, shareContent } from "@/lib/utils";
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
    const ok = await shareContent(
      {
        title: `Cotización ${quote?.codigo}`,
        text: `Cotización de ${settings.empresa.nombre}`,
        url: window.location.href,
      },
      () => toast.success("Enlace copiado"),
    );
    if (!ok) toast.error("No se pudo compartir");
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
        <h1 className="text-2xl font-bold text-foreground">
          Cotización no encontrada
        </h1>
        <p className="mt-2 text-muted-foreground">
          El enlace que abriste no es válido o ha expirado.
        </p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white px-4 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-3xl">
        {/* Header card */}
        <div className="overflow-hidden rounded-t-3xl bg-white shadow-sm">
          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-6 py-10 sm:px-10">
            <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
              <div className="flex items-center gap-5">
                <img
                  src="/icons/europa-white.PNG"
                  alt="Europa Models"
                  className="h-16 w-auto drop-shadow-lg sm:h-20"
                />
                <div>
                  <h1 className="text-xl font-bold text-white sm:text-2xl">
                    {settings.empresa.nombre}
                  </h1>
                  <p className="text-sm text-white/60">
                    {settings.empresa.descripcion}
                  </p>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">
                  Cotización
                </p>
                <p className="text-2xl font-bold tracking-tight text-white">
                  {quote.codigo}
                </p>
                <p className="mt-0.5 text-sm text-white/70">
                  {new Date(quote.fechaCreacion).toLocaleDateString("es-DO", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="rounded-b-3xl border border-t-0 border-border bg-white px-6 pb-8 pt-6 shadow-sm sm:px-10">
          {/* Client info */}
          {quote.cliente.nombre && (
            <section className="mb-8 rounded-2xl border border-border/60 bg-gray-50/50 p-5">
              <h2 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Datos del cliente
              </h2>
              <p className="text-base font-semibold text-foreground">
                {quote.cliente.nombre}
              </p>
              <div className="mt-1 space-y-0.5 text-sm text-muted-foreground">
                {quote.cliente.empresa && <p>{quote.cliente.empresa}</p>}
                {quote.cliente.telefono && <p>{quote.cliente.telefono}</p>}
                {quote.cliente.correo && <p>{quote.cliente.correo}</p>}
              </div>
            </section>
          )}

          {/* Products */}
          <section>
            <h2 className="mb-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Productos ({quote.productos.length})
            </h2>
            <div className="space-y-3">
              {quote.productos.map((p, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-4 rounded-2xl border border-border/60 bg-white p-3 transition-colors hover:bg-gray-50/50"
                >
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gray-50">
                    <img
                      src={p.imagen || "/placeholder-product.svg"}
                      alt={p.nombre}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <h3 className="text-sm font-semibold text-foreground">
                      {p.nombre}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(p.precio)} × {p.cantidad}
                      {p.talla && (
                        <span className="ml-1.5 font-medium text-primary">
                          Talla: {p.talla}
                        </span>
                      )}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-foreground">
                    {formatCurrency(p.subtotal)}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Totals */}
          <section className="mt-8 rounded-2xl bg-gray-900 p-6 text-white">
            <div className="flex items-center justify-between py-1 text-sm">
              <span className="text-white/60">Subtotal</span>
              <span className="font-medium">
                {formatCurrency(quote.subtotal)}
              </span>
            </div>
            {quote.descuento && quote.descuento > 0 && (
              <div className="flex items-center justify-between py-1 text-sm">
                <span className="text-white/60">Descuento</span>
                <span className="font-medium text-green-400">
                  -{formatCurrency(quote.descuento)}
                </span>
              </div>
            )}
            <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3">
              <span className="text-lg font-bold">Total</span>
              <span className="text-3xl font-bold">
                {formatCurrency(quote.total)}
              </span>
            </div>
          </section>

          {/* Notes */}
          {quote.observaciones && (
            <section className="mt-6 rounded-2xl bg-amber-50/60 p-4">
              <h3 className="text-xs font-bold uppercase tracking-wide text-amber-700">
                Observaciones
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-amber-900/80">
                {quote.observaciones}
              </p>
            </section>
          )}

          {/* Footer */}
          <footer className="mt-8 border-t border-border pt-6">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
              <div className="text-center text-xs text-muted-foreground sm:text-left">
                <p className="font-medium text-foreground">
                  {settings.empresa.nombre}
                </p>
                {settings.empresa.direccion && (
                  <p>{settings.empresa.direccion}</p>
                )}
                <p>
                  {[settings.empresa.telefono, settings.empresa.correo]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="mr-2 h-4 w-4" /> Compartir
              </Button>
            </div>
          </footer>
        </div>
      </div>
    </main>
  );
}
