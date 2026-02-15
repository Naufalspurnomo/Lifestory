"use client";

import { Button } from "../ui/Button";
import { useLanguage } from "../providers/LanguageProvider";

type Props = {
  userName: string;
  onStart: () => void;
};

export default function WelcomeScreen({ userName, onStart }: Props) {
  const { locale } = useLanguage();
  const copy =
    locale === "id"
      ? {
          title: "Selamat datang",
          subtitle: "Mari mulai abadikan sejarah keluarga besar Anda hari ini.",
          features: [
            "Bangun pohon silsilah interaktif",
            "Simpan foto dan dokumen keluarga",
            "Tulis biografi untuk setiap anggota",
            "Undang keluarga untuk berkontribusi",
          ],
          cta: "Mulai Buat Pohon Keluarga",
          hint: "Anda akan menjadi simpul pertama di pohon silsilah",
        }
      : {
          title: "Welcome",
          subtitle: "Start preserving your family history today.",
          features: [
            "Build an interactive family tree",
            "Store family photos and documents",
            "Write biographies for each member",
            "Invite family members to contribute",
          ],
          cta: "Start Creating Family Tree",
          hint: "You will become the first node in the family tree",
        };

  return (
    <div className="flex min-h-[600px] items-center justify-center p-8">
      <div className="max-w-lg space-y-8 text-center">
        <div className="relative mx-auto h-32 w-32">
          <div className="absolute inset-0 animate-pulse rounded-full bg-warm-100" />
          <div className="absolute inset-4 flex items-center justify-center rounded-full bg-gradient-to-br from-gold-500 to-gold-700 text-5xl text-white shadow-lg">
            🌳
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-semibold text-warmText">
            {copy.title}, <span className="text-gold-600">{userName}</span>!
          </h1>
          <p className="text-lg text-warmMuted">{copy.subtitle}</p>
        </div>

        <div className="grid gap-4 text-left">
          {[
            { icon: "🌳", text: copy.features[0] },
            { icon: "📸", text: copy.features[1] },
            { icon: "📖", text: copy.features[2] },
            { icon: "🤝", text: copy.features[3] },
          ].map((feature) => (
            <div
              key={feature.text}
              className="flex items-center gap-4 rounded-xl border border-warm-200 bg-warm-100 p-4"
            >
              <span className="text-2xl">{feature.icon}</span>
              <span className="text-warmText">{feature.text}</span>
            </div>
          ))}
        </div>

        <div className="pt-4">
          <Button onClick={onStart} block>
            {copy.cta}
          </Button>
          <p className="mt-3 text-sm text-warmMuted">{copy.hint}</p>
        </div>
      </div>
    </div>
  );
}
