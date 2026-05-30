import type { FamilyNode, ValidationError, ValidationResult } from "./types";

const uniq = (values: string[]) => Array.from(new Set(values.filter(Boolean)));

function parentRefs(node: FamilyNode): string[] {
  return uniq([...(node.parentIds || []), ...(node.parentId ? [node.parentId] : [])]);
}

export class IntegrityValidator {
  validate(nodes: FamilyNode[]): ValidationResult {
    const errors = [
      ...this.checkDuplicateIds(nodes),
      ...this.checkParentReferences(nodes),
      ...this.checkBidirectionalPartners(nodes),
      ...this.checkCircularAncestors(nodes),
    ];
    return { valid: errors.length === 0, errors };
  }

  checkParentReferences(nodes: FamilyNode[]): ValidationError[] {
    const ids = new Set(nodes.map((node) => node.id));
    const errors: ValidationError[] = [];

    for (const node of nodes) {
      for (const parentId of parentRefs(node)) {
        if (parentId === node.id) {
          errors.push({
            type: "circular-ancestor",
            nodeId: node.id,
            details: "Node references itself as a parent",
          });
        } else if (!ids.has(parentId)) {
          errors.push({
            type: "orphan-parent-ref",
            nodeId: node.id,
            details: `Parent ${parentId} does not exist`,
          });
        }
      }
    }

    return errors;
  }

  checkBidirectionalPartners(nodes: FamilyNode[]): ValidationError[] {
    const byId = new Map(nodes.map((node) => [node.id, node]));
    const errors: ValidationError[] = [];

    for (const node of nodes) {
      for (const partnerId of uniq(node.partners || [])) {
        const partner = byId.get(partnerId);
        if (!partner || !(partner.partners || []).includes(node.id)) {
          errors.push({
            type: "unidirectional-partner",
            nodeId: node.id,
            details: `Partner link to ${partnerId} is not bidirectional`,
          });
        }
      }
    }

    return errors;
  }

  checkCircularAncestors(nodes: FamilyNode[]): ValidationError[] {
    const byId = new Map(nodes.map((node) => [node.id, node]));
    const errors: ValidationError[] = [];

    for (const node of nodes) {
      const visiting = new Set<string>();
      const visited = new Set<string>();

      const dfs = (nodeId: string): boolean => {
        if (visiting.has(nodeId)) return true;
        if (visited.has(nodeId)) return false;
        visiting.add(nodeId);
        const current = byId.get(nodeId);
        if (current) {
          for (const parentId of parentRefs(current)) {
            if (dfs(parentId)) return true;
          }
        }
        visiting.delete(nodeId);
        visited.add(nodeId);
        return false;
      };

      if (dfs(node.id)) {
        errors.push({
          type: "circular-ancestor",
          nodeId: node.id,
          details: "Node is part of a circular ancestor chain",
        });
      }
    }

    return errors;
  }

  checkDuplicateIds(nodes: FamilyNode[]): ValidationError[] {
    const seen = new Set<string>();
    const errors: ValidationError[] = [];

    for (const node of nodes) {
      if (seen.has(node.id)) {
        errors.push({
          type: "duplicate-id",
          nodeId: node.id,
          details: `Duplicate node id ${node.id}`,
        });
      }
      seen.add(node.id);
    }

    return errors;
  }
}
