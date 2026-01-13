import "./globals.css";
import type { ReactNode } from "react";
import { Inter, Playfair_Display } from "next/font/google";
import { NavBar } from "../components/site/NavBar";
import { Footer } from "../components/site/Footer";
import { AuthProvider } from "../components/providers/AuthProvider";

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
    <html lang="en">
      <body
        className={`${inter.variable} ${playfair.variable} min-h-screen bg-[#faf8f5] text-slate-900 antialiased font-sans`}
      >
        <AuthProvider>
          <div className="flex min-h-screen flex-col">
            <NavBar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
