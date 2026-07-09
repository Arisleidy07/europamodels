"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface LogoProps {
  variant?: "horizontal" | "isotype";
  className?: string;
  height?: number;
}

export function Logo({ variant = "horizontal", className, height = 36 }: LogoProps) {
  const src = variant === "horizontal" ? "/icons/europamodels.PNG" : "/icons/europa.PNG";
  return (
    <img
      src={src}
      alt="Europa Models"
      className={cn("h-auto w-auto object-contain", className)}
      style={{ height }}
    />
  );
}
