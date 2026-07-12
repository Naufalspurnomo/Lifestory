import {
  FamilyNode,
  LayoutEdge,
  LayoutGraph,
  Person,
  Union,
  LAYOUT,
} from "../types/tree";
import { makeFamilyUnionId } from "./unionId";

const {
  NODE_SIZE,
  CARD_WIDTH,
  CARD_HEIGHT,
  NODE_SPACING_X,
  NODE_SPACING_Y,
  PARTNER_GAP,
  CANVAS_PADDING,
} = LAYOUT;

const PARTNER_CENTER_GAP = NODE_SIZE + PARTNER_GAP;
const DESCENDANT_CENTER_GAP = NODE_SIZE + Math.round(NODE_SPACING_X * 0.45);
// Adjacent row-blocks represent family branches, not just individual cards.
// Keep this wide enough that connector buses from different subtrees do not
// visually collide when each side has children of its own.
const ROW_BLOCK_GAP = Math.round(NODE_SPACING_X * 1.05);
const MAX_LAYER_ITERATIONS = 250;
const MAX_LAYOUT_ITERATIONS = 40;
const CONVERGENCE_EPSILON = 0.5; // px — stop when no block moves more than this in a pass

type InternalGraph = {
  persons: Map<string, PersonNode>;
  unions: Map<string, UnionNode>;
  // child id -> list of adoptive parent ids (edges only; not used for generation)
  adoptions: Map<string, string[]>;
  // The "self" node (user's own position in the tree). When present, layers
  // are computed relative to this anchor so ancestors/descendants always land
  // on the generation the user would expect, even if one side of the family
  // has more ancestors than the other.
  anchorId?: string;
};

type PersonNode = Person & {
  unionIds: string[];
  parentUnionId?: string;
  layer: number;
  x: number;
  y: number;
  order: number;
  siblingOrder?: number;
};

type UnionNode = Union & {
  layer: number;
  x: number;
  y: number;
};

type RowBlock = {
  id: string;
  personIds: string[];
  layer: number;
  width: number;
  target: number;
  center: number;
  order: number;
};

