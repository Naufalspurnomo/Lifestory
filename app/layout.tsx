import "./globals.css";
import type { ReactNode } from "react";
import { Inter, Playfair_Display } from "next/font/google";
import { NavBar } from "../components/site/NavBar";
import { Footer } from "../components/site/Footer";
import { AuthProvider } from "../components/providers/AuthProvider";
import { LanguageProvider } from "../components/providers/LanguageProvider";
import { ScrollProgress } from "../components/ui/ScrollProgress";
import { BackToTop } from "../components/ui/BackToTop";
import { AppToaster } from "../components/ui/AppToaster";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

export const metadata = {
  title: "Lifestory",
  description: "Premium, secure family hub.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <body
        className={`${inter.variable} ${playfair.variable} min-h-screen bg-cream-100 text-ink-900 antialiased font-sans`}
      >
        <LanguageProvider>
          <AuthProvider>
            <ScrollProgress />
            <div className="flex min-h-screen flex-col">
              <NavBar />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
            <BackToTop />
            <AppToaster />
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
