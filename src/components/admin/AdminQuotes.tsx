"use client";

import React from "react";
import { useCatalogData } from "@/hooks/useCatalogData";
import { formatCurrency, shareContent } from "@/lib/utils";
import { FileText, ExternalLink, Loader2, Send } from "lucide-react";
import toast from "react-hot-toast";
import type { Quote } from "@/types";

export default function AdminQuotes() {
  const { quotes, loading } = useCatalogData();

  const handleSend = async (quote: Quote) => {
    const shared = await shareContent(
      {
        title: `Cotización ${quote.codigo}`,
        text: `Te comparto la cotización ${quote.codigo} por ${formatCurrency(quote.total)}.`,
        url: `${window.location.origin}/cotizacion/${quote.codigo}`,
      },
      () => toast.success("Enlace de cotización copiado"),
    );
    if (shared) toast.success("Cotización lista para enviar");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (quotes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-lg font-semibold text-foreground">
          No hay cotizaciones
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Las cotizaciones creadas aparecerán aquí
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          Cotizaciones ({quotes.length})
        </h2>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-white">
        {/* Desktop table */}
        <div className="hidden md:block">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Código
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Fecha
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Cliente
                </th>
                <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Productos
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Total
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Acción
                </th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((q) => (
                <tr
                  key={q.id}
                  className="border-b border-border/50 transition-colors last:border-0 hover:bg-muted/20"
                >
                  <td className="px-5 py-3.5">
                    <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-sm font-bold text-primary">
                      {q.codigo}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground">
                    {new Date(q.fechaCreacion).toLocaleDateString("es-DO", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-foreground">
                    {q.cliente.nombre || "—"}
                  </td>
                  <td className="px-5 py-3.5 text-center text-sm font-medium text-foreground">
                    {q.productos.reduce((s, p) => s + p.cantidad, 0)}
                  </td>
                  <td className="px-5 py-3.5 text-right text-sm font-bold text-foreground">
                    {formatCurrency(q.total)}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="inline-flex items-center gap-1">
                      <a
                        href={`/cotizacion/${q.codigo}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Ver
                      </a>
                      <button
                        type="button"
                        onClick={() => handleSend(q)}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
                        title="Enviar cotización"
                      >
                        <Send className="h-3.5 w-3.5" />
                        Enviar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="space-y-0 divide-y divide-border md:hidden">
          {quotes.map((q) => (
            <a
              key={q.id}
              href={`/cotizacion/${q.codigo}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-4 py-3.5 transition-colors hover:bg-muted/20"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                    {q.codigo}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(q.fechaCreacion).toLocaleDateString("es-DO", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>
                <p className="mt-1 text-sm text-foreground">
                  {q.cliente.nombre || "Sin cliente"} ·{" "}
                  {q.productos.reduce((s, p) => s + p.cantidad, 0)} productos
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-foreground">
                  {formatCurrency(q.total)}
                </p>
                <ExternalLink className="ml-auto mt-1 h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
