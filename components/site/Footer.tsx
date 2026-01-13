"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

export function Footer() {
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;
  const isAdmin = session?.user?.role === "admin";
  const isSubscribed = session?.user?.subscriptionActive;

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">🌳</span>
              <span className="font-semibold text-forest-700">Lifestory</span>
            </div>
            <p className="text-sm text-slate-600">
              Abadikan warisan keluarga Anda dengan aman.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-slate-900">
              Navigasi
            </h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <Link href="/" className="hover:text-forest-700">
                  Beranda
                </Link>
              </li>
              <li>
                <Link href="/gallery" className="hover:text-forest-700">
                  Galeri
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-forest-700">
                  Tentang
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-forest-700">
                  Kontak
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-slate-900">Akun</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              {!isLoggedIn && (
                <>
                  <li>
                    <Link href="/auth/login" className="hover:text-forest-700">
                      Masuk
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/auth/register"
                      className="hover:text-forest-700"
                    >
                      Daftar
                    </Link>
                  </li>
                </>
              )}
              {isLoggedIn && (
                <>
                  {isSubscribed && (
                    <li>
                      <Link href="/app" className="hover:text-forest-700">
                        Pohon Keluarga
                      </Link>
                    </li>
                  )}
                  <li>
                    <Link href="/subscribe" className="hover:text-forest-700">
                      {isSubscribed ? "Status Langganan" : "Berlangganan"}
                    </Link>
                  </li>
                  {isAdmin && (
                    <li>
                      <Link href="/dashboard" className="hover:text-forest-700">
                        Dashboard Admin
                      </Link>
                    </li>
                  )}
                </>
              )}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-slate-900">
              Bantuan
            </h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <a
                  href="https://wa.me/6281234567890"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-forest-700"
                >
                  WhatsApp Support
                </a>
              </li>
              <li>
                <Link href="/auth/forgot" className="hover:text-forest-700">
                  Lupa Password
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 flex flex-col gap-3 border-t border-slate-100 pt-6 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Lifestory. Hak cipta dilindungi.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-slate-700">
              Kebijakan Privasi
            </Link>
            <Link href="/terms" className="hover:text-slate-700">
              Syarat & Ketentuan
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
