import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "Centro de Estética y Peluquería Keroal | Reserva tu Cita",
  description:
    "Reserva tu cita online en Centro de Estética y Peluquería Keroal. Corte, coloración, balayage, tratamientos y más. Tu belleza, nuestra pasión.",
  keywords: ["peluquería", "estética", "Keroal", "reserva cita", "corte", "balayage", "coloración"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.variable} ${outfit.variable} font-sans`}>
        {children}
      </body>
    </html>
  );
}
