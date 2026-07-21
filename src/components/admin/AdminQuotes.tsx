"use client";

import React, { useMemo, useState } from "react";
import { useCatalogData } from "@/hooks/useCatalogData";
import { formatCurrency, shareContent, normalizeText } from "@/lib/utils";
import {
  FileText,
  ExternalLink,
  Loader2,
  Send,
  Search,
  Calendar,
  Package,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import toast from "react-hot-toast";
import type { Quote, QuoteStatus } from "@/types";

const statusLabels: Record<QuoteStatus, string> = {
  creada: "Creada",
  enviada: "Enviada",
  vista: "Vista",
  aceptada: "Aceptada",
  rechazada: "Rechazada",
  completada: "Completada",
  pendiente: "Pendiente",
};

const statusStyles: Record<QuoteStatus, string> = {
  creada: "bg-blue-50 text-blue-700 ring-blue-700/10",
  enviada: "bg-purple-50 text-purple-700 ring-purple-700/10",
  vista: "bg-amber-50 text-amber-700 ring-amber-700/10",
  aceptada: "bg-green-50 text-green-700 ring-green-700/10",
  rechazada: "bg-red-50 text-red-700 ring-red-700/10",
  completada: "bg-emerald-50 text-emerald-700 ring-emerald-700/10",
  pendiente: "bg-gray-50 text-gray-700 ring-gray-700/10",
};

function QuoteStatusBadge({ status }: { status: QuoteStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${statusStyles[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}

export default function AdminQuotes() {
  const { quotes, loading } = useCatalogData();
  const [search, setSearch] = useState("");

  const handleSend = async (quote: Quote, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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

  const filtered = useMemo(() => {
    const term = normalizeText(search);
    if (!term) return quotes;
    return quotes.filter(
      (q) =>
        normalizeText(q.codigo).includes(term) ||
        normalizeText(q.cliente.nombre || "").includes(term) ||
        normalizeText(q.cliente.empresa || "").includes(term),
    );
  }, [quotes, search]);

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
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Cotizaciones
          </h2>
          <p className="text-sm text-muted-foreground">
            {filtered.length} de {quotes.length} cotizaciones
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar cotización..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-border bg-white p-8 text-center text-muted-foreground">
          No se encontraron cotizaciones para "{search}"
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((q) => {
            const totalItems = q.productos.reduce((s, p) => s + p.cantidad, 0);
            const openQuote = () =>
              window.open(
                `/cotizacion/${q.codigo}`,
                "_blank",
                "noopener,noreferrer",
              );
            return (
              <div
                key={q.id}
                onClick={openQuote}
                className="group flex cursor-pointer flex-col rounded-2xl border border-border bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Cotización
                    </p>
                    <p className="text-xl font-bold text-foreground">
                      {q.codigo}
                    </p>
                  </div>
                  <QuoteStatusBadge status={q.estado} />
                </div>

                <div className="mb-4 space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {new Date(q.fechaCreacion).toLocaleDateString("es-DO", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                  <div className="flex items-center gap-2 text-foreground">
                    <User className="h-4 w-4 text-muted-foreground" />
                    {q.cliente.nombre || q.cliente.empresa || "Sin cliente"}
                  </div>
                  <div className="flex items-center gap-2 text-foreground">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    {totalItems} producto{totalItems !== 1 ? "s" : ""}
                  </div>
                </div>

                <div className="mt-auto flex items-center justify-between border-t border-border pt-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="text-lg font-bold text-foreground">
                      {formatCurrency(q.total)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={(e) => handleSend(q, e)}
                      title="Enviar cotización"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        openQuote();
                      }}
                      title="Ver cotización"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
