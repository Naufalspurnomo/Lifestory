import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import {
  buildFirstTreeWelcomePayload,
  buildWelcomePayload,
  normalizeWhatsAppPhone,
} from "../lib/whatsapp";

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
        "Selamat, Naufal! Email Anda berhasil diverifikasi dan akun Lifestory Anda kini aktif.\n\nRuang keluarga Anda siap digunakan. Mulai susun pohon keluarga, simpan cerita, dan wariskan kenangan untuk generasi berikutnya.\n\nBuka Lifestory:\nhttps://lifestory.co.id/app",
    });

    const source = readFileSync(join(process.cwd(), "lib/whatsapp.ts"), "utf8");
    expect(source).toContain("/chat/send/image");
    expect(source).not.toContain("/chat/send/buttons");
  });

  it("queues and sends the welcome only after email activation", () => {
    const register = readFileSync(
      join(process.cwd(), "app/api/auth/register/route.ts"),
      "utf8"
    );
    const verify = readFileSync(
      join(process.cwd(), "app/api/auth/verify-email/route.ts"),
      "utf8"
    );
    const whatsapp = readFileSync(join(process.cwd(), "lib/whatsapp.ts"), "utf8");

    expect(register).not.toContain("enqueueVerifiedAccountWelcome");
    expect(register).not.toContain("processWhatsAppWelcomeJob");
    expect(verify).toContain('status: activatesAccount ? "active" : user.status');
    expect(verify).toContain("enqueueVerifiedAccountWelcome");
    expect(verify).toContain("processWhatsAppWelcomeJob");
    expect(whatsapp).toContain('job.user.status !== "active"');
    expect(whatsapp).toContain("!job.user.emailVerifiedAt");
    expect(whatsapp).toContain('lastError: "awaiting_email_verification"');
  });

  it("builds the first-tree thank-you message with the app link", () => {
    expect(
      buildFirstTreeWelcomePayload({
        name: "Naufal",
        phone: "6281234567890",
        origin: "https://lifestory.co.id",
        imageUrl: "https://lifestory.co.id/image/whatsapp-welcome.webp",
      })
    ).toEqual({
      Phone: "6281234567890",
      Image: "https://lifestory.co.id/image/whatsapp-welcome.webp",
      Caption:
        "Terima kasih, Naufal! Anggota pertama keluarga Anda sudah tersimpan di Lifestory.\n\nPohon keluarga Anda kini resmi dimulai. Lanjutkan dengan menambahkan orang tua, pasangan, anak, atau saudara agar kisah keluarga tumbuh dari satu nama menjadi warisan bersama.\n\nLanjutkan pohon keluarga:\nhttps://lifestory.co.id/app",
    });
  });
});
