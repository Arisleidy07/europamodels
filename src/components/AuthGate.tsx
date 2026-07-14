"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { ForcePasswordChange } from "@/components/ForcePasswordChange";
import { BottomNav } from "@/components/BottomNav";
import { CartDrawer } from "@/components/CartDrawer";
import { QuoteForm } from "@/components/QuoteForm";
import { useSettings } from "@/context/SettingsContext";
import toast from "react-hot-toast";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, requiresPasswordChange, loading } = useAuth();
  const { cartDrawerOpen, closeCartDrawer } = useCart();
  const { settings } = useSettings();
  const [quoteFormOpen, setQuoteFormOpen] = useState(false);

  if (loading) return null;

  if (user && requiresPasswordChange) {
    return <ForcePasswordChange />;
  }

  const handleQuoteCreated = (quote: { codigo: string; id: string }) => {
    setQuoteFormOpen(false);
    closeCartDrawer();
    toast.success(`Cotización ${quote.codigo} creada`);
    setTimeout(() => {
      const url = `${window.location.origin}/cotizacion/${quote.codigo}`;
      const text = `${settings.cotizaciones.mensajeAutomatico}\n\nCotización: ${quote.codigo}\n${url}`;
      if (navigator.share) {
        navigator.share({ title: `Cotización ${quote.codigo}`, text, url });
      } else {
        navigator.clipboard.writeText(text);
        toast.success("Enlace copiado");
      }
    }, 600);
  };

  return (
    <>
      <div className="pb-16 sm:pb-0">{children}</div>
      <BottomNav />
      <CartDrawer
        open={cartDrawerOpen}
        onClose={closeCartDrawer}
        onCreateQuote={() => setQuoteFormOpen(true)}
      />
      <QuoteForm
        open={quoteFormOpen}
        onClose={() => setQuoteFormOpen(false)}
        onQuoteCreated={(q) =>
          handleQuoteCreated({ codigo: q.codigo, id: q.id })
        }
      />
    </>
  );
}
