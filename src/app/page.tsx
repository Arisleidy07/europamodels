"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, User, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";
import { LicenseGuard } from "@/components/LicenseGuard";

const DEFAULT_VIDEOS = [
  "/videos/perfume1.mov",
  "/videos/perfume2.mov",
  "/videos/perfume3.mov",
];

export default function HomePage() {
  const { settings } = useSettings();
  const { user, hasPermission } = useAuth();

  const videos: string[] =
    settings.inicio.videos && settings.inicio.videos.length > 0
      ? settings.inicio.videos
      : settings.inicio.videoInicio
        ? [settings.inicio.videoInicio]
        : DEFAULT_VIDEOS;

  const isAdmin =
    user?.rol === "administrador" ||
    hasPermission("productos", "crear") ||
    hasPermission("categorias", "crear");
  const [current, setCurrent] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.load();
    video.play().catch(() => {});
  }, [current]);

  const handleEnded = () => {
    setCurrent((prev) => (prev + 1) % videos.length);
  };

  return (
    <LicenseGuard>
      <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-black text-white">
        {/* Background video carousel */}
        <div className="absolute inset-0 z-0">
          <video
            ref={videoRef}
            key={videos[current]}
            autoPlay
            muted
            playsInline
            preload="auto"
            onEnded={handleEnded}
            className="h-full w-full object-cover"
          >
            <source src={videos[current]} type="video/mp4" />
            <source src={videos[current]} type="video/quicktime" />
          </video>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
        </div>

        {/* Top bar */}
        <div className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between px-6 py-5 sm:px-10">
          <img
            src="/icons/europa-white.PNG"
            alt="Europa Models"
            className="h-12 w-auto drop-shadow-lg"
          />
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Link
                href="/administracion"
                className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2.5 text-sm font-medium backdrop-blur-md transition-colors hover:bg-white/20"
              >
                <LayoutDashboard className="h-4 w-4" /> Admin
              </Link>
            )}
            <Link
              href={user ? "/perfil" : "/login"}
              className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2.5 text-sm font-medium backdrop-blur-md transition-colors hover:bg-white/20"
            >
              <User className="h-4 w-4" />
              {user ? user.nombre : "Iniciar sesión"}
            </Link>
          </div>
        </div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 flex flex-col items-center px-6 text-center"
        >
          <img
            src="/icons/europa-white.PNG"
            alt="Europa Models"
            className="mb-6 h-20 w-auto drop-shadow-2xl sm:hidden"
          />
          <img
            src="/icons/europa-white.PNG"
            alt="Europa Models"
            className="mb-8 hidden h-28 w-auto drop-shadow-2xl sm:block lg:h-32"
          />

          <h1 className="max-w-3xl text-3xl font-bold tracking-tight text-white drop-shadow-lg sm:text-4xl lg:text-5xl">
            {settings.inicio.tituloPrincipal || "Bienvenido a Europa Models"}
          </h1>
          <p className="mt-4 max-w-xl text-base font-light leading-relaxed text-white/90 sm:text-lg">
            {settings.inicio.subtitulo || "Tu catálogo exclusivo"}
          </p>

          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="mt-10"
          >
            <Link
              href="/catalogo"
              className="group inline-flex items-center gap-3 rounded-full bg-white px-8 py-4 text-lg font-semibold text-black shadow-2xl transition-all hover:bg-gray-100"
            >
              {settings.inicio.textoBoton || "Ver catálogo"}
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </motion.div>
      </main>
    </LicenseGuard>
  );
}
