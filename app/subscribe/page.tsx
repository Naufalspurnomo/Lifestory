"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "../../components/ui/Button";

const WHATSAPP_NUMBER = "6281234567890"; // Replace with actual number

const plans = [
  {
    name: "Paket Keluarga",
    price: "Rp 99.000",
    period: "/ bulan",
    features: [
      "Pohon silsilah interaktif tanpa batas",
      "Arsip foto & dokumen keluarga",
      "Undang anggota keluarga untuk kolaborasi",
      "Backup data otomatis",
    ],
  },
];

const paymentMethods = [
  { name: "BCA", number: "1234567890", holder: "PT Lifestory Indonesia" },
  { name: "Mandiri", number: "0987654321", holder: "PT Lifestory Indonesia" },
  { name: "GoPay / OVO / Dana", number: "081234567890", holder: "Lifestory" },
];

export default function SubscribePage() {
  const { data: session } = useSession();
  const user = session?.user;
  const isSubscribed = user?.subscriptionActive;

  const orderText = encodeURIComponent(
    `Halo Admin Lifestory!\n\nSaya ingin berlangganan Paket Keluarga.\n\nNama: ${
      user?.name || "-"
    }\nEmail: ${
      user?.email || "-"
    }\n\nMohon konfirmasi pembayaran saya. Terima kasih!`
  );

  if (isSubscribed) {
    return (
      <div className="bg-white min-h-screen">
        <section className="mx-auto max-w-2xl px-6 py-16 text-center space-y-6">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-forest-100">
            <svg
              className="h-8 w-8 text-forest-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-semibold text-slate-900">
            Langganan Anda Aktif!
          </h1>
          <p className="text-slate-600">
            Terima kasih telah menjadi anggota Lifestory. Nikmati semua fitur
            premium.
          </p>
          <Link href="/app">
            <Button>Buka Family Tree</Button>
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-white to-slate-50 min-h-screen">
      <section className="mx-auto max-w-4xl px-6 py-16 space-y-10">
        {/* Header */}
        <div className="text-center space-y-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-forest-600">
            Berlangganan
          </p>
          <h1 className="text-4xl font-semibold text-slate-900">
            Abadikan Sejarah Keluarga Anda
          </h1>
          <p className="text-lg text-slate-600 max-w-xl mx-auto">
            Bangun pohon silsilah interaktif, simpan kenangan berharga, dan
            wariskan cerita keluarga untuk generasi mendatang.
          </p>
        </div>

        {/* Plan Card */}
        {plans.map((plan) => (
          <div
            key={plan.name}
            className="mx-auto max-w-md rounded-2xl border-2 border-forest-200 bg-white p-8 shadow-lg shadow-forest-100/50"
          >
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-semibold text-slate-900">
                {plan.name}
              </h2>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-bold text-forest-700">
                  {plan.price}
                </span>
                <span className="text-slate-500">{plan.period}</span>
              </div>
            </div>
            <ul className="mt-6 space-y-3">
              {plan.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-3 text-slate-700"
                >
                  <svg
                    className="mt-1 h-5 w-5 flex-shrink-0 text-forest-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* Payment Instructions */}
        <div className="mx-auto max-w-xl space-y-6">
          <h3 className="text-xl font-semibold text-slate-900 text-center">
            Cara Pembayaran
          </h3>

          <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-forest-100 text-forest-700 font-semibold text-sm">
                1
              </div>
              <p className="text-slate-700">
                Transfer ke salah satu rekening berikut:
              </p>
            </div>
            <div className="ml-11 space-y-3">
              {paymentMethods.map((method) => (
                <div key={method.name} className="rounded-lg bg-slate-50 p-3">
                  <p className="font-semibold text-slate-900">{method.name}</p>
                  <p className="text-sm text-slate-600">{method.number}</p>
                  <p className="text-sm text-slate-500">a.n. {method.holder}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-forest-100 text-forest-700 font-semibold text-sm">
                2
              </div>
              <p className="text-slate-700">
                Konfirmasi pembayaran via WhatsApp:
              </p>
            </div>
            <div className="ml-11">
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${orderText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green-500 px-6 py-3 font-semibold text-white transition hover:bg-green-600"
              >
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Konfirmasi via WhatsApp
              </a>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-forest-100 text-forest-700 font-semibold text-sm">
                3
              </div>
              <p className="text-slate-700">
                Akun akan diaktifkan dalam <strong>1x24 jam</strong>
              </p>
            </div>
            <p className="ml-11 text-sm text-slate-500">
              Admin akan memverifikasi pembayaran dan mengaktifkan akun Anda.
              Anda akan menerima notifikasi via email setelah langganan aktif.
            </p>
          </div>
        </div>

        {/* Not logged in notice */}
        {!user && (
          <div className="mx-auto max-w-md rounded-xl border border-amber-200 bg-amber-50 p-4 text-center">
            <p className="text-amber-800">
              <Link
                href="/auth/login"
                className="font-semibold underline hover:text-amber-900"
              >
                Login
              </Link>{" "}
              atau{" "}
              <Link
                href="/auth/register"
                className="font-semibold underline hover:text-amber-900"
              >
                daftar
              </Link>{" "}
              terlebih dahulu sebelum berlangganan.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
