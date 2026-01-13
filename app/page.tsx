"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "../components/ui/Button";
import { motion, Variants } from "framer-motion";
// IMPORT ICON MODERN
import {
  TreeDeciduous,
  ShieldCheck,
  Images,
  Users,
  User,
  UserCheck,
  Crown,
} from "lucide-react";

// Update Data Features dengan Komponen Icon - Luxury Warm Theme
const features = [
  {
    icon: <TreeDeciduous className="w-6 h-6 text-gold-600" />,
    title: "Interaktif",
    text: "Zoom & pan pohon silsilah tanpa batas",
  },
  {
    icon: <ShieldCheck className="w-6 h-6 text-gold-600" />,
    title: "Privasi",
    text: "Arsip pribadi terenkripsi aman",
  },
  {
    icon: <Images className="w-6 h-6 text-gold-600" />,
    title: "Galeri",
    text: "Simpan foto warisan keluarga",
  },
  {
    icon: <Users className="w-6 h-6 text-gold-600" />,
    title: "Kolaborasi",
    text: "Undang kerabat untuk berkontribusi",
  },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.3 },
  },
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 50 } },
};

export default function HomePage() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const isLoggedIn = status === "authenticated";
  const isSubscribed = user?.subscriptionActive;
  const isAdmin = user?.role === "admin";

  return (
    <div className="min-h-screen bg-warm-50 text-warmText selection:bg-gold-100 selection:text-gold-900 overflow-hidden">
      {/* Background decoration */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <motion.div
          animate={{ y: [0, -20, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 8, repeat: Infinity, repeatType: "reverse" }}
          className="absolute top-0 right-0 -mr-20 -mt-20 h-[500px] w-[500px] rounded-full bg-gold-50 blur-3xl opacity-60"
        />
        <motion.div
          animate={{ y: [0, 30, 0], scale: [1, 1.1, 1] }}
          transition={{
            duration: 10,
            repeat: Infinity,
            repeatType: "reverse",
            delay: 1,
          }}
          className="absolute bottom-0 left-0 -ml-20 -mb-20 h-[400px] w-[400px] rounded-full bg-warm-100 blur-3xl opacity-60"
        />
      </div>

      <main className="relative z-10">
        <section className="mx-auto max-w-7xl px-6 pt-20 pb-16 lg:pt-32">
          <div className="flex flex-col lg:flex-row lg:items-center lg:gap-20">
            {/* LEFT CONTENT */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="flex-1 space-y-8 text-center lg:text-left"
            >
              <motion.div
                variants={itemVariants}
                className="inline-flex items-center gap-2 rounded-full border border-gold-200 bg-gold-50/50 px-3 py-1 backdrop-blur-sm"
              >
                <span className="flex h-2 w-2 rounded-full bg-gold-500 animate-pulse"></span>
                <span className="text-xs font-bold uppercase tracking-widest text-gold-700">
                  Lifestory Early Access
                </span>
              </motion.div>

              <motion.h1
                variants={itemVariants}
                className="text-5xl font-extrabold leading-[1.1] tracking-tight text-warmText md:text-6xl lg:text-7xl"
              >
                Warisan digital <br />
                <span className="bg-gradient-to-r from-gold-600 to-gold-400 bg-clip-text text-transparent">
                  keluarga anda.
                </span>
              </motion.h1>

              <motion.p
                variants={itemVariants}
                className="mx-auto max-w-2xl text-lg leading-relaxed text-warmMuted lg:mx-0 lg:text-xl"
              >
                Lebih dari sekadar silsilah. Abadikan kenangan, jelajahi koneksi
                antargenerasi, dan simpan arsip sejarah dalam brankas digital
                yang aman.
              </motion.p>

              {/* CTAs */}
              <motion.div
                variants={itemVariants}
                className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-start"
              >
                {status === "loading" && (
                  <div className="h-12 w-40 animate-pulse rounded-xl bg-warm-200" />
                )}

                {status === "unauthenticated" && (
                  <>
                    <Link href="/auth/register" className="w-full sm:w-auto">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button className="w-full h-12 px-8 text-base shadow-lg shadow-gold-200/50 bg-gold-700 hover:bg-gold-800 text-white rounded-xl">
                          Mulai Gratis
                        </Button>
                      </motion.div>
                    </Link>
                    <Link href="/auth/login" className="w-full sm:w-auto">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          variant="ghost"
                          className="w-full h-12 px-8 text-base text-warmMuted hover:bg-warm-100 rounded-xl hover:text-warmText"
                        >
                          Masuk Akun
                        </Button>
                      </motion.div>
                    </Link>
                  </>
                )}

                {isLoggedIn && !isSubscribed && (
                  <div className="flex flex-col gap-3 w-full sm:w-auto">
                    <Link href="/subscribe">
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button className="w-full h-12 px-8 bg-gold-700 text-white rounded-xl shadow-lg shadow-gold-100 hover:bg-gold-800 flex items-center justify-center gap-2">
                          <Crown className="w-4 h-4" /> Aktifkan Premium
                        </Button>
                      </motion.div>
                    </Link>
                    <p className="text-xs text-warmMuted text-center lg:text-left font-medium">
                      👋 Halo, {user?.name}. Mulai perjalanan sejarahmu.
                    </p>
                  </div>
                )}

                {isLoggedIn && isSubscribed && (
                  <div className="flex flex-col gap-4 w-full sm:w-auto">
                    <div className="flex gap-3">
                      <Link href="/app">
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Button className="h-12 px-8 bg-gold-700 text-white rounded-xl shadow-lg shadow-gold-200 hover:bg-gold-800">
                            Buka Pohon Keluarga
                          </Button>
                        </motion.div>
                      </Link>
                      {isAdmin && (
                        <Link href="/dashboard">
                          <Button
                            variant="secondary"
                            className="h-12 px-6 border border-warm-200 bg-white text-warmMuted hover:bg-warm-100 rounded-xl"
                          >
                            Admin
                          </Button>
                        </Link>
                      )}
                    </div>
                    <p className="text-sm font-medium text-gold-700 flex items-center gap-2 justify-center lg:justify-start">
                      <span className="inline-block w-2 h-2 rounded-full bg-gold-500" />
                      Selamat datang kembali, {user?.name}
                    </p>
                  </div>
                )}
              </motion.div>

              {/* FEATURES WITH LUCIDE ICONS */}
              <motion.div variants={itemVariants} className="pt-6">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-2">
                  {features.map((item) => (
                    <motion.div
                      key={item.title}
                      whileHover={{ y: -5, backgroundColor: "#FFFFFF" }}
                      className="flex items-start gap-3 rounded-xl border border-warm-200 bg-white/60 p-3 shadow-sm transition-colors hover:border-gold-200 cursor-default group"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold-50/50 text-gold-600 shadow-inner ring-1 ring-gold-100 group-hover:bg-gold-100 transition-colors">
                        {/* Icon dirender di sini */}
                        {item.icon}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-warmText">
                          {item.title}
                        </p>
                        <p className="text-[10px] leading-tight text-warmMuted">
                          {item.text}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </motion.div>

            {/* RIGHT VISUAL */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.5, type: "spring" }}
              className="mt-12 flex-1 lg:mt-0 lg:block"
            >
              <div className="relative mx-auto max-w-md perspective-1000">
                <div className="absolute -top-10 -right-10 h-64 w-64 rounded-full bg-gradient-to-br from-gold-100 to-warm-100 blur-3xl opacity-50" />

                <motion.div
                  whileHover={{ rotateY: 2, rotateX: 2 }}
                  className="relative rounded-3xl border border-warm-200/60 bg-white/80 p-6 shadow-2xl shadow-warm-200/50 backdrop-blur-xl ring-1 ring-warmText/5 transform transition-transform"
                >
                  <div className="mb-6 flex items-center justify-between border-b border-warm-200 pb-4">
                    <div className="flex gap-2">
                      <div className="h-3 w-3 rounded-full bg-red-400/80"></div>
                      <div className="h-3 w-3 rounded-full bg-amber-400/80"></div>
                      <div className="h-3 w-3 rounded-full bg-green-400/80"></div>
                    </div>
                    <span className="rounded-full bg-gold-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-gold-700">
                      Live Preview
                    </span>
                  </div>

                  {/* Connected Tree Visualization - Updated with Icons */}
                  <div className="relative space-y-4">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "100%" }}
                      transition={{ duration: 1.5, delay: 0.8 }}
                      className="absolute left-8 top-8 w-0.5 bg-gradient-to-b from-warm-200 to-transparent origin-top"
                    />

                    {[
                      {
                        name: "Kakek & Nenek",
                        role: "Generasi 1",
                        bg: "bg-warm-50",
                        text: "text-warmMuted",
                        icon: <UserCheck className="w-5 h-5 text-warmMuted" />, // Icon Kakek
                      },
                      {
                        name: "Ayah & Ibu",
                        role: "Generasi 2",
                        bg: "bg-warm-50",
                        text: "text-warmMuted",
                        icon: <Users className="w-5 h-5 text-warmMuted" />, // Icon Ortu
                      },
                      {
                        name: "Anda",
                        role: "Generasi 3 (Current)",
                        bg: "bg-gold-50 border-gold-100",
                        text: "text-gold-800 font-bold",
                        icon: <User className="w-5 h-5 text-gold-600" />, // Icon Anda
                      },
                    ].map((gen, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1 + idx * 0.3 }}
                        className={`relative flex items-center gap-4 rounded-xl border p-3 ${
                          gen.bg
                        } ${
                          idx === 2
                            ? "border-gold-200 shadow-sm"
                            : "border-warm-200"
                        }`}
                      >
                        <div
                          className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white bg-white shadow-sm`}
                        >
                          {gen.icon}
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm ${gen.text}`}>{gen.name}</p>
                          <p className="text-[10px] font-medium uppercase tracking-wider text-warmMuted">
                            {gen.role}
                          </p>
                        </div>
                      </motion.div>
                    ))}

                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 2.2, type: "spring" }}
                      className="absolute -bottom-4 -right-4 rounded-lg bg-warmText px-4 py-2 text-xs font-medium text-white shadow-xl flex items-center gap-2"
                    >
                      <Users className="w-3 h-3" /> {/* Icon kecil di badge */}
                      1,204 Anggota
                    </motion.div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* How it Works Section */}
        <section className="relative border-t border-warm-200 bg-white py-24">
          <div className="mx-auto max-w-6xl px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mb-16 text-center"
            >
              <h2 className="text-3xl font-bold text-warmText md:text-4xl">
                Cara Memulai Warisan Anda
              </h2>
              <p className="mt-4 text-warmMuted">
                Tiga langkah sederhana untuk mengabadikan sejarah selamanya.
              </p>
            </motion.div>

            <div className="grid gap-12 md:grid-cols-3">
              {[
                {
                  step: "01",
                  title: "Daftar Akun",
                  desc: "Buat akun aman dan pilih paket yang sesuai dengan kebutuhan arsip Anda.",
                  color: "text-gold-700 bg-gold-50",
                },
                {
                  step: "02",
                  title: "Bangun Pohon",
                  desc: "Gunakan canvas interaktif kami untuk menghubungkan garis keturunan.",
                  color: "text-accent-600 bg-accent-50",
                },
                {
                  step: "03",
                  title: "Undang Keluarga",
                  desc: "Bagikan akses privat agar sepupu dan kerabat bisa menambahkan foto.",
                  color: "text-gold-600 bg-gold-100",
                },
              ].map((item, idx) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.2, duration: 0.6 }}
                  className="group relative flex flex-col items-center text-center"
                >
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className={`mb-6 flex h-16 w-16 items-center justify-center rounded-2xl ${item.color} text-xl font-bold shadow-sm`}
                  >
                    {item.step}
                  </motion.div>
                  <h3 className="mb-3 text-xl font-semibold text-warmText">
                    {item.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-warmMuted">
                    {item.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
