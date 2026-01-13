"use client";

import { Button } from "../ui/Button";

type Props = {
  userName: string;
  onStart: () => void;
};

export default function WelcomeScreen({ userName, onStart }: Props) {
  return (
    <div className="flex min-h-[600px] items-center justify-center p-8">
      <div className="max-w-lg text-center space-y-8">
        {/* Animated tree icon */}
        <div className="relative mx-auto h-32 w-32">
          <div className="absolute inset-0 animate-pulse rounded-full bg-warm-100" />
          <div className="absolute inset-4 flex items-center justify-center rounded-full bg-gradient-to-br from-gold-500 to-gold-700 text-5xl text-white shadow-lg">
            🌳
          </div>
        </div>

        {/* Welcome text */}
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold text-warmText">
            Selamat datang, <span className="text-gold-600">{userName}</span>!
          </h1>
          <p className="text-lg text-warmMuted">
            Mari mulai abadikan sejarah keluarga besar Anda hari ini.
          </p>
        </div>

        {/* Features preview */}
        <div className="grid gap-4 text-left">
          {[
            { icon: "👨‍👩‍👧‍👦", text: "Bangun pohon silsilah interaktif" },
            { icon: "📸", text: "Simpan foto dan dokumen keluarga" },
            { icon: "📖", text: "Tulis biografi untuk setiap anggota" },
            { icon: "🤝", text: "Undang keluarga untuk berkontribusi" },
          ].map((feature) => (
            <div
              key={feature.text}
              className="flex items-center gap-4 rounded-xl bg-warm-100 p-4 border border-warm-200"
            >
              <span className="text-2xl">{feature.icon}</span>
              <span className="text-warmText">{feature.text}</span>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <div className="pt-4">
          <Button onClick={onStart} block>
            Mulai Buat Pohon Keluarga
          </Button>
          <p className="mt-3 text-sm text-warmMuted">
            Anda akan menjadi simpul pertama di pohon silsilah
          </p>
        </div>
      </div>
    </div>
  );
}
