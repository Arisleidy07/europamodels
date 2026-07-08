"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";
import { LicenseGuard } from "@/components/LicenseGuard";

export default function HomePage() {
  const { settings } = useSettings();
  const { user } = useAuth();

  const videoUrl = settings.inicio.videoInicio;
  const backgroundImage = settings.inicio.imagenRespaldo || "/hero-fallback.jpg";

  return (
    <LicenseGuard>
      <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-black text-white">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          {videoUrl ? (
            <video
              autoPlay
              muted
              loop
              playsInline
              poster={backgroundImage}
              className="h-full w-full object-cover"
            >
              <source src={videoUrl} type="video/mp4" />
            </video>
          ) : (
            <img src={backgroundImage} alt="" className="h-full w-full object-cover" />
          )}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
        </div>

        {/* Top bar */}
        <div className="absolute right-4 top-4 z-20 sm:right-8 sm:top-6">
          <Link
            href={user ? "/administracion" : "/login"}
            className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2.5 text-sm font-medium backdrop-blur-md transition-colors hover:bg-white/20"
          >
            <User className="h-4 w-4" />
            {user ? user.nombre : "Iniciar sesión"}
          </Link>
        </div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 flex flex-col items-center px-6 text-center"
        >
          {settings.empresa.logo ? (
            <img
              src={settings.empresa.logo}
              alt={settings.empresa.nombre}
              className="h-24 w-auto object-contain drop-shadow-2xl sm:h-32"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-white text-3xl font-bold text-black shadow-2xl sm:h-32 sm:w-32 sm:text-4xl">
              EM
            </div>
          )}

          <h1 className="mt-8 text-4xl font-bold tracking-tight sm:text-6xl">
            {settings.empresa.nombre}
          </h1>
          <p className="mt-4 max-w-xl text-lg font-light leading-relaxed text-white/90 sm:text-xl">
            {settings.inicio.tituloPrincipal || settings.empresa.descripcion}
          </p>

          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="mt-10">
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
