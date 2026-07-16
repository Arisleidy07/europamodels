"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/context/AuthContext";
import { getAuthErrorMessage, validateEmail } from "@/lib/authErrors";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [formError, setFormError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedEmail = email.trim();
    const nextEmailError = validateEmail(normalizedEmail) || "";
    const nextPasswordError = password ? "" : "Escribe tu contraseña.";

    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    setFormError("");

    if (nextEmailError || nextPasswordError) return;

    setLoading(true);
    try {
      await login(normalizedEmail, password);
      toast.success("Bienvenido");
      router.push("/");
    } catch (error: unknown) {
      const message = getAuthErrorMessage(error);
      const code =
        typeof error === "object" && error !== null && "code" in error
          ? String(error.code)
          : "";

      if (code === "auth/invalid-email" || code === "auth/missing-email") {
        setEmailError(message);
      } else if (
        code === "auth/missing-password" ||
        code === "auth/invalid-credential" ||
        code === "auth/user-not-found" ||
        code === "auth/wrong-password"
      ) {
        setPasswordError(message);
      } else {
        setFormError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl"
      >
        <div className="mb-8 text-center">
          <Logo variant="horizontal" height={64} className="mx-auto" />
          <h1 className="mt-5 text-2xl font-bold text-foreground">
            Iniciar sesión
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Acceso para el equipo de Europa Models
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <Input
            label="Correo electrónico"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailError) setEmailError("");
              if (formError) setFormError("");
            }}
            onBlur={() => setEmailError(validateEmail(email) || "")}
            error={emailError}
            placeholder="tu@europamodels.com"
            autoComplete="email"
            required
          />
          <div className="relative">
            <Input
              label="Contraseña"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordError) setPasswordError("");
                if (formError) setFormError("");
              }}
              error={passwordError}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[2.1rem] text-muted-foreground"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>

          {formError && (
            <p
              className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger"
              role="alert"
            >
              {formError}
            </p>
          )}

          <Button type="submit" size="lg" className="w-full" loading={loading}>
            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
            Entrar
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          ¿No tienes cuenta? Contacta al administrador.
        </p>
        <Link
          href="/"
          className="mt-4 block text-center text-sm font-medium text-primary hover:underline"
        >
          Volver al inicio
        </Link>
      </motion.div>
    </main>
  );
}
