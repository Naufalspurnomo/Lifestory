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
      ...this.checkChildReferences(nodes),
      ...this.checkAdoptiveParentReferences(nodes),
      ...this.checkBidirectionalPartners(nodes),
      ...this.checkBidirectionalParentChildren(nodes),
      ...this.checkSiblingPartners(nodes),
      ...this.checkAncestorPartners(nodes),
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
            type: "self-reference",
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

  checkAdoptiveParentReferences(nodes: FamilyNode[]): ValidationError[] {
    const ids = new Set(nodes.map((node) => node.id));
    const errors: ValidationError[] = [];

    for (const node of nodes) {
      for (const parentId of uniq(node.adoptiveParentIds || [])) {
        if (parentId === node.id) {
          errors.push({
            type: "self-reference",
            nodeId: node.id,
            details: "Node references itself as an adoptive parent",
          });
        } else if (!ids.has(parentId)) {
          errors.push({
            type: "orphan-adoptive-parent-ref",
            nodeId: node.id,
            details: `Adoptive parent ${parentId} does not exist`,
          });
        }
      }
    }

    return errors;
  }

  checkChildReferences(nodes: FamilyNode[]): ValidationError[] {
    const ids = new Set(nodes.map((node) => node.id));
    const errors: ValidationError[] = [];

    for (const node of nodes) {
      for (const childId of uniq(node.childrenIds || [])) {
        if (childId === node.id) {
          errors.push({
            type: "self-reference",
            nodeId: node.id,
            details: "Node references itself as a child",
          });
        } else if (!ids.has(childId)) {
          errors.push({
            type: "orphan-child-ref",
            nodeId: node.id,
            details: `Child ${childId} does not exist`,
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
        if (partnerId === node.id) {
          errors.push({
            type: "self-reference",
            nodeId: node.id,
            details: "Node references itself as a partner",
          });
          continue;
        }

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

  checkBidirectionalParentChildren(nodes: FamilyNode[]): ValidationError[] {
    const byId = new Map(nodes.map((node) => [node.id, node]));
    const errors: ValidationError[] = [];

    for (const node of nodes) {
      for (const childId of uniq(node.childrenIds || [])) {
        const child = byId.get(childId);
        if (!child) continue;
        if (!parentRefs(child).includes(node.id)) {
          errors.push({
            type: "unidirectional-parent-child",
            nodeId: node.id,
            details: `Child link to ${childId} is not reflected in the child's parentIds`,
          });
        }
      }

      for (const parentId of parentRefs(node)) {
        const parent = byId.get(parentId);
        if (!parent) continue;
        if (!(parent.childrenIds || []).includes(node.id)) {
          errors.push({
            type: "unidirectional-parent-child",
            nodeId: node.id,
            details: `Parent link to ${parentId} is not reflected in the parent's childrenIds`,
          });
        }
      }
    }

    return errors;
  }

  checkSiblingPartners(nodes: FamilyNode[]): ValidationError[] {
    const byId = new Map(nodes.map((node) => [node.id, node]));
    const errors: ValidationError[] = [];

    for (const node of nodes) {
      const nodeParents = new Set(parentRefs(node));
      if (nodeParents.size === 0) continue;

      for (const partnerId of uniq(node.partners || [])) {
        const partner = byId.get(partnerId);
        if (!partner) continue;
        const sharesBiologicalParent = parentRefs(partner).some((parentId) =>
          nodeParents.has(parentId)
        );
        if (sharesBiologicalParent) {
          errors.push({
            type: "sibling-partner",
            nodeId: node.id,
            details: `Partner link to ${partnerId} connects biological siblings`,
          });
        }
      }
    }

    return errors;
  }

  checkAncestorPartners(nodes: FamilyNode[]): ValidationError[] {
    const byId = new Map(nodes.map((node) => [node.id, node]));
    const errors: ValidationError[] = [];
    const checkedPairs = new Set<string>();

    const isAncestor = (ancestorId: string, descendantId: string) => {
      const queue = [ancestorId];
      const visited = new Set<string>();
      while (queue.length > 0) {
        const currentId = queue.shift()!;
        if (visited.has(currentId)) continue;
        visited.add(currentId);
        if (currentId === descendantId) return true;
        for (const childId of byId.get(currentId)?.childrenIds || []) {
          if (!visited.has(childId)) queue.push(childId);
        }
      }
      return false;
    };

    for (const node of nodes) {
      for (const partnerId of uniq(node.partners || [])) {
        const pairKey = [node.id, partnerId].sort().join("\u0000");
        if (checkedPairs.has(pairKey)) continue;
        checkedPairs.add(pairKey);
        if (!byId.has(partnerId)) continue;
        if (!isAncestor(node.id, partnerId) && !isAncestor(partnerId, node.id)) {
          continue;
        }
        errors.push({
          type: "ancestor-partner",
          nodeId: node.id,
          details: `Partner link to ${partnerId} connects an ancestor and descendant`,
        });
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