function uniq(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function average(values: number[]): number | null {
  const finite = values.filter(Number.isFinite);
  if (finite.length === 0) return null;
  return finite.reduce((sum, value) => sum + value, 0) / finite.length;
}

function comparePersons(a: PersonNode, b: PersonNode): number {
  const aYear = a.birthDate ? Number(a.birthDate) : Number.POSITIVE_INFINITY;
  const bYear = b.birthDate ? Number(b.birthDate) : Number.POSITIVE_INFINITY;
  if (aYear !== bYear) return aYear - bYear;

  const byLabel = a.label.localeCompare(b.label, "id", {
    sensitivity: "base",
  });
  if (byLabel !== 0) return byLabel;

  return a.id.localeCompare(b.id);
}

function ensureUnion(
  g: InternalGraph,
  partnerIds: string[],
  type: Union["type"] = "relationship"
): string | null {
  const validPartnerIds = uniq(partnerIds).filter((id) => g.persons.has(id));
  if (validPartnerIds.length === 0) return null;

  const unionId = makeFamilyUnionId(validPartnerIds);
  let union = g.unions.get(unionId);

  if (!union) {
    union = {
      id: unionId,
      partnerIds: validPartnerIds,
      childrenIds: [],
      type,
      layer: 0,
      x: 0,
      y: 0,
    };
    g.unions.set(unionId, union);
  } else {
    union.partnerIds = uniq([...union.partnerIds, ...validPartnerIds]);
    if (union.type === "relationship" && type === "marriage") {
      union.type = type;
    }
  }

  for (const partnerId of union.partnerIds) {
    const person = g.persons.get(partnerId);
    if (person && !person.unionIds.includes(unionId)) {
      person.unionIds.push(unionId);
    }
  }

  return unionId;
}

function getParentIds(node: FamilyNode, persons: Map<string, PersonNode>) {
  return uniq([
    ...(Array.isArray(node.parentIds) ? node.parentIds : []),
    ...(node.parentId ? [node.parentId] : []),
  ]).filter((id) => persons.has(id));
}

function getAdoptiveParentIds(
  node: FamilyNode,
  persons: Map<string, PersonNode>
) {
  return uniq(
    Array.isArray(node.adoptiveParentIds) ? node.adoptiveParentIds : []
  ).filter((id) => persons.has(id));
}

function buildInternalGraph(nodes: FamilyNode[]): InternalGraph {
  const g: InternalGraph = {
    persons: new Map<string, PersonNode>(),
    unions: new Map<string, UnionNode>(),
    adoptions: new Map<string, string[]>(),
  };

  // Record the self-anchor, if the user has flagged one. First match wins;
  // multiple "self" nodes in one tree would be a data error anyway.
  const anchorNode = nodes.find((n) => n.line === "self");
  if (anchorNode) g.anchorId = anchorNode.id;

  nodes.forEach((node, index) => {
    g.persons.set(node.id, {
      id: node.id,
      label: node.label,
      sex: node.sex || "X",
      birthDate: node.year?.toString(),
      deathDate: node.deathYear?.toString(),
      imageUrl: node.imageUrl || undefined,
      unionIds: [],
      parentUnionId: undefined,
      layer: 0,
      x: 0,
      y: 0,
      order: index,
      siblingOrder:
        typeof node.siblingOrder === "number" ? node.siblingOrder : undefined,
    });
  });

  for (const node of nodes) {
    for (const partnerId of node.partners || []) {
      ensureUnion(g, [node.id, partnerId], "marriage");
    }
  }

  for (const node of nodes) {
    const parentIds = getParentIds(node, g.persons);
    const unionId = ensureUnion(g, parentIds, "relationship");
    if (!unionId) continue;

    const union = g.unions.get(unionId)!;
    if (!union.childrenIds.includes(node.id)) {
      union.childrenIds.push(node.id);
    }

    const child = g.persons.get(node.id);
    if (child) child.parentUnionId = unionId;
  }

  // Record adoptive relations separately (do not collapse into biological union)
  for (const node of nodes) {
    const adoptive = getAdoptiveParentIds(node, g.persons);
    if (adoptive.length === 0) continue;
    g.adoptions.set(node.id, adoptive);
  }

  for (const parentNode of nodes) {
    for (const childId of parentNode.childrenIds || []) {
      const child = g.persons.get(childId);
      if (!child || child.parentUnionId) continue;

      const originalChild = nodes.find((node) => node.id === childId);
      const parentIds = originalChild
        ? getParentIds(originalChild, g.persons)
        : [];
      const unionId = ensureUnion(
        g,
        parentIds.length > 0 ? parentIds : [parentNode.id],
        "relationship"
      );
      if (!unionId) continue;

      const union = g.unions.get(unionId)!;
      if (!union.childrenIds.includes(childId)) {
        union.childrenIds.push(childId);
      }
      child.parentUnionId = unionId;
    }
  }

  return g;
}

// Anchor-based layering: compute each person's layer relative to the "self"
// node by BFS across parent/partner/child edges. This matches how people
// naturally think about generations in a personal family tree: "my parents"
// are one level up regardless of how many ancestors their spouse has.
function assignLayersAnchored(g: InternalGraph, anchorId: string): boolean {
  const anchor = g.persons.get(anchorId);
  if (!anchor) return false;

  const layerOf = new Map<string, number>();
  layerOf.set(anchorId, 0);

  // BFS queue of ids left to propagate from.
  const queue: string[] = [anchorId];

  const enqueue = (id: string, layer: number) => {
    const prev = layerOf.get(id);
    if (prev !== undefined && prev === layer) return;
    // If we've already visited with a different layer, prefer the one closer
    // to the anchor (smaller absolute value) — keeps the anchor visually
    // central when cycles or cross-links exist.
    if (prev !== undefined && Math.abs(prev) <= Math.abs(layer)) return;
    layerOf.set(id, layer);
    queue.push(id);
  };

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentLayer = layerOf.get(current)!;
    const person = g.persons.get(current);
    if (!person) continue;

    // Parents → one layer up.
    if (person.parentUnionId) {
      const parentUnion = g.unions.get(person.parentUnionId);
      if (parentUnion) {
        for (const parentId of parentUnion.partnerIds) {
          if (parentId === current) continue;
          enqueue(parentId, currentLayer - 1);
        }
      }
    }

    // Partners → same layer.
    for (const unionId of person.unionIds) {
      const union = g.unions.get(unionId);
      if (!union) continue;
      for (const partnerId of union.partnerIds) {
        if (partnerId === current) continue;
        enqueue(partnerId, currentLayer);
      }
      // Children via this union → one layer down.
      for (const childId of union.childrenIds) {
        enqueue(childId, currentLayer + 1);
      }
    }
  }

  // Some nodes may be unreachable from the anchor (disconnected branches).
  // Fall back to computing their layer from their own ancestors using the
  // absolute-depth method, then align the subgraph to its closest reachable
  // neighbour. If nothing connects back, leave them at layer 0.
  const unreached = new Set<string>();
  g.persons.forEach((_, id) => {
    if (!layerOf.has(id)) unreached.add(id);
  });

  if (unreached.size > 0) {
    const memo = new Map<string, number>();
    const computeDepth = (id: string, visiting = new Set<string>()): number => {
      if (memo.has(id)) return memo.get(id)!;
      if (visiting.has(id)) return 0;
      visiting.add(id);
      const p = g.persons.get(id);
      let depth = 0;
      if (p?.parentUnionId) {
        const pu = g.unions.get(p.parentUnionId);
        if (pu) {
          for (const parentId of pu.partnerIds) {
            if (parentId === id) continue;
            depth = Math.max(depth, computeDepth(parentId, visiting) + 1);
          }
        }
      }
      visiting.delete(id);
      memo.set(id, depth);
      return depth;
    };

    for (const id of unreached) {
      layerOf.set(id, computeDepth(id));
    }
  }

  g.persons.forEach((person) => {
    person.layer = layerOf.get(person.id) ?? 0;
  });

  return true;
}

