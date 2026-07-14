import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { buildWelcomePayload, normalizeWhatsAppPhone } from "../lib/whatsapp";

describe("WhatsApp welcome payload", () => {
  it("normalizes common Indonesian WhatsApp number forms", () => {
    expect(normalizeWhatsAppPhone("0812 3456 7890")).toBe("6281234567890");
    expect(normalizeWhatsAppPhone("+62 (812) 3456-7890")).toBe("6281234567890");
    expect(normalizeWhatsAppPhone("6281234567890")).toBe("6281234567890");
    expect(normalizeWhatsAppPhone("123")).toBeNull();
  });

  it("builds a standard image caption with a clickable app URL", () => {
    const payload = buildWelcomePayload({
      name: "Naufal",
      phone: "6281234567890",
      origin: "https://lifestory.co.id",
      imageUrl: "https://lifestory.co.id/image/whatsapp-welcome.webp",
    });

    expect(payload).toEqual({
      Phone: "6281234567890",
      Image: "https://lifestory.co.id/image/whatsapp-welcome.webp",
      Caption:
        "Halo Naufal, selamat datang di Lifestory.\n\nSilakan verifikasi email Anda terlebih dahulu. Setelah itu, mulai susun kisah keluarga Anda di Lifestory.\n\nBuka Lifestory:\nhttps://lifestory.co.id/app",
    });

    const source = readFileSync(join(process.cwd(), "lib/whatsapp.ts"), "utf8");
    expect(source).toContain("/chat/send/image");
    expect(source).not.toContain("/chat/send/buttons");
  });
});
