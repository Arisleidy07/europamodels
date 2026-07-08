"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus, Trash2, FileText } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/context/CartContext";
import { formatCurrency } from "@/lib/utils";
import type { CartItem } from "@/types";

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  onCreateQuote: () => void;
}

function CartItemRow({ item }: { item: CartItem }) {
  const { updateQuantity, removeFromCart } = useCart();

  return (
    <div className="flex gap-4 rounded-2xl border border-border bg-muted/30 p-3">
      <img
        src={item.imagen || "/placeholder-product.svg"}
        alt={item.nombre}
        className="h-20 w-20 rounded-xl object-cover"
      />
      <div className="flex flex-1 flex-col justify-between">
        <div>
          <h4 className="line-clamp-1 font-semibold text-foreground">{item.nombre}</h4>
          <p className="text-sm text-muted-foreground">{formatCurrency(item.precio)}</p>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-white p-1">
            <button
              onClick={() => updateQuantity(item.productoId, item.cantidad - 1)}
              className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-muted"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-6 text-center text-sm font-medium">{item.cantidad}</span>
            <button
              onClick={() => updateQuantity(item.productoId, item.cantidad + 1)}
              className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-muted"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={() => removeFromCart(item.productoId)}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-red-50 hover:text-danger"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function CartDrawer({ open, onClose, onCreateQuote }: CartDrawerProps) {
  const { items, totalAmount, clearCart } = useCart();

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl"
          >
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <h2 className="text-lg font-semibold">Selección ({items.length})</h2>
                <button onClick={onClose} className="rounded-full p-2 transition-colors hover:bg-muted">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {items.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    <FileText className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <p className="mt-4 text-lg font-medium text-foreground">No hay productos seleccionados</p>
                  <p className="mt-1 text-sm text-muted-foreground">Agrega productos para crear una cotización.</p>
                </div>
              ) : (
                <>
                  <div className="flex-1 space-y-4 overflow-y-auto p-6">
                    {items.map((item) => (
                      <CartItemRow key={item.productoId} item={item} />
                    ))}
                  </div>

                  <div className="border-t border-border p-6">
                    <div className="flex items-center justify-between text-base">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-semibold text-foreground">{formatCurrency(totalAmount)}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xl font-bold text-foreground">
                      <span>Total</span>
                      <span>{formatCurrency(totalAmount)}</span>
                    </div>

                    <Button size="lg" className="mt-5 w-full" onClick={onCreateQuote}>
                      <FileText className="mr-2 h-5 w-5" /> Crear cotización
                    </Button>
                    <div className="mt-3 flex gap-3">
                      <Button variant="outline" className="flex-1" onClick={clearCart}>
                        Vaciar
                      </Button>
                      <Button variant="ghost" className="flex-1" onClick={onClose}>
                        Cerrar
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
