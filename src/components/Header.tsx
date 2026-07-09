"use client";

import React from "react";
import Link from "next/link";
import {
  ShoppingCart,
  User,
  Menu,
  Wifi,
  WifiOff,
  LayoutDashboard,
} from "lucide-react";
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
    <header className="sticky top-0 z-40 w-full border-b border-border bg-white/90 backdrop-blur-md">
      <div className="flex h-[72px] items-center gap-3 px-4 lg:px-8">
        {showMenu && (
          <button
            onClick={onOpenMenu}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-foreground transition-colors hover:bg-muted lg:hidden"
            aria-label="Menú"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        <Link href="/catalogo" className="flex shrink-0 items-center">
          <Logo variant="horizontal" height={32} />
        </Link>

        {onSearchChange && (
          <div className="mx-4 hidden flex-1 md:block">
            <SearchBar value={search} onChange={onSearchChange} />
          </div>
        )}

        <div className="ml-auto flex items-center gap-2 sm:gap-4">
          <div className="hidden items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground sm:flex">
            {online ? (
              <Wifi className="h-3.5 w-3.5 text-success" />
            ) : (
              <WifiOff className="h-3.5 w-3.5 text-warning" />
            )}
            {online ? "Sincronizado" : "Sin conexión"}
          </div>

          <button
            onClick={onOpenCart}
            className="relative flex h-11 w-11 items-center justify-center rounded-xl text-foreground transition-colors hover:bg-muted"
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
              className="hidden items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90 sm:flex"
            >
              <LayoutDashboard className="h-4 w-4" />
              Admin
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
