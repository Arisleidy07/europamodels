"use client";

import React from "react";
import Link from "next/link";
import { ShoppingCart, User, WifiOff, LayoutDashboard } from "lucide-react";
import { SearchBar } from "@/components/SearchBar";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { cn, getInitials } from "@/lib/utils";

interface HeaderProps {
  search?: string;
  onSearchChange?: (value: string) => void;
  onOpenCart?: () => void;
  onOpenMenu?: () => void;
  showMenu?: boolean;
}

export function Header({
  search = "",
  onSearchChange,
  onOpenCart,
  onOpenMenu,
  showMenu = true,
}: HeaderProps) {
  const { user, hasPermission } = useAuth();
  const { totalItems } = useCart();
  const online = useOnlineStatus();

  const isAdmin =
    user?.rol === "administrador" ||
    hasPermission("productos", "crear") ||
    hasPermission("categorias", "crear") ||
    hasPermission("marcas", "crear") ||
    hasPermission("configuracion", "editar");

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-white/95 backdrop-blur-md">
      <div className="flex h-[72px] items-center gap-4 px-4 lg:px-8">
        {/* Left: Logo */}
        <Link href="/" className="flex shrink-0 items-center">
          <Logo variant="horizontal" height={44} className="hidden sm:block" />
          <Logo variant="isotype" height={40} className="sm:hidden" />
        </Link>

        {/* Center: Search (main element) */}
        {onSearchChange && (
          <div className="min-w-0 flex-1">
            <SearchBar value={search} onChange={onSearchChange} />
          </div>
        )}

        {/* Right: Actions */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {!online && (
            <div className="hidden items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 sm:flex">
              <WifiOff className="h-3.5 w-3.5" />
              Sin conexión
            </div>
          )}

          <button
            onClick={onOpenCart}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl text-foreground transition-colors hover:bg-muted"
            aria-label="Carrito"
          >
            <ShoppingCart className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-primary px-1 text-xs font-bold text-white">
                {totalItems}
              </span>
            )}
          </button>

          {isAdmin && (
            <Link
              href="/administracion"
              className="flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90 sm:px-4"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          )}

          <Link
            href={user ? "/perfil" : "/login"}
            className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-muted text-foreground transition-colors hover:bg-gray-200"
          >
            {user?.foto ? (
              <img
                src={user.foto}
                alt={user.nombre}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-xs font-semibold">
                {user ? getInitials(user.nombre) : <User className="h-5 w-5" />}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
