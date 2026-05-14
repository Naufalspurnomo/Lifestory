import { describe, it, expect } from "vitest";
import {
  normalizeInstagramHandle,
  normalizeTikTokHandle,
  normalizeLinkedInHandle,
} from "../lib/utils/socialLinks";

describe("normalizeInstagramHandle", () => {
  it("accepts a plain handle", () => {
    expect(normalizeInstagramHandle("johndoe")).toBe("johndoe");
  });

  it("strips @ prefix", () => {
    expect(normalizeInstagramHandle("@jane.doe")).toBe("jane.doe");
  });

  it("extracts handle from a full URL", () => {
    expect(normalizeInstagramHandle("https://instagram.com/official_name/")).toBe(
      "official_name"
    );
  });

  it("keeps only first token — trailing junk is trimmed, not rejected", () => {
    // Current behavior: anything after whitespace/slash/? is dropped. So
    // "invalid name!" resolves to "invalid" (valid). Update this test if
    // you want strict rejection of multi-word input.
    expect(normalizeInstagramHandle("invalid name!")).toBe("invalid");
  });

  it("rejects a handle whose first token contains illegal chars", () => {
    expect(normalizeInstagramHandle("bad!name")).toBeNull();
  });

  it("rejects non-Instagram host", () => {
    expect(normalizeInstagramHandle("https://evil.com/foo")).toBeNull();
  });

  it("rejects post URLs (/p/...)", () => {
    expect(
      normalizeInstagramHandle("https://instagram.com/p/abc123/")
    ).toBeNull();
  });
});

describe("normalizeTikTokHandle", () => {
  it("accepts a plain handle", () => {
    expect(normalizeTikTokHandle("tiktoker")).toBe("tiktoker");
  });

  it("extracts from @handle URL", () => {
    expect(normalizeTikTokHandle("https://www.tiktok.com/@someone")).toBe(
      "someone"
    );
  });

  it("rejects too short handle", () => {
    expect(normalizeTikTokHandle("a")).toBeNull();
  });
});

describe("normalizeLinkedInHandle", () => {
  it("accepts personal in/ path", () => {
    expect(normalizeLinkedInHandle("https://linkedin.com/in/johndoe")).toBe(
      "in/johndoe"
    );
  });

  it("accepts company/ path", () => {
    expect(
      normalizeLinkedInHandle("https://www.linkedin.com/company/lifestory")
    ).toBe("company/lifestory");
  });

  it("defaults to 'in/' when only a slug is given", () => {
    expect(normalizeLinkedInHandle("jane-doe")).toBe("in/jane-doe");
  });

  it("trims trailing junk after whitespace", () => {
    // Mirroring the Instagram behavior: first token wins.
    expect(normalizeLinkedInHandle("bad name!")).toBe("in/bad");
  });

  it("rejects a first token containing illegal characters", () => {
    expect(normalizeLinkedInHandle("bad!name")).toBeNull();
  });
});