function assignLayers(g: InternalGraph) {
  if (g.anchorId && assignLayersAnchored(g, g.anchorId)) {
    // Anchor path handled layer assignment. Still need to run the consistency
    // pass below so unions and partners share a layer.
  } else {
    // Fallback: absolute depth from the oldest ancestor. Used for trees that
    // don't mark a "self" node (e.g. historical dynasties, imports).
    const visiting = new Set<string>();
    const memo = new Map<string, number>();

    const computePersonLayer = (personId: string): number => {
      if (memo.has(personId)) return memo.get(personId)!;
      if (visiting.has(personId)) return 0;

      visiting.add(personId);
      const person = g.persons.get(personId);
      let layer = 0;

      if (person?.parentUnionId) {
        const parentUnion = g.unions.get(person.parentUnionId);
        if (parentUnion) {
          for (const parentId of parentUnion.partnerIds) {
            if (parentId === personId) continue;
            layer = Math.max(layer, computePersonLayer(parentId) + 1);
          }
        }
      }

      visiting.delete(personId);
      memo.set(personId, layer);
      return layer;
    };

    g.persons.forEach((person) => {
      person.layer = computePersonLayer(person.id);
    });
  }

  // Reconcile: make sure partners share a layer and children sit one layer
  // below their union. Without this, an anchored child of a partner that
  // wasn't yet visited could float one row too high.
  let changed = true;
  let iterations = 0;

  while (changed && iterations < MAX_LAYER_ITERATIONS) {
    changed = false;
    iterations++;

    g.unions.forEach((union) => {
      const partnerLayers = union.partnerIds
        .map((id) => g.persons.get(id)?.layer)
        .filter((layer): layer is number => typeof layer === "number");
      const unionLayer = Math.max(-Infinity, ...partnerLayers);

      if (partnerLayers.length > 0 && union.layer !== unionLayer) {
        union.layer = unionLayer;
        changed = true;
      }

      for (const partnerId of union.partnerIds) {
        const partner = g.persons.get(partnerId);
        if (partner && partner.layer < unionLayer) {
          partner.layer = unionLayer;
          changed = true;
        }
      }

      for (const childId of union.childrenIds) {
        const child = g.persons.get(childId);
        if (child && child.layer < unionLayer + 1) {
          child.layer = unionLayer + 1;
          changed = true;
        }
      }
    });

    g.adoptions.forEach((parentIds, childId) => {
      const child = g.persons.get(childId);
      const parentLayers = parentIds
        .map((parentId) => g.persons.get(parentId)?.layer)
        .filter((layer): layer is number => typeof layer === "number");
      if (!child || parentLayers.length === 0) return;
      const requiredLayer = Math.max(...parentLayers) + 1;
      if (child.layer < requiredLayer) {
        child.layer = requiredLayer;
        changed = true;
      }
    });
  }

  // Normalize so the smallest layer is 0. The rest of the pipeline assumes
  // non-negative layers for y-coordinate math.
  let minLayer = Infinity;
  g.persons.forEach((person) => {
    minLayer = Math.min(minLayer, person.layer);
  });

  const offset = Number.isFinite(minLayer) ? minLayer : 0;
  g.persons.forEach((person) => {
    person.layer -= offset;
  });

  g.unions.forEach((union) => {
    const partnerLayers = union.partnerIds
      .map((id) => g.persons.get(id)?.layer)
      .filter((layer): layer is number => typeof layer === "number");
    union.layer = Math.max(0, ...partnerLayers);
  });
}

function getMaxLayer(g: InternalGraph) {
  let maxLayer = 0;
  g.persons.forEach((person) => {
    maxLayer = Math.max(maxLayer, person.layer);
  });
  return maxLayer;
}

function createDisjointSet(ids: string[]) {
  const parent = new Map(ids.map((id) => [id, id]));

  const find = (id: string): string => {
    const current = parent.get(id);
    if (!current || current === id) return id;
    const root = find(current);
    parent.set(id, root);
    return root;
  };

  const join = (a: string, b: string) => {
    const rootA = find(a);
    const rootB = find(b);
    if (rootA !== rootB) parent.set(rootB, rootA);
  };

  return { find, join };
}

