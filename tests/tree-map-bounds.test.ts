import { describe, expect, it } from "vitest";
import { clampCanvasTransform } from "../lib/tree/canvasBounds";

const viewport = { left: 0, top: 0, right: 1_000, bottom: 700 };

describe("tree map boundaries", () => {
  it("keeps a large tree within a comfortable pan margin", () => {
    expect(
      clampCanvasTransform(
        { x: 1_000, y: 1_000, k: 1 },
        { contentWidth: 2_000, contentHeight: 1_200, viewport }
      )
    ).toEqual({ x: 160, y: 160, k: 1 });

    expect(
      clampCanvasTransform(
        { x: -2_000, y: -2_000, k: 1 },
        { contentWidth: 2_000, contentHeight: 1_200, viewport }
      )
    ).toEqual({ x: -1_160, y: -660, k: 1 });
  });

  it("centers a tree that is smaller than the usable map viewport", () => {
    expect(
      clampCanvasTransform(
        { x: -500, y: 900, k: 1 },
        { contentWidth: 200, contentHeight: 100, viewport }
      )
    ).toEqual({ x: 400, y: 300, k: 1 });
  });
});
