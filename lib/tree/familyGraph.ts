import type {
  FamilyGraph,
  FamilyNode,
  FamilyUnion,
  FamilyUnionStatus,
  ParentChildLink,
  ParentChildRelationType,
} from "../types/tree";
import { makeFamilyUnionId } from "./unionId";

const BIOLOGICAL_LIKE = new Set<ParentChildRelationType>([
  "biological",
  "unknown",
]);

const PARTNER_STATUSES = new Set<FamilyUnionStatus>([
  "married",
  "divorced",
  "informal",
]);

type FamilyGraphIssue = {
  code: string;
  message: string;
  nodeId?: string;
  unionId?: string;
  linkId?: string;
};

type BuildFamilyGraphOptions = {
  repairLegacyCoupleChildren?: boolean;
};

const uniq = <T>(values: T[]) =>
  Array.from(new Set(values.filter((value): value is T => Boolean(value))));

function orderedIds(ids: string[]) {
  return uniq(ids).sort();
}

function makeParentChildLinkId(
  parentUnitId: string,
  childId: string,
  relationType: ParentChildRelationType
) {
  return `pcl-${parentUnitId}-${childId}-${relationType}`;
}

function parentRefs(node: FamilyNode) {
  return uniq([...(node.parentIds || []), ...(node.parentId ? [node.parentId] : [])]);
}

function sharesParent(a: FamilyNode, b: FamilyNode) {
  const aParents = new Set(parentRefs(a));
  if (aParents.size === 0) return false;
  return parentRefs(b).some((id) => aParents.has(id));
}

function getSingleReciprocalPartner(
  node: FamilyNode,
  byId: Map<string, FamilyNode>
): FamilyNode | null {
  const partners = uniq(node.partners || [])
    .map((id) => byId.get(id))
    .filter((partner): partner is FamilyNode => Boolean(partner))
    .filter((partner) => (partner.partners || []).includes(node.id));

  return partners.length === 1 ? partners[0] : null;
}

function inferUnionStatus(
  partnerIds: string[],
  byId: Map<string, FamilyNode>,
  fallback: FamilyUnionStatus
): FamilyUnionStatus {
  const ordered = orderedIds(partnerIds);
  if (ordered.length <= 1) return fallback;
  const reciprocal = ordered.every((id) => {
    const person = byId.get(id);
    if (!person) return false;
    return ordered
      .filter((partnerId) => partnerId !== id)
      .every((partnerId) => (person.partners || []).includes(partnerId));
  });
  return reciprocal ? "married" : "unknown";
}

function clonePerson(node: FamilyNode): FamilyNode {
  return {
    ...node,
    parentIds: uniq(node.parentIds || []),
    adoptiveParentIds: uniq(node.adoptiveParentIds || []),
    partners: uniq(node.partners || []),
    childrenIds: uniq(node.childrenIds || []),
    content: {
      description: node.content?.description || "",
      media: Array.isArray(node.content?.media) ? node.content.media : [],
      ...(node.content?.instagram ? { instagram: node.content.instagram } : {}),
      ...(node.content?.tiktok ? { tiktok: node.content.tiktok } : {}),
      ...(node.content?.linkedin ? { linkedin: node.content.linkedin } : {}),
    },
    works: node.works || [],
  };
}

