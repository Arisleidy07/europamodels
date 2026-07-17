"use client";

import Link from "next/link";
import { useState, useRef, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowRight, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";
import { LicenseGuard } from "@/components/LicenseGuard";
import { cacheHomeVideos } from "@/lib/offlineCache";

const DEFAULT_VIDEOS = ["/videos/perfume1.mov", "/videos/perfume3.mov"];

export default function HomePage() {
  const { settings } = useSettings();
  const { user } = useAuth();

  const videos = useMemo(
    () =>
      settings.inicio.videos && settings.inicio.videos.length > 0
        ? settings.inicio.videos
        : settings.inicio.videoInicio
          ? [settings.inicio.videoInicio]
          : DEFAULT_VIDEOS,
    [settings.inicio.videoInicio, settings.inicio.videos],
  );
  const [current, setCurrent] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const failedVideos = useRef(0);
  const activeVideo = videos[current % videos.length];

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.load();
    void video.play().catch(() => undefined);
  }, [activeVideo]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void cacheHomeVideos(videos);
    }, 1500);
    return () => window.clearTimeout(timeout);
  }, [videos]);

  const showNextVideo = () => {
    setCurrent((prev) => (prev + 1) % videos.length);
  };

  const handleVideoError = () => {
    failedVideos.current += 1;
    if (failedVideos.current < videos.length) showNextVideo();
  };

  const handleVideoReady = () => {
    failedVideos.current = 0;
    void videoRef.current?.play();
  };

  return (
    <LicenseGuard>
      <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-black text-white">
        {/* Background video carousel */}
        <div className="absolute inset-0 z-0">
          <video
            ref={videoRef}
            key={activeVideo}
            autoPlay
            muted
            playsInline
            preload="auto"
            poster={settings.inicio.imagenRespaldo}
            onCanPlay={handleVideoReady}
            onEnded={showNextVideo}
            onError={handleVideoError}
            className="h-full w-full object-cover"
          >
            <source src={activeVideo} />
          </video>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
        </div>

        {/* Top bar */}
        <div className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between px-6 py-5 sm:px-10">
          <img
            src="/icons/europa-white.PNG"
            alt="Europa Models"
            className="h-16 w-auto drop-shadow-lg"
          />
          <Link
            href={user ? "/perfil" : "/login"}
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
          <img
            src="/icons/europa-white.PNG"
            alt="Europa Models"
            className="mb-6 h-24 w-auto drop-shadow-2xl sm:hidden"
          />
          <img
            src="/icons/europa-white.PNG"
            alt="Europa Models"
            className="mb-8 hidden h-32 w-auto drop-shadow-2xl sm:block lg:h-40"
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
