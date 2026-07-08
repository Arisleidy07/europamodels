"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "success" | "danger" | "warning" | "info" | "default";
}

export function Badge({ children, variant = "default", className, ...props }: BadgeProps) {
  const variants = {
    success: "bg-green-50 text-success border border-green-100",
    danger: "bg-red-50 text-danger border border-red-100",
    warning: "bg-amber-50 text-warning border border-amber-100",
    info: "bg-blue-50 text-primary border border-blue-100",
    default: "bg-muted text-muted-foreground border border-border",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