function getPersonIdsByLayer(g: InternalGraph, layer: number) {
  return Array.from(g.persons.values())
    .filter((person) => person.layer === layer)
    .sort(comparePersons)
    .map((person) => person.id);
}

function sortBlockPersonIds(g: InternalGraph, ids: string[]) {
  return [...ids].sort((aId, bId) => {
    const a = g.persons.get(aId)!;
    const b = g.persons.get(bId)!;
    const aParentUnionX = a.parentUnionId
      ? g.unions.get(a.parentUnionId)?.x
      : undefined;
    const bParentUnionX = b.parentUnionId
      ? g.unions.get(b.parentUnionId)?.x
      : undefined;
    if (
      typeof aParentUnionX === "number" &&
      typeof bParentUnionX === "number" &&
      Number.isFinite(aParentUnionX) &&
      Number.isFinite(bParentUnionX) &&
      Math.abs(aParentUnionX - bParentUnionX) > 0.001
    ) {
      return aParentUnionX - bParentUnionX;
    }

    const byX = a.x - b.x;
    if (Math.abs(byX) > 0.001) return byX;
    return comparePersons(a, b);
  });
}

function getChildIdsForPersons(g: InternalGraph, personIds: string[]) {
  const children: string[] = [];
  const seenUnions = new Set<string>();

  for (const personId of personIds) {
    const person = g.persons.get(personId);
    if (!person) continue;

    for (const unionId of person.unionIds) {
      if (seenUnions.has(unionId)) continue;
      seenUnions.add(unionId);

      const union = g.unions.get(unionId);
      if (!union) continue;
      children.push(...union.childrenIds);
    }
  }

  return uniq(children).filter((id) => g.persons.has(id));
}

function countDescendantLeaves(
  g: InternalGraph,
  personId: string,
  visiting = new Set<string>()
): number {
  if (visiting.has(personId)) return 1;

  const person = g.persons.get(personId);
  if (!person) return 1;

  visiting.add(personId);
  const children = getChildIdsForPersons(g, [personId]);
  const total =
    children.length > 0
      ? children.reduce(
          (sum, childId) => sum + countDescendantLeaves(g, childId, visiting),
          0
        )
      : 1;
  visiting.delete(personId);

  return Math.max(1, total);
}

function calculateSubtreeAwareWidth(
  g: InternalGraph,
  personIds: string[],
  partnerWidth: number
): number {
  const childIds = getChildIdsForPersons(g, personIds);
  if (childIds.length === 0) return partnerWidth;

  const leafCount = childIds.reduce(
    (sum, childId) => sum + countDescendantLeaves(g, childId),
    0
  );
  const descendantWidth =
    NODE_SIZE + Math.max(0, leafCount - 1) * DESCENDANT_CENTER_GAP;

  return Math.max(partnerWidth, descendantWidth);
}

function makeRowBlocks(g: InternalGraph, layer: number): RowBlock[] {
  const ids = getPersonIdsByLayer(g, layer);
  const dsu = createDisjointSet(ids);
  const idSet = new Set(ids);

  g.unions.forEach((union) => {
    const sameLayerPartners = union.partnerIds.filter((id) => {
      const person = g.persons.get(id);
      return person && person.layer === layer && idSet.has(id);
    });

    for (let index = 1; index < sameLayerPartners.length; index++) {
      dsu.join(sameLayerPartners[0], sameLayerPartners[index]);
    }

  });

  const groups = new Map<string, string[]>();
  for (const id of ids) {
    const root = dsu.find(id);
    groups.set(root, [...(groups.get(root) || []), id]);
  }

  return Array.from(groups.values()).map((groupIds) => {
    const personIds = sortBlockPersonIds(g, groupIds);
    const partnerWidth =
      NODE_SIZE + Math.max(0, personIds.length - 1) * PARTNER_CENTER_GAP;
    const width = calculateSubtreeAwareWidth(g, personIds, partnerWidth);
    const xs = personIds.map((id) => g.persons.get(id)!.x);
    const center = average(xs) ?? 0;
    const order = Math.min(...personIds.map((id) => g.persons.get(id)!.order));

    return {
      id: `row-${layer}-${personIds.join("-")}`,
      personIds,
      layer,
      width,
      target: center,
      center,
      order,
    };
  });
}

function calculateUnionCoordinates(g: InternalGraph) {
  g.unions.forEach((union) => {
    const partnerXs = union.partnerIds
      .map((id) => g.persons.get(id)?.x)
      .filter((x): x is number => Number.isFinite(x));
    const childXs = union.childrenIds
      .map((id) => g.persons.get(id)?.x)
      .filter((x): x is number => Number.isFinite(x));

    const partnerCenter = average(partnerXs);
    const childCenter = average(childXs);

    // Anchor the union at the partner midpoint — keeps the spouse edge honest.
    if (partnerCenter !== null) {
      union.x = partnerCenter;
      if (union.type !== "marriage" && partnerXs.length > 1) {
        const sorted = [...partnerXs].sort((a, b) => a - b);
        const safeGaps = sorted
          .slice(0, -1)
          .map((left, index) => {
            const right = sorted[index + 1];
            return right - left > CARD_WIDTH + 8
              ? (left + right) / 2
              : null;
          })
          .filter((x): x is number => x !== null);
        if (safeGaps.length > 0) {
          union.x = safeGaps.reduce((closest, candidate) =>
            Math.abs(candidate - partnerCenter) < Math.abs(closest - partnerCenter)
              ? candidate
              : closest
          );
        }
      }
    } else if (childCenter !== null) {
      union.x = childCenter;
    }

    union.y = union.layer * NODE_SPACING_Y;
  });
}

// Top-down alignment pass. Slides each entire layer so that the "vertical
// spine" feels right: partners at layer N sit above the centre of their
// children at layer N+1. Without this, sibling-packing at lower layers can
// drift laterally from their ancestor union. Run after the main barycentric
// sweeps have converged.
function alignLayersToSpine(g: InternalGraph) {
  const maxLayer = getMaxLayer(g);
  for (let layer = 0; layer < maxLayer; layer++) {
    // For each union on this layer, compute desired shift so union.x matches
    // the centre of its children on layer+1. Average those shifts to move
    // the parents-layer as a whole (avoids scrambling siblings).
    const shifts: number[] = [];
    g.unions.forEach((union) => {
      if (union.layer !== layer) return;
      const childXs = union.childrenIds
        .map((id) => g.persons.get(id)?.x)
        .filter((x): x is number => Number.isFinite(x));
      if (childXs.length === 0) return;
      const childCenter =
        childXs.reduce((a, b) => a + b, 0) / childXs.length;
      shifts.push(childCenter - union.x);
    });
    if (shifts.length === 0) continue;
    const shift = shifts.reduce((a, b) => a + b, 0) / shifts.length;
    if (Math.abs(shift) < CONVERGENCE_EPSILON) continue;

    g.persons.forEach((person) => {
      if (person.layer !== layer) return;
      person.x += shift;
    });
    g.unions.forEach((union) => {
      if (union.layer !== layer) return;
      union.x += shift;
    });
  }
}

// In a down-sweep we pull each block towards the average position of its
// parent unions — i.e. children align under their parents.
function calculateDownSweepTarget(
  g: InternalGraph,
  block: RowBlock
): number {
  const targets: number[] = [];
  for (const personId of block.personIds) {
    const person = g.persons.get(personId);
    if (!person) continue;
    if (person.parentUnionId) {
      const parentUnion = g.unions.get(person.parentUnionId);
      if (parentUnion && Number.isFinite(parentUnion.x)) {
        targets.push(parentUnion.x);
      }
    }
  }
  // Fallback: keep current center if no parent found.
  return average(targets) ?? block.center;
}

// In an up-sweep we pull each block towards the centre of its children
// (aggregated across all unions the block participates in). This is the
// force that keeps parents "above their brood" instead of drifting away.
function calculateUpSweepTarget(
  g: InternalGraph,
  block: RowBlock
): number {
  const childCenters: number[] = [];
  const unionsSeen = new Set<string>();

  for (const personId of block.personIds) {
    const person = g.persons.get(personId);
    if (!person) continue;
    for (const unionId of person.unionIds) {
      if (unionsSeen.has(unionId)) continue;
      unionsSeen.add(unionId);
      const union = g.unions.get(unionId);
      if (!union) continue;
      const xs = union.childrenIds
        .map((id) => g.persons.get(id)?.x)
        .filter((x): x is number => Number.isFinite(x));
      const avg = average(xs);
      if (avg !== null) childCenters.push(avg);
    }
  }

  return average(childCenters) ?? block.center;
}

function placeBlock(g: InternalGraph, block: RowBlock) {
  const personIds = sortBlockPersonIds(g, block.personIds);
  const firstCenter =
    block.center - ((personIds.length - 1) * PARTNER_CENTER_GAP) / 2;

  personIds.forEach((personId, index) => {
    const person = g.persons.get(personId);
    if (!person) return;
    person.x = firstCenter + index * PARTNER_CENTER_GAP;
    person.y = block.layer * NODE_SPACING_Y;
  });
}

function compareSiblingBlocks(
  g: InternalGraph,
  a: RowBlock,
  b: RowBlock
): number {
  const aParentIds = new Set(
    a.personIds
      .map((id) => g.persons.get(id)?.parentUnionId)
      .filter((id): id is string => Boolean(id))
  );
  const sharedParentIds = b.personIds
    .map((id) => g.persons.get(id)?.parentUnionId)
    .filter(
      (id): id is string => id !== undefined && aParentIds.has(id)
    );

  if (sharedParentIds.length !== 1) return 0;
  const parentUnionId = sharedParentIds[0];
  const membersForParent = (block: RowBlock) =>
    block.personIds
      .map((id) => g.persons.get(id))
      .filter(
        (person): person is PersonNode =>
          person !== undefined && person.parentUnionId === parentUnionId
      )
      .sort(comparePersons);

  const aMembers = membersForParent(a);
  const bMembers = membersForParent(b);
  if (aMembers.length === 0 || bMembers.length === 0) return 0;

  const aManual = aMembers
    .map((person) => person.siblingOrder)
    .filter((order): order is number => typeof order === "number");
  const bManual = bMembers
    .map((person) => person.siblingOrder)
    .filter((order): order is number => typeof order === "number");

  if (aManual.length > 0 && bManual.length > 0) {
    const byManual = Math.min(...aManual) - Math.min(...bManual);
    if (byManual !== 0) return byManual;
  }

  return comparePersons(aMembers[0], bMembers[0]);
}

function packAndPlaceBlocks(g: InternalGraph, blocks: RowBlock[]) {
  // A manual sibling order is a hard left-to-right constraint. Coordinates
  // remain automatic so connectors and whole branches stay valid.
  blocks.sort((a, b) => {
    const bySiblingOrder = compareSiblingBlocks(g, a, b);
    if (bySiblingOrder !== 0) return bySiblingOrder;
    const byTarget = a.target - b.target;
    if (Math.abs(byTarget) > 0.001) return byTarget;
    const ancA = computeAncestryOrder(g, a);
    const ancB = computeAncestryOrder(g, b);
    if (Math.abs(ancA - ancB) > 0.001) return ancA - ancB;
    return a.order - b.order;
  });

  let cursor = 0;
  for (const block of blocks) {
    const desiredLeft = block.target - block.width / 2;
    const left = Math.max(desiredLeft, cursor);
    block.center = left + block.width / 2;
    cursor = left + block.width + ROW_BLOCK_GAP;
  }

  const targetMean = average(blocks.map((block) => block.target));
  const centerMean = average(blocks.map((block) => block.center));
  const shift =
    targetMean !== null && centerMean !== null ? targetMean - centerMean : 0;

  for (const block of blocks) {
    block.center += shift;
    placeBlock(g, block);
  }
}

// Seed order for a block on layer N = parent's x on layer N-1. This way
// when we first initialize coordinates, siblings from the same parent come
// out side-by-side instead of interleaved with siblings from other parents.
function computeAncestryOrder(g: InternalGraph, block: RowBlock): number {
  const ancestorXs: number[] = [];
  for (const personId of block.personIds) {
    const person = g.persons.get(personId);
    if (!person) continue;
    if (person.parentUnionId) {
      const parentUnion = g.unions.get(person.parentUnionId);
      if (parentUnion && Number.isFinite(parentUnion.x)) {
        ancestorXs.push(parentUnion.x);
      }
    }
  }
  return ancestorXs.length > 0
    ? ancestorXs.reduce((a, b) => a + b, 0) / ancestorXs.length
    : block.order;
}

function initializeCoordinates(g: InternalGraph) {
  const maxLayer = getMaxLayer(g);

  for (let layer = 0; layer <= maxLayer; layer++) {
    const blocks = makeRowBlocks(g, layer);
    // Sort by ancestry centre (so siblings from the same parent cluster),
    // then by birth year/manual sibling order as a stable tie-breaker.
    blocks.sort((a, b) => {
      const bySiblingOrder = compareSiblingBlocks(g, a, b);
      if (bySiblingOrder !== 0) return bySiblingOrder;
      const ancA = computeAncestryOrder(g, a);
      const ancB = computeAncestryOrder(g, b);
      if (Math.abs(ancA - ancB) > 0.001) return ancA - ancB;
      return a.order - b.order;
    });
    let cursor = 0;
    for (const block of blocks) {
      block.center = cursor + block.width / 2;
      block.target = block.center;
      placeBlock(g, block);
      cursor += block.width + ROW_BLOCK_GAP;
    }
    calculateUnionCoordinates(g);
  }
}

function assignCoordinates(g: InternalGraph) {
  initializeCoordinates(g);
  const maxLayer = getMaxLayer(g);

  // Two-sweep barycentric refinement with convergence check.
  // - Down-sweep (top → bottom): each layer's blocks slide towards the
  //   centre of their parent unions. Children align beneath parents.
  // - Up-sweep (bottom → top): each layer's blocks slide towards the
  //   centre of their own children. Parents align above their brood.
  // We alternate until the largest movement in a full pass drops below
  // CONVERGENCE_EPSILON. Bounded by MAX_LAYOUT_ITERATIONS as a safeguard
  // against pathological graphs.
  for (let iteration = 0; iteration < MAX_LAYOUT_ITERATIONS; iteration++) {
    let maxShift = 0;

    // Down-sweep
    calculateUnionCoordinates(g);
    for (let layer = 1; layer <= maxLayer; layer++) {
      const blocks = makeRowBlocks(g, layer);
      for (const block of blocks) {
        const before = block.center;
        block.target = calculateDownSweepTarget(g, block);
        block.center = block.target; // seed; pack will correct overlaps
        maxShift = Math.max(maxShift, Math.abs(block.center - before));
      }
      packAndPlaceBlocks(g, blocks);
    }

    // Up-sweep
    calculateUnionCoordinates(g);
    for (let layer = maxLayer - 1; layer >= 0; layer--) {
      const blocks = makeRowBlocks(g, layer);
      for (const block of blocks) {
        const before = block.center;
        block.target = calculateUpSweepTarget(g, block);
        block.center = block.target;
        maxShift = Math.max(maxShift, Math.abs(block.center - before));
      }
      packAndPlaceBlocks(g, blocks);
    }

    if (maxShift < CONVERGENCE_EPSILON) break;
  }

  // Final alignment: slide each layer so ancestor unions sit above the
  // centre of their descendants' row, eliminating residual lateral drift
  // that barycentric sweeps alone can leave behind.
  alignLayersToSpine(g);
  calculateUnionCoordinates(g);

  // One final top-down pass after spine alignment keeps local child groups
  // tucked under their actual parent union. This matters for very large trees:
  // moving a whole ancestor layer can otherwise leave small side branches with
  // long horizontal connectors even though the graph is technically valid.
  for (let layer = 1; layer <= maxLayer; layer++) {
    const blocks = makeRowBlocks(g, layer);
    for (const block of blocks) {
      block.target = calculateDownSweepTarget(g, block);
      block.center = block.target;
    }
    packAndPlaceBlocks(g, blocks);
    calculateUnionCoordinates(g);
  }
}

function normalizeCoordinates(g: InternalGraph) {
  let minX = Infinity;
  let minY = Infinity;

  g.persons.forEach((person) => {
    minX = Math.min(minX, person.x - NODE_SIZE / 2);
    minY = Math.min(minY, person.y - NODE_SIZE / 2);
  });

  g.unions.forEach((union) => {
    minX = Math.min(minX, union.x);
    minY = Math.min(minY, union.y);
  });

  const offsetX = CANVAS_PADDING - (Number.isFinite(minX) ? minX : 0);
  const offsetY = CANVAS_PADDING - (Number.isFinite(minY) ? minY : 0);

  g.persons.forEach((person) => {
    person.x += offsetX;
    person.y += offsetY;
  });

  g.unions.forEach((union) => {
    union.x += offsetX;
    union.y += offsetY;
  });
}

function findClearChildChannelX(g: InternalGraph, union: UnionNode): number {
  const partnerIds = new Set(union.partnerIds);
  const blockers = Array.from(g.persons.values())
    .filter((person) => person.layer === union.layer && !partnerIds.has(person.id))
    .sort((a, b) => a.x - b.x);
  const clearance = CARD_WIDTH / 2 + 10;
  const candidates = [
    union.x,
    ...blockers.slice(0, -1).map((person, index) =>
      (person.x + blockers[index + 1].x) / 2
    ),
    ...(blockers.length > 0
      ? [blockers[0].x - clearance, blockers[blockers.length - 1].x + clearance]
      : []),
  ];

  return candidates
    .filter((candidate) =>
      blockers.every((person) => Math.abs(candidate - person.x) > clearance)
    )
    .sort((a, b) => Math.abs(a - union.x) - Math.abs(b - union.x))[0] ?? union.x;
}

