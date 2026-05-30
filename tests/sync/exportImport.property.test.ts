import { describe, expect, it } from "vitest";
import fc from "fast-check";
import {
  createExportData,
  getExportFilename,
  parseImportText,
  validateImportPayload,
} from "../../lib/sync/ExportManager";
import type { TreeData } from "../../lib/types/tree";
import { nuclearFamily } from "../helpers/fixtures";

function tree(name = "Keluarga Naufal"): TreeData {
  return {
    id: "tree-1",
    name,
    ownerId: "user-1",
    version: 1,
    nodes: nuclearFamily(),
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("data reliability export/import", () => {
  it("round-trips valid tree data through JSON", () => {
    // Feature: data-reliability-sync, Property 17: Export/Import Round-Trip
    const original = tree();
    const exported = createExportData(original);
    const parsed = parseImportText(JSON.stringify(exported));

    expect(parsed.validation.valid).toBe(true);
    expect(parsed.data?.tree.id).toBe(original.id);
    expect(parsed.data?.tree.name).toBe(original.name);
    expect(parsed.data?.tree.nodes).toEqual(original.nodes);
  });

  it("generates sanitized dated filenames", () => {
    // Feature: data-reliability-sync, Property 18: Export Filename Format
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 60 }), (name) => {
        const filename = getExportFilename(name, new Date("2026-05-30T00:00:00Z"));
        expect(filename).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*-2026-05-30\.json$|^family-tree-2026-05-30\.json$/);
      }),
      { numRuns: 100 }
    );
  });

  it("reports overlapping imported node ids", () => {
    // Feature: data-reliability-sync, Property 19: Import Duplicate ID Detection
    const current = tree();
    const imported = createExportData(current);
    const validation = validateImportPayload(imported, current.nodes);
    expect(validation.duplicateIds?.sort()).toEqual(
      current.nodes.map((node) => node.id).sort()
    );
  });
});