export function buildFamilyGraph(
  nodes: FamilyNode[],
  options: BuildFamilyGraphOptions = {}
): FamilyGraph {
  const repairLegacyCoupleChildren = options.repairLegacyCoupleChildren ?? false;
  const persons = nodes.map(clonePerson);
  const byId = new Map(persons.map((person) => [person.id, person]));
  const unions = new Map<string, FamilyUnion>();
  const links = new Map<string, ParentChildLink>();

  const ensureUnion = (
    partnerIds: string[],
    fallbackStatus: FamilyUnionStatus
  ): FamilyUnion => {
    const validPartnerIds = uniq(partnerIds).filter((id) => byId.has(id));
    const id = makeFamilyUnionId(validPartnerIds);
    const existing = unions.get(id);
    if (existing) return existing;

    const union: FamilyUnion = {
      id,
      partnerIds: validPartnerIds,
      status: inferUnionStatus(validPartnerIds, byId, fallbackStatus),
      evidenceIds: [],
    };
    unions.set(id, union);
    return union;
  };

  const parentIdsByChild = new Map<string, Set<string>>();
  const addParentRef = (childId: string, parentId: string) => {
    if (!byId.has(childId) || !byId.has(parentId) || childId === parentId) {
      return;
    }
    const current = parentIdsByChild.get(childId) || new Set<string>();
    current.add(parentId);
    parentIdsByChild.set(childId, current);
  };

  for (const child of persons) {
    for (const parentId of parentRefs(child)) addParentRef(child.id, parentId);
  }

  for (const parent of persons) {
    for (const childId of uniq(parent.childrenIds || [])) {
      addParentRef(childId, parent.id);
    }
  }

  for (const [childId, parentSet] of parentIdsByChild.entries()) {
    let parentIds = Array.from(parentSet);
    if (parentIds.length === 1 && repairLegacyCoupleChildren) {
      const parent = byId.get(parentIds[0]);
      const child = byId.get(childId);
      const partner = parent ? getSingleReciprocalPartner(parent, byId) : null;
      if (
        parent &&
        child &&
        partner &&
        !sharesParent(parent, partner) &&
        !(partner.parentIds || []).includes(child.id) &&
        !(child.childrenIds || []).includes(partner.id)
      ) {
        parentIds = uniq([...parentIds, partner.id]);
      }
    }

    const union = ensureUnion(
      parentIds,
      parentIds.length > 1 ? "unknown" : "single_parent"
    );
    const link: ParentChildLink = {
      id: makeParentChildLinkId(union.id, childId, "biological"),
      parentUnitId: union.id,
      childId,
      relationType: "biological",
      confidence: "confirmed",
      evidenceIds: [],
    };
    links.set(link.id, link);
  }

  for (const child of persons) {
    for (const parentId of uniq(child.adoptiveParentIds || [])) {
      if (!byId.has(parentId) || parentId === child.id) continue;
      const union = ensureUnion([parentId], "adoptive_unit");
      const link: ParentChildLink = {
        id: makeParentChildLinkId(union.id, child.id, "adoptive"),
        parentUnitId: union.id,
        childId: child.id,
        relationType: "adoptive",
        confidence: "confirmed",
        evidenceIds: [],
      };
      links.set(link.id, link);
    }
  }

  for (const person of persons) {
    for (const partnerId of uniq(person.partners || [])) {
      if (!byId.has(partnerId) || person.id === partnerId) continue;
      ensureUnion([person.id, partnerId], "married");
    }
  }

  return {
    schemaVersion: 1,
    persons,
    unions: Array.from(unions.values()).sort((a, b) =>
      a.id.localeCompare(b.id)
    ),
    parentChildLinks: Array.from(links.values()).sort((a, b) =>
      a.id.localeCompare(b.id)
    ),
    evidence: [],
  };
}

export function deriveFamilyNodesFromGraph(
  graph: FamilyGraph,
  sourceNodes?: FamilyNode[]
): FamilyNode[] {
  const sourceById = new Map(
    (sourceNodes || graph.persons).map((person) => [person.id, person])
  );
  const byId = new Map<string, FamilyNode>();

  for (const person of graph.persons) {
    const source = sourceById.get(person.id) || person;
    byId.set(person.id, {
      ...clonePerson(source),
      parentId: null,
      parentIds: [],
      adoptiveParentIds: [],
      partners: [],
      childrenIds: [],
    });
  }

  const unionsById = new Map(graph.unions.map((union) => [union.id, union]));

  for (const union of graph.unions) {
    if (union.partnerIds.length < 2 || !PARTNER_STATUSES.has(union.status)) {
      continue;
    }
    for (const personId of union.partnerIds) {
      const person = byId.get(personId);
      if (!person) continue;
      const partners = union.partnerIds.filter((id) => id !== personId);
      person.partners = uniq([...person.partners, ...partners]);
    }
  }

  for (const link of graph.parentChildLinks) {
    const union = unionsById.get(link.parentUnitId);
    const child = byId.get(link.childId);
    if (!union || !child) continue;

    for (const parentId of union.partnerIds) {
      const parent = byId.get(parentId);
      if (!parent || parent.id === child.id) continue;

      if (BIOLOGICAL_LIKE.has(link.relationType)) {
        child.parentIds = uniq([...(child.parentIds || []), parent.id]);
        parent.childrenIds = uniq([...parent.childrenIds, child.id]);
      } else {
        child.adoptiveParentIds = uniq([
          ...(child.adoptiveParentIds || []),
          parent.id,
        ]);
      }
    }

    child.parentId = child.parentIds?.[0] ?? null;
  }

  for (const node of byId.values()) {
    node.parentIds = uniq(node.parentIds || []);
    node.adoptiveParentIds = uniq(node.adoptiveParentIds || []).filter(
      (id) => !node.parentIds?.includes(id)
    );
    node.partners = uniq(node.partners || []);
    node.childrenIds = uniq(node.childrenIds || []);
    node.parentId = node.parentIds[0] ?? null;
  }

  return graph.persons.map((person) => byId.get(person.id)!).filter(Boolean);
}

export function rebuildFamilyNodeCaches(nodes: FamilyNode[]): FamilyNode[] {
  return deriveFamilyNodesFromGraph(buildFamilyGraph(nodes), nodes);
}

export function validateFamilyGraph(graph: FamilyGraph): {
  valid: boolean;
  issues: FamilyGraphIssue[];
} {
  const issues: FamilyGraphIssue[] = [];
  const personIds = new Set(graph.persons.map((person) => person.id));
  const unionIds = new Set<string>();
  const linkIds = new Set<string>();

  for (const union of graph.unions) {
    if (unionIds.has(union.id)) {
      issues.push({
        code: "duplicate-union",
        unionId: union.id,
        message: `Duplicate union id: ${union.id}`,
      });
    }
    unionIds.add(union.id);

    for (const partnerId of union.partnerIds) {
      if (!personIds.has(partnerId)) {
        issues.push({
          code: "missing-union-partner",
          unionId: union.id,
          nodeId: partnerId,
          message: `Union ${union.id} references missing person ${partnerId}`,
        });
      }
    }
  }

  for (const link of graph.parentChildLinks) {
    if (linkIds.has(link.id)) {
      issues.push({
        code: "duplicate-parent-child-link",
        linkId: link.id,
        message: `Duplicate parent-child link id: ${link.id}`,
      });
    }
    linkIds.add(link.id);

    const union = graph.unions.find((item) => item.id === link.parentUnitId);
    if (!union) {
      issues.push({
        code: "missing-parent-unit",
        linkId: link.id,
        unionId: link.parentUnitId,
        message: `Parent-child link ${link.id} references missing parent unit`,
      });
    }
    if (!personIds.has(link.childId)) {
      issues.push({
        code: "missing-child",
        linkId: link.id,
        nodeId: link.childId,
        message: `Parent-child link ${link.id} references missing child`,
      });
    }
    if (union?.partnerIds.includes(link.childId)) {
      issues.push({
        code: "self-parent-child-link",
        linkId: link.id,
        nodeId: link.childId,
        message: `Parent-child link ${link.id} makes a person their own parent`,
      });
    }
  }

  return { valid: issues.length === 0, issues };
}

export function parentChildLinkMetadata(
  link: ParentChildLink
): Record<string, unknown> {
  return {
    familyGraph: {
      entity: "parentChildLink",
      linkId: link.id,
      parentUnitId: link.parentUnitId,
      relationType: link.relationType,
      confidence: link.confidence || "confirmed",
      evidenceIds: link.evidenceIds || [],
    },
  };
}

export function unionMetadata(union: FamilyUnion): Record<string, unknown> {
  return {
    familyGraph: {
      entity: "union",
      unionId: union.id,
      status: union.status,
      evidenceIds: union.evidenceIds || [],
    },
  };
}

export function relationTypeToEdgeKind(
  relationType: ParentChildRelationType
): "biological-parent" | "adoptive-parent" {
  return BIOLOGICAL_LIKE.has(relationType)
    ? "biological-parent"
    : "adoptive-parent";
}
