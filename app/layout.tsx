import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { GameSessionProvider } from "@/lib/game/session-context";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "L'enigma di Bologna",
  description: "Gioco linguistico in italiano",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" className={cn("font-sans", geist.variable)}>
      <body>
        <GameSessionProvider>
          {children}
          <Toaster richColors position="top-center" />
        </GameSessionProvider>
      </body>
    </html>
  );
}
