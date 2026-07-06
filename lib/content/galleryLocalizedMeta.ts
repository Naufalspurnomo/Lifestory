export type LocalizedGalleryMeta = {
  subtitle: string;
  summary: string;
  era: string;
  palette: string;
};

export const localizedGalleryMeta: Record<
  string,
  { id: LocalizedGalleryMeta; en: LocalizedGalleryMeta }
> = {
  "ivory-classic": {
    id: {
      subtitle: "Memoar hidup personal",
      summary:
        "Potret hitam-putih yang tegas untuk kisah hidup personal, perjalanan batin, dan momen penting yang membentuk karakter.",
      era: "Klasik Modern",
      palette: "Monokrom Noir",
    },
    en: {
      subtitle: "Personal life memoir",
      summary:
        "A bold black-and-white portrait for personal journeys, inner growth, and defining life moments.",
      era: "Modern Classic",
      palette: "Monochrome Noir",
    },
  },
  "royal-navy": {
    id: {
      subtitle: "Edisi tribute keluarga",
      summary:
        "Siluet lembut dan nuansa hangat untuk mengenang sosok ibu, berisi cerita masa kecil, pengorbanan, dan kasih yang diwariskan.",
      era: "Lintas Generasi",
      palette: "Krim Hangat",
    },
    en: {
      subtitle: "Family tribute edition",
      summary:
        "A soft silhouette with warm tones to honor a mother figure, filled with childhood stories, sacrifice, and enduring love.",
      era: "Cross Generation",
      palette: "Warm Cream",
    },
  },
  "crimson-legacy": {
    id: {
      subtitle: "Kronik foto keluarga",
      summary:
        "Berbasis foto keluarga, cocok untuk kisah ayah sebagai figur sentral: nilai hidup, perjuangan, dan kebersamaan lintas generasi.",
      era: "Generasi Kini",
      palette: "Teal Gading",
    },
    en: {
      subtitle: "Family photo chronicle",
      summary:
        "Built from family photos, ideal for a father's central journey: values, struggles, and togetherness across generations.",
      era: "Current Generation",
      palette: "Teal Ivory",
    },
  },
  "emerald-vault": {
    id: {
      subtitle: "Edisi memori warisan",
      summary:
        "Sampul bernuansa vintage hangat untuk memoar keteguhan hidup, kenangan masa tua, dan warisan nilai yang tetap menyala.",
      era: "Kisah Seumur Hidup",
      palette: "Amber Klasik",
    },
    en: {
      subtitle: "Legacy memory edition",
      summary:
        "A warm vintage cover for memoirs of resilience, later-life memories, and values passed forward.",
      era: "Lifetime Story",
      palette: "Amber Vintage",
    },
  },
};

export function getGalleryLocalizedMeta(
  itemId: string,
  locale: "id" | "en"
): LocalizedGalleryMeta | undefined {
  const itemMeta = localizedGalleryMeta[itemId];
  if (!itemMeta) return undefined;
  return locale === "id" ? itemMeta.id : itemMeta.en;
}