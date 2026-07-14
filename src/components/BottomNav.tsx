"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Home,
  BookOpen,
  ShoppingCart,
  User,
  LayoutDashboard,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();
  const { user, hasPermission } = useAuth();
  const { totalItems, openCartDrawer } = useCart();

  const isAdmin =
    user?.rol === "administrador" ||
    hasPermission("productos", "crear") ||
    hasPermission("categorias", "crear") ||
    hasPermission("marcas", "crear") ||
    hasPermission("configuracion", "editar");

  const navItems = [
    { href: "/", label: "Inicio", icon: Home },
    { href: "/catalogo", label: "Catálogo", icon: BookOpen },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 flex h-16 border-t border-border bg-white/97 backdrop-blur-lg sm:hidden">
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-1 flex-col items-center justify-center gap-0.5 py-1 text-[10px] font-medium transition-colors"
          >
            <motion.div
              animate={{ scale: active ? 1.15 : 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <Icon
                className={cn(
                  "h-[22px] w-[22px]",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              />
            </motion.div>
            <span className={active ? "text-primary" : "text-muted-foreground"}>
              {label}
            </span>
          </Link>
        );
      })}

      {/* Cart */}
      <button
        onClick={openCartDrawer}
        className="relative flex flex-1 flex-col items-center justify-center gap-0.5 py-1 text-[10px] font-medium text-muted-foreground transition-colors"
      >
        <div className="relative">
          <ShoppingCart className="h-[22px] w-[22px]" />
          {totalItems > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-0.5 text-[9px] font-bold text-white"
            >
              {totalItems > 99 ? "99+" : totalItems}
            </motion.span>
          )}
        </div>
        Carrito
      </button>

      {/* Profile */}
      <Link
        href={user ? "/perfil" : "/login"}
        className="flex flex-1 flex-col items-center justify-center gap-0.5 py-1 text-[10px] font-medium transition-colors"
      >
        <motion.div
          animate={{
            scale: pathname === "/perfil" || pathname === "/login" ? 1.15 : 1,
          }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
        >
          <User
            className={cn(
              "h-[22px] w-[22px]",
              pathname === "/perfil" || pathname === "/login"
                ? "text-primary"
                : "text-muted-foreground",
            )}
          />
        </motion.div>
        <span
          className={
            pathname === "/perfil" || pathname === "/login"
              ? "text-primary"
              : "text-muted-foreground"
          }
        >
          {user ? "Perfil" : "Entrar"}
        </span>
      </Link>

      {/* Admin — only for admins */}
      {isAdmin && (
        <Link
          href="/administracion"
          className="flex flex-1 flex-col items-center justify-center gap-0.5 py-1 text-[10px] font-medium transition-colors"
        >
          <motion.div
            animate={{ scale: pathname === "/administracion" ? 1.15 : 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <LayoutDashboard
              className={cn(
                "h-[22px] w-[22px]",
                pathname === "/administracion"
                  ? "text-primary"
                  : "text-muted-foreground",
              )}
            />
          </motion.div>
          <span
            className={
              pathname === "/administracion"
                ? "text-primary"
                : "text-muted-foreground"
            }
          >
            Admin
          </span>
        </Link>
      )}
    </nav>
  );
}
