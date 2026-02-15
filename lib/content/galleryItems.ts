export type GalleryItem = {
  id: string;
  src: string;
  alt: string;
  title: string;
  subtitle: string;
  summary: string;
  era: string;
  palette: string;
};

export const galleryItems: GalleryItem[] = [
  {
    id: "ivory-classic",
    src: "/cover-gallery/cover-1.png",
    alt: "Ivory classic biography cover",
    title: "Ivory Heritage",
    subtitle: "Classic biography volume",
    summary:
      "A minimal ivory cover for origin stories, first-generation memories, and family foundations.",
    era: "1900-1950",
    palette: "Ivory Gold",
  },
  {
    id: "royal-navy",
    src: "/cover-gallery/cover-2.png",
    alt: "Royal navy biography cover",
    title: "Royal Lineage",
    subtitle: "Formal family chronicle",
    summary:
      "A deep navy look for achievements, leadership timelines, and milestone-focused narratives.",
    era: "1950-1980",
    palette: "Navy Gold",
  },
  {
    id: "crimson-legacy",
    src: "/cover-gallery/cover-3.png",
    alt: "Crimson legacy biography cover",
    title: "Crimson Legacy",
    subtitle: "Ceremonial memory edition",
    summary:
      "A ceremonial red edition suited for major events, wedding archives, and generational turning points.",
    era: "1980-2005",
    palette: "Crimson Gold",
  },
  {
    id: "emerald-vault",
    src: "/cover-gallery/cover-4.png",
    alt: "Emerald vault biography cover",
    title: "Emerald Vault",
    subtitle: "Premium keepsake archive",
    summary:
      "A premium green collection for curated family artifacts, heirloom stories, and final archive sets.",
    era: "2005-Now",
    palette: "Emerald Gold",
  },
];
