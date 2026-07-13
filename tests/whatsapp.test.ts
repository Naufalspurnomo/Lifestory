import { describe, expect, it } from "vitest";
import { buildWelcomePayload, normalizeWhatsAppPhone } from "../lib/whatsapp";

describe("WhatsApp welcome payload", () => {
  it("normalizes common Indonesian WhatsApp number forms", () => {
    expect(normalizeWhatsAppPhone("0812 3456 7890")).toBe("6281234567890");
    expect(normalizeWhatsAppPhone("+62 (812) 3456-7890")).toBe("6281234567890");
    expect(normalizeWhatsAppPhone("6281234567890")).toBe("6281234567890");
    expect(normalizeWhatsAppPhone("123")).toBeNull();
  });

  it("builds an image CTA that opens the app", () => {
    expect(
      buildWelcomePayload({
        name: "Naufal",
        phone: "6281234567890",
        origin: "https://lifestory.co.id",
        imageUrl: "https://lifestory.co.id/image/whatsapp-welcome.webp",
      })
    ).toMatchObject({
      Phone: "6281234567890",
      Image: "https://lifestory.co.id/image/whatsapp-welcome.webp",
      Buttons: [
        {
          type: "cta_url",
          title: "Buka Lifestory",
          url: "https://lifestory.co.id/app",
        },
      ],
    });
  });
});
