"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { ArrowUpRight, MessageCircle, ShieldCheck, Sparkles, TreePine } from "lucide-react";

export function Footer() {
  const { data: session } = useSession();
  const isLoggedIn = Boolean(session?.user);
  const isAdmin = session?.user?.role === "admin";
  const isSubscribed = Boolean(session?.user?.subscriptionActive);

  return (
    <footer className="relative overflow-hidden border-t border-warmBorder bg-gradient-to-b from-white to-warm-50/75">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-0 top-0 h-40 w-40 rounded-full bg-gold-100/70 blur-3xl" />
        <div className="absolute right-0 top-10 h-44 w-44 rounded-full bg-accent-100/70 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.45 }}
          className="mb-10 rounded-3xl border border-warmBorder bg-white/75 p-6 backdrop-blur-sm"
        >
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-accent-700">
                <Sparkles className="h-3.5 w-3.5" />
                Lifestory Premium
              </p>
              <h3 className="font-serif text-2xl text-warmText">Warisan keluarga, dirancang untuk jangka panjang.</h3>
              <p className="max-w-xl text-sm text-warmMuted">
                Simpan momen, susun silsilah, dan kelola kolaborasi keluarga dalam satu pengalaman yang elegan.
              </p>
            </div>
            <Link
              href={isLoggedIn ? "/app" : "/auth/register"}
              className="inline-flex items-center gap-2 self-start rounded-full border border-warmBorder bg-white px-5 py-2.5 text-sm font-semibold text-accent-700 shadow-sm transition hover:border-accent-200 hover:bg-warm-50 md:self-center"
            >
              {isLoggedIn ? "Buka Aplikasi" : "Mulai Sekarang"}
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-4">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-warmBorder bg-white text-accent-700 shadow-sm">
                <TreePine className="h-4.5 w-4.5" />
              </span>
              <div>
                <p className="font-serif text-lg leading-none text-warmText">Lifestory</p>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-warmMuted">
                  Family Archive
                </p>
              </div>
            </div>
            <p className="text-sm text-warmMuted">Abadikan warisan keluarga dengan struktur, keamanan, dan pengalaman visual premium.</p>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-[0.1em] text-warmText">Navigasi</h4>
            <ul className="space-y-2 text-sm text-warmMuted">
              <li>
                <Link href="/" className="transition hover:text-accent-700">
                  Beranda
                </Link>
              </li>
              <li>
                <Link href="/gallery" className="transition hover:text-accent-700">
                  Galeri
                </Link>
              </li>
              <li>
                <Link href="/about" className="transition hover:text-accent-700">
                  Tentang
                </Link>
              </li>
              <li>
                <Link href="/contact" className="transition hover:text-accent-700">
                  Kontak
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-[0.1em] text-warmText">Akun</h4>
            <ul className="space-y-2 text-sm text-warmMuted">
              {!isLoggedIn && (
                <>
                  <li>
                    <Link href="/auth/login" className="transition hover:text-accent-700">
                      Masuk
                    </Link>
                  </li>
                  <li>
                    <Link href="/auth/register" className="transition hover:text-accent-700">
                      Daftar
                    </Link>
                  </li>
                </>
              )}

              {isLoggedIn && (
                <>
                  {isSubscribed && (
                    <li>
                      <Link href="/app" className="transition hover:text-accent-700">
                        Pohon Keluarga
                      </Link>
                    </li>
                  )}
                  <li>
                    <Link href="/subscribe" className="transition hover:text-accent-700">
                      {isSubscribed ? "Status Langganan" : "Berlangganan"}
                    </Link>
                  </li>
                  {isAdmin && (
                    <li>
                      <Link href="/dashboard" className="transition hover:text-accent-700">
                        Dashboard Admin
                      </Link>
                    </li>
                  )}
                </>
              )}
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-[0.1em] text-warmText">Bantuan</h4>
            <ul className="space-y-2 text-sm text-warmMuted">
              <li>
                <a
                  href="https://wa.me/6281234567890"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 transition hover:text-accent-700"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp Support
                </a>
              </li>
              <li>
                <Link href="/auth/forgot" className="transition hover:text-accent-700">
                  Lupa Password
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="inline-flex items-center gap-2 transition hover:text-accent-700">
                  <ShieldCheck className="h-4 w-4" />
                  Kebijakan Privasi
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-warmBorder pt-6 text-sm text-warmMuted md:flex-row md:items-center md:justify-between">
          <p>&copy; {new Date().getFullYear()} Lifestory. Hak cipta dilindungi.</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="transition hover:text-accent-700">
              Kebijakan Privasi
            </Link>
            <Link href="/terms" className="transition hover:text-accent-700">
              Syarat & Ketentuan
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

