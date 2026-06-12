import type {
  ExportData,
  FamilyNode,
  ImportValidation,
  TreeData,
} from "./types";
import { buildFamilyGraph } from "../tree/familyGraph";

const MAX_EXPORT_BYTES = 50 * 1024 * 1024;

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

export function getExportFilename(treeName: string, date = new Date()): string {
  const yyyy = date.getFullYear();
  const mm = `${date.getMonth() + 1}`.padStart(2, "0");
  const dd = `${date.getDate()}`.padStart(2, "0");
  const sanitized = treeName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "") || "family-tree";
  return `${sanitized}-${yyyy}-${mm}-${dd}.json`;
}

export function collectMediaReferences(nodes: FamilyNode[]): string[] {
  const references: string[] = [];
  for (const node of nodes) {
    if (node.imageUrl) references.push(node.imageUrl);
    for (const media of node.content?.media || []) {
      if (media.url) references.push(media.url);
    }
  }
  return unique(references);
}

export function createExportData(tree: TreeData): ExportData {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    tree: {
      id: tree.id,
      name: tree.name,
      nodes: tree.nodes,
      graph: buildFamilyGraph(tree.nodes),
      metadata: {
        ownerId: tree.ownerId,
        createdAt: tree.createdAt,
        updatedAt: tree.updatedAt,
      },
      mediaReferences: collectMediaReferences(tree.nodes),
    },
  };
}

export function exportTreeBlob(tree: TreeData): Blob {
  const data = createExportData(tree);
  const json = JSON.stringify(data, null, 2);
  const size = new Blob([json], { type: "application/json" }).size;
  if (size > MAX_EXPORT_BYTES) {
    throw new Error("Export exceeds the 50 MB limit");
  }
  return new Blob([json], { type: "application/json" });
}

export function validateImportPayload(
  payload: unknown,
  existingNodes: FamilyNode[] = []
): ImportValidation {
  const errors: string[] = [];

  if (!payload || typeof payload !== "object") {
    return { valid: false, errors: ["File must contain a JSON object"] };
  }

  const data = payload as Partial<ExportData>;
  const tree = data.tree as Partial<ExportData["tree"]> | undefined;

  if (!tree || typeof tree !== "object") errors.push("Missing tree object");
  if (!tree?.id || typeof tree.id !== "string") errors.push("Missing tree.id");
  if (!tree?.name || typeof tree.name !== "string") {
    errors.push("Missing tree.name");
  }
  if (!Array.isArray(tree?.nodes)) errors.push("Missing tree.nodes array");

  const duplicateIds: string[] = [];
  if (Array.isArray(tree?.nodes)) {
    const existingIds = new Set(existingNodes.map((node) => node.id));
    const seen = new Set<string>();
    for (const rawNode of tree.nodes) {
      const node = rawNode as Partial<FamilyNode>;
      if (!node?.id || typeof node.id !== "string") {
        errors.push("Every imported node must have a string id");
        continue;
      }
      if (!node.label || typeof node.label !== "string") {
        errors.push(`Node ${node.id} is missing a label`);
      }
      if (seen.has(node.id)) {
        errors.push(`Duplicate node id in import: ${node.id}`);
      }
      seen.add(node.id);
      if (existingIds.has(node.id)) duplicateIds.push(node.id);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    nodeCount: Array.isArray(tree?.nodes) ? tree.nodes.length : undefined,
    duplicateIds: unique(duplicateIds),
  };
}

export function parseImportText(
  text: string,
  existingNodes: FamilyNode[] = []
): { data?: ExportData; validation: ImportValidation } {
  let payload: unknown;
  try {
    payload = JSON.parse(text);
  } catch {
    return {
      validation: { valid: false, errors: ["File is not valid JSON"] },
    };
  }

  const validation = validateImportPayload(payload, existingNodes);
  return {
    data: validation.valid ? (payload as ExportData) : undefined,
    validation,
  };
}

export class ExportManager {
  export(tree: TreeData): Blob {
    return exportTreeBlob(tree);
  }

  getFilename(treeName: string, date = new Date()): string {
    return getExportFilename(treeName, date);
  }

  async validateImport(
    file: File,
    existingNodes: FamilyNode[] = []
  ): Promise<ImportValidation> {
    if (file.size > MAX_EXPORT_BYTES) {
      return {
        valid: false,
        errors: ["File exceeds the 50 MB import limit"],
      };
    }
    const text = await file.text();
    return parseImportText(text, existingNodes).validation;
  }

  async parseImport(
    file: File,
    existingNodes: FamilyNode[] = []
  ): Promise<ExportData> {
    const text = await file.text();
    const result = parseImportText(text, existingNodes);
    if (!result.validation.valid || !result.data) {
      throw new Error(result.validation.errors.join("; "));
    }
    return result.data;
  }
}

export function downloadTreeJson(tree: TreeData): void {
  const manager = new ExportManager();
  const blob = manager.export(tree);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = manager.getFilename(tree.name);
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
