import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { SettingsProvider } from "@/context/SettingsContext";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Europa Models - Catálogo",
  description: "Catálogo exclusivo de perfumes, ropa, relojes y accesorios.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Europa Models",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={inter.variable}>
      <head>
        <link rel="icon" type="image/jpeg" href="/icons/3d-europa.JPG" />
        <link rel="apple-touch-icon" href="/icons/3d-europa.JPG" />
      </head>
      <body className="antialiased">
        <SettingsProvider>
          <AuthProvider>
            <CartProvider>
              {children}
              <Toaster
                position="bottom-center"
                toastOptions={{
                  duration: 2000,
                  style: {
                    borderRadius: "1rem",
                    background: "#ffffff",
                    color: "#111827",
                    boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
                  },
                }}
              />
            </CartProvider>
          </AuthProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