function routeEdges(g: InternalGraph): LayoutEdge[] {
  const edges: LayoutEdge[] = [];
  const unions = Array.from(g.unions.values());
  const middleLane = new Map<string, number>();
  const laneByRow = new Map<number, number>();

  // Keep the normal spouse rule in the visual middle of the two cards. Only
  // use a lower fallback lane when another card sits between remarried
  // partners; a direct middle line would then cut through that card.
  unions
    .filter((union) => union.type === "marriage" && union.partnerIds.length >= 2)
    .sort((a, b) => a.id.localeCompare(b.id))
    .forEach((union) => {
      const row = union.layer;
      const lane = laneByRow.get(row) || 0;
      laneByRow.set(row, lane + 1);
      middleLane.set(union.id, lane);
    });

  unions.forEach((union) => {
    const partners = union.partnerIds
      .map((id) => g.persons.get(id))
      .filter((person): person is PersonNode => Boolean(person))
      .sort((a, b) => a.x - b.x);

    if (union.type === "marriage" && partners.length >= 2) {
      const y = average(partners.map((partner) => partner.y)) ?? union.y;
      const left = partners[0];
      const right = partners[partners.length - 1];
      const partnerIds = new Set(partners.map((partner) => partner.id));
      const hasBlockingCard = Array.from(g.persons.values()).some(
        (person) =>
          person.layer === union.layer &&
          !partnerIds.has(person.id) &&
          person.x > left.x &&
          person.x < right.x
      );
      const lane = middleLane.get(union.id) || 0;
      const leftEdge = left.x + NODE_SIZE / 2;
      const rightEdge = right.x - NODE_SIZE / 2;
      const laneY = y + CARD_HEIGHT / 2 + 18 + lane * 18;
      edges.push({
        id: `edge-spouse-${union.id}`,
        source: left.id,
        target: right.id,
        type: "spouse",
        path: hasBlockingCard
          ? [
              { x: leftEdge, y },
              { x: leftEdge, y: laneY },
              { x: rightEdge, y: laneY },
              { x: rightEdge, y },
            ]
          : [
              { x: leftEdge, y },
              { x: rightEdge, y },
            ],
      });
    }

    const children = union.childrenIds
      .map((id) => g.persons.get(id))
      .filter((person): person is PersonNode => Boolean(person))
      .sort((a, b) => a.x - b.x);

    if (children.length === 0) return;

    const startY = union.y + NODE_SIZE / 2;
    const busY = union.y + NODE_SPACING_Y / 2;
    const childChannelX = findClearChildChannelX(g, union);

    if (union.type !== "marriage" && partners.length > 1) {
      for (const partner of partners) {
        edges.push({
          id: `edge-parent-union-${partner.id}-${union.id}`,
          source: partner.id,
          target: union.id,
          type: "parent-union",
          path: [
            { x: partner.x, y: partner.y + NODE_SIZE / 2 },
            { x: partner.x, y: busY },
            { x: union.x, y: busY },
          ],
        });
      }
    }

    for (const child of children) {
      edges.push({
        id: `edge-union-child-${union.id}-${child.id}`,
        source: union.id,
        target: child.id,
        type: "union-child",
        path: [
          { x: childChannelX, y: startY },
          { x: childChannelX, y: busY },
          { x: child.x, y: busY },
          { x: child.x, y: child.y - NODE_SIZE / 2 },
        ],
      });
    }
  });

  // Adoption edges: dashed line from adoptive parent directly to child (no union)
  g.adoptions.forEach((adoptiveParentIds, childId) => {
    const child = g.persons.get(childId);
    if (!child) return;
    for (const parentId of adoptiveParentIds) {
      const parent = g.persons.get(parentId);
      if (!parent) continue;
      edges.push({
        id: `edge-adoption-${parentId}-${childId}`,
        source: parentId,
        target: childId,
        type: "adoption",
        path: [
          { x: parent.x, y: parent.y + NODE_SIZE / 2 },
          { x: parent.x, y: (parent.y + child.y) / 2 },
          { x: child.x, y: (parent.y + child.y) / 2 },
          { x: child.x, y: child.y - NODE_SIZE / 2 },
        ],
      });
    }
  });

  return edges;
}

function calculateBounds(nodes: FamilyNode[], unions: Union[], edges: LayoutEdge[]) {
  let maxX = 0;
  let maxY = 0;

  for (const node of nodes) {
    maxX = Math.max(maxX, (node.x || 0) + NODE_SIZE / 2);
    maxY = Math.max(maxY, (node.y || 0) + NODE_SIZE / 2);
  }

  for (const union of unions) {
    maxX = Math.max(maxX, union.x || 0);
    maxY = Math.max(maxY, union.y || 0);
  }

  for (const edge of edges) {
    for (const point of edge.path) {
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    }
  }

  return {
    width: Math.ceil(maxX + CANVAS_PADDING),
    height: Math.ceil(maxY + CANVAS_PADDING),
  };
}

export function calculateSugiyamaLayout(nodes: FamilyNode[]): LayoutGraph {
  if (nodes.length === 0) return { nodes: [], unions: [], edges: [], width: 0, height: 0 };

  const g = buildInternalGraph(nodes);

  assignLayers(g);
  assignCoordinates(g);
  normalizeCoordinates(g);

  const layoutNodes = Array.from(g.persons.values()).map((person) => {
    const original = nodes.find((node) => node.id === person.id);
    return {
      ...original!,
      x: person.x,
      y: person.y,
      generation: person.layer,
    } as FamilyNode;
  });

  const layoutUnions = Array.from(g.unions.values()).map((union) => ({
    ...union,
  }));
  const edges = routeEdges(g);
  const bounds = calculateBounds(layoutNodes, layoutUnions, edges);

  return {
    nodes: layoutNodes,
    unions: layoutUnions,
    edges,
    width: bounds.width,
    height: bounds.height,
  };
}
