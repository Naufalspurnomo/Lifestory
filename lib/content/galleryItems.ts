export type GalleryItem = {
  id: string;
  src: string;
  alt: string;
  title: string;
  subtitle: string;
  summary: string;
  era: string;
  palette: string;
  pdf?: {
    url: string;
    fileName: string;
  };
};

export const galleryItems: GalleryItem[] = [
  {
    id: "ivory-classic",
    src: "/cover-gallery/cover-1.png",
    alt: "Cover portrait monokrom Wang Li Jien",
    title: "Wang Li Jien",
    subtitle: "Personal life memoir",
    summary:
      "Potret hitam-putih yang tegas untuk kisah hidup personal, perjalanan batin, dan momen penting yang membentuk karakter.",
    era: "Modern Classic",
    palette: "Monochrome Noir",
  },
  {
    id: "royal-navy",
    src: "/cover-gallery/cover-2.png",
    alt: "Cover Kisah Ibu Kami dengan siluet wajah",
    title: "Kisah Ibu Kami",
    subtitle: "Family tribute edition",
    summary:
      "Siluet lembut dan nuansa hangat untuk mengenang sosok ibu, berisi cerita masa kecil, pengorbanan, dan kasih yang diwariskan.",
    era: "Lintas Generasi",
    palette: "Warm Cream",
  },
  {
    id: "crimson-legacy",
    src: "/cover-gallery/cover-3.png",
    alt: "Cover Kisah Pak Yohannes Ayah Kami dengan foto keluarga",
    title: "Kisah Pak Yohannes",
    subtitle: "Family photo chronicle",
    summary:
      "Berbasis foto keluarga, cocok untuk kisah ayah sebagai figur sentral: nilai hidup, perjuangan, dan kebersamaan lintas generasi.",
    era: "Generasi Kini",
    palette: "Teal Ivory",
  },
  {
    id: "emerald-vault",
    src: "/cover-gallery/cover-4.png",
    alt: "Cover Bara yang hangat dan angin yang sejuk karya Suwati",
    title: "Bara yang Hangat & Angin yang Sejuk",
    subtitle: "Legacy memory edition",
    summary:
      "Sampul bernuansa vintage hangat untuk memoar keteguhan hidup, kenangan masa tua, dan warisan nilai yang tetap menyala.",
    era: "Kisah Seumur Hidup",
    palette: "Amber Vintage",
    pdf: {
      url: "/api/gallery-pdf/mak-book-re-arrange-1",
      fileName: "Mak Book Re-Arrange 1.pdf",
    },
  },
];
