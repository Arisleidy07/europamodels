"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShoppingCart,
  User,
  WifiOff,
  Home,
  BookOpen,
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
  onSelectProduct?: (product: import("@/types").ProductWithRelations) => void;
}

export function Header({
  search = "",
  onSearchChange,
  onOpenCart,
  onSelectProduct,
}: HeaderProps) {
  const pathname = usePathname();
  const { user, hasPermission } = useAuth();
  const { totalItems } = useCart();
  const online = useOnlineStatus();

  const isAdmin =
    user?.rol === "administrador" ||
    hasPermission("productos", "crear") ||
    hasPermission("categorias", "crear") ||
    hasPermission("marcas", "crear") ||
    hasPermission("configuracion", "editar");

  const navLinks = [
    { href: "/", label: "Inicio", icon: Home, show: true },
    { href: "/catalogo", label: "Catálogo", icon: BookOpen, show: true },
    {
      href: "/administracion",
      label: "Admin",
      icon: LayoutDashboard,
      show: isAdmin,
    },
  ].filter((l) => l.show);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-white/95 backdrop-blur-md">
      <div className="flex h-16 items-center gap-2 px-3 sm:h-[72px] sm:gap-3 sm:px-4 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center">
          <Logo variant="horizontal" height={52} className="hidden sm:block" />
          <Logo variant="isotype" height={44} className="sm:hidden" />
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden items-center gap-1 sm:flex">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Search — always visible, grows to fill */}
        {onSearchChange ? (
          <div className="min-w-0 flex-1">
            <SearchBar
              value={search}
              onChange={onSearchChange}
              onSelectProduct={onSelectProduct}
            />
          </div>
        ) : (
          <div className="flex-1" />
        )}

        {/* Desktop right actions — hidden on mobile (use BottomNav) */}
        <div className="hidden shrink-0 items-center gap-1.5 sm:flex sm:gap-2">
          {!online && (
            <div className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700">
              <WifiOff className="h-3.5 w-3.5" />
              Offline
            </div>
          )}

          {/* Cart */}
          {onOpenCart && (
            <button
              onClick={onOpenCart}
              className="relative flex h-9 w-9 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-muted"
              aria-label="Carrito"
            >
              <ShoppingCart className="h-[18px] w-[18px]" />
              {totalItems > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                  {totalItems}
                </span>
              )}
            </button>
          )}

          {/* Profile */}
          <Link
            href={user ? "/perfil" : "/login"}
            className={cn(
              "flex h-9 w-9 items-center justify-center overflow-hidden rounded-full transition-colors",
              pathname === "/perfil"
                ? "ring-2 ring-primary ring-offset-1"
                : "bg-muted hover:bg-gray-200",
            )}
          >
            {user?.foto ? (
              <img
                src={user.foto}
                alt={user.nombre}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-xs font-semibold text-foreground">
                {user ? getInitials(user.nombre) : <User className="h-4 w-4" />}
              </span>
            )}
          </Link>
        </div>

        {/* Mobile offline indicator only */}
        {!online && (
          <div className="flex items-center sm:hidden">
            <WifiOff className="h-4 w-4 text-amber-500" />
          </div>
        )}
      </div>
    </header>
  );
}
