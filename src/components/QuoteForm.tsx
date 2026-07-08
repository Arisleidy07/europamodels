"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { createQuote } from "@/lib/quotes";
import { formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";
import type { QuoteClient, Quote } from "@/types";

interface QuoteFormProps {
  open: boolean;
  onClose: () => void;
  onQuoteCreated: (quote: Quote) => void;
}

export function QuoteForm({ open, onClose, onQuoteCreated }: QuoteFormProps) {
  const { items, totalAmount, clearCart } = useCart();
  const { user } = useAuth();
  const { settings } = useSettings();
  const online = useOnlineStatus();
  const [loading, setLoading] = useState(false);
  const [client, setClient] = useState<QuoteClient>({
    nombre: "",
    telefono: "",
    correo: "",
    empresa: "",
    notas: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Debes iniciar sesión para crear cotizaciones");
      return;
    }
    if (items.length === 0) {
      toast.error("Agrega productos antes de continuar");
      return;
    }

    setLoading(true);
    try {
      const quote = await createQuote(items, client, user.id, settings, online);
      onQuoteCreated(quote);
      clearCart();
    } catch (err: any) {
      toast.error(err.message || "Error al crear cotización");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-y-0 right-0 z-[60] w-full max-w-lg bg-white shadow-2xl"
          >
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <h2 className="text-lg font-semibold">Crear cotización</h2>
                <button onClick={onClose} className="rounded-full p-2 transition-colors hover:bg-muted">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex h-full flex-col">
                <div className="flex-1 space-y-5 overflow-y-auto p-6">
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      Información del cliente
                    </h3>
                    <p className="text-xs text-muted-foreground">Opcional</p>
                  </div>

                  <Input
                    label="Nombre del cliente"
                    value={client.nombre}
                    onChange={(e) => setClient({ ...client, nombre: e.target.value })}
                    placeholder="Ej. Juan Pérez"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Teléfono"
                      value={client.telefono}
                      onChange={(e) => setClient({ ...client, telefono: e.target.value })}
                      placeholder="Ej. 809-000-0000"
                    />
                    <Input
                      label="Correo"
                      type="email"
                      value={client.correo}
                      onChange={(e) => setClient({ ...client, correo: e.target.value })}
                      placeholder="Ej. cliente@email.com"
                    />
                  </div>
                  <Input
                    label="Empresa"
                    value={client.empresa}
                    onChange={(e) => setClient({ ...client, empresa: e.target.value })}
                    placeholder="Opcional"
                  />
                  <Input
                    label="Notas"
                    value={client.notas}
                    onChange={(e) => setClient({ ...client, notas: e.target.value })}
                    placeholder="Observaciones adicionales"
                  />

                  <div className="rounded-2xl bg-muted/50 p-4">
                    <h4 className="text-sm font-semibold text-foreground">Resumen</h4>
                    <div className="mt-2 flex items-center justify-between text-base">
                      <span className="text-muted-foreground">Productos</span>
                      <span className="font-medium text-foreground">{items.reduce((s, i) => s + i.cantidad, 0)}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-lg font-bold text-foreground">
                      <span>Total</span>
                      <span>{formatCurrency(totalAmount)}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border p-6">
                  <Button type="submit" size="lg" className="w-full" loading={loading} disabled={items.length === 0}>
                    {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                    Generar cotización
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
