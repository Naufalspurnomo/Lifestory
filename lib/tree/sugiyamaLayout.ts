import {
    FamilyNode,
    LayoutEdge,
    LayoutGraph,
    Person,
    Union,
    LAYOUT,
} from "../types/tree";

// --- constants ---
const { NODE_SIZE, NODE_SPACING_X, NODE_SPACING_Y, PARTNER_GAP } = LAYOUT;
const SIBLING_GAP = NODE_SPACING_X;

// --- Internal Types ---

type InternalGraph = {
    persons: Map<string, PersonNode>;
    unions: Map<string, UnionNode>;
};

type PersonNode = Person & {
    // graph topology
    unionIds: string[]; // unions where this person is a partner
    parentUnionId?: string; // union where this person is a child

    // layout
    layer: number;
    x: number;
    y: number;

    // blocks
    blockId?: string;
};

type UnionNode = Union & {
    // graph topology
    // partnerIds and childrenIds are in base type

    // layout
    layer: number;
    x: number;
    y: number;

    // blocks
    blockId?: string;
};

// --- 1. Build Internal Graph ---

function buildInternalGraph(nodes: FamilyNode[]): InternalGraph {
    const persons = new Map<string, PersonNode>();
    const unions = new Map<string, UnionNode>();

    // 1a. Create Person Nodes
    for (const n of nodes) {
        persons.set(n.id, {
            id: n.id,
            label: n.label,
            sex: (n.content as any)?.sex || "X", // assuming sex might be in content or implied
            birthDate: n.year?.toString(),
            deathDate: n.deathYear?.toString(),
            imageUrl: n.imageUrl || undefined,
            unionIds: [],
            parentUnionId: undefined,
            layer: -1,
            x: 0,
            y: 0,
        });
    }

    // 1b. Create Union Nodes
    // We infer unions from 'partners' and 'parentIds' / 'childrenIds'
    // Strategy: valid union = set of partners that have children together OR are explicitly linked

    // Track processed partnerships to avoid duplicates
    const processedPartnerships = new Set<string>();

    // Helper to get consistent key
    const getPartnersKey = (ids: string[]) => ids.sort().join("::");

    // Iterate all nodes to find partnerships
    for (const p of nodes) {
        // 1. Explicit partners
        for (const partnerId of p.partners) {
            if (!persons.has(partnerId)) continue;
            const key = getPartnersKey([p.id, partnerId]);
            if (processedPartnerships.has(key)) continue;

            processedPartnerships.add(key);

            // Create Union
            const uId = `union-${key}`; // deterministic ID
            if (!unions.has(uId)) {
                unions.set(uId, {
                    id: uId,
                    partnerIds: [p.id, partnerId],
                    childrenIds: [], // fill later
                    type: "marriage", // default
                    layer: -1,
                    x: 0,
                    y: 0,
                });

                // Link persons to union
                persons.get(p.id)!.unionIds.push(uId);
                persons.get(partnerId)!.unionIds.push(uId);
            }
        }

        // 2. Child -> Parents (to capture unions that might not be in 'partners' list or single parents)
        if (p.parentIds && p.parentIds.length > 0) {
            // Filter valid parents
            const parents = p.parentIds.filter(pid => persons.has(pid));
            if (parents.length > 0) {
                // Sort parents to find/create union
                // Case A: 2 Parents -> Standard Union
                // Case B: 1 Parent -> Single Parent Union
                // Case C: >2 Parents -> Pick first 2 or handle complex (simplified: first 2)

                // If parents are already partners, find that union. 
                // If not, we might need to create a "virtual" union or implies they should be partners

                let targetUnionId: string | undefined;

                if (parents.length >= 2) {
                    const p1 = parents[0];
                    const p2 = parents[1];
                    const key = getPartnersKey([p1, p2]);
                    targetUnionId = `union-${key}`;

                    if (!unions.has(targetUnionId)) {
                        // Implicit union from parenthood
                        unions.set(targetUnionId, {
                            id: targetUnionId,
                            partnerIds: [p1, p2],
                            childrenIds: [],
                            type: "relationship", // inferred
                            layer: -1,
                            x: 0,
                            y: 0,
                        });
                        persons.get(p1)!.unionIds.push(targetUnionId);
                        persons.get(p2)!.unionIds.push(targetUnionId);
                        processedPartnerships.add(key);
                    }
                } else if (parents.length === 1) {
                    // Single parent
                    const p1 = parents[0];
                    const key = `single-${p1}`;
                    targetUnionId = `union-${key}`;

                    if (!unions.has(targetUnionId)) {
                        unions.set(targetUnionId, {
                            id: targetUnionId,
                            partnerIds: [p1],
                            childrenIds: [],
                            type: "relationship",
                            layer: -1,
                            x: 0,
                            y: 0,
                        });
                        persons.get(p1)!.unionIds.push(targetUnionId);
                    }
                }

                if (targetUnionId) {
                    const u = unions.get(targetUnionId)!;
                    if (!u.childrenIds.includes(p.id)) {
                        u.childrenIds.push(p.id);
                    }
                    persons.get(p.id)!.parentUnionId = targetUnionId;
                }
            }
        }
    }

    // Legacy fallback: if node has `parentId` and not `parentIds`, handle strictly
    // but `nodes` coming in should largely be normalized.

    return { persons, unions };
}

// --- 2. Layer Assignment (Longest Path on DAG) ---

function assignLayers(g: InternalGraph) {
    // Constraints:
    // 1. Union L(U) = L(Partner)
    // 2. Child L(C) >= L(U) + 1

    // Step 2a: Identify components and roots (persons with no parent union)
    // We relax layer assignment using a priority queue or simple Bellman-Ford-like relaxation

    // Initialize roots to layer 0
    const q: string[] = []; // person IDs

    g.persons.forEach(p => {
        if (!p.parentUnionId) {
            p.layer = 0;
            q.push(p.id);
        }
    });

    // If cycle exists, this might loop, so we limit iterations
    let changed = true;
    let iterations = 0;
    const HEADER_LIMIT = (g.persons.size + g.unions.size) * 2 + 100;

    while (changed && iterations < HEADER_LIMIT) {
        changed = false;
        iterations++;

        // Propagate Person -> Union (Union matches Partner Max Layer)
        g.unions.forEach(u => {
            let maxP = -1;
            u.partnerIds.forEach(pid => {
                const p = g.persons.get(pid);
                if (p && p.layer > maxP) maxP = p.layer;
            });

            if (maxP > -1 && u.layer !== maxP) {
                u.layer = maxP;
                changed = true;

                // Force all partners to match this union layer (if data allows)
                // If strict generation is needed, partners MUST be same layer. 
                // We propagate upwards too? No, usually propagate max downwards.
                // Let's adopt "Union layer = Max(Partners)".
                // And then push Partners up? No, that breaks invariants.
                // Assuming partners are roughly same generation.
            }
        });

        // Propagate Union -> Children
        g.unions.forEach(u => {
            if (u.layer === -1) return;
            const childLayer = u.layer + 1;

            u.childrenIds.forEach(cid => {
                const c = g.persons.get(cid);
                if (c && c.layer < childLayer) {
                    c.layer = childLayer;
                    changed = true;
                }
            });
        });

        // Propagate Person -> Other Unions step intentionally skipped for now.
    }

    // Final pass: ensure anyone still -1 gets 0 (orphans/disconnected)
    g.persons.forEach(p => { if (p.layer === -1) p.layer = 0; });
    g.unions.forEach(u => {
        // single parent union might be missed if parent layer was set late
        if (u.layer === -1) {
            const p = g.persons.get(u.partnerIds[0]);
            if (p) u.layer = p.layer;
        }
    });

    // Normalization: make min layer 0
    let minL = Infinity;
    g.persons.forEach(p => minL = Math.min(minL, p.layer));
    if (minL < Infinity && minL > 0) {
        g.persons.forEach(p => p.layer -= minL);
        g.unions.forEach(u => u.layer -= minL);
    }
}

// --- 3. Ordering (Crossing Reduction) ---

type Block = {
    id: string;
    type: "person" | "union-group";
    elements: (PersonNode | UnionNode)[];
    layer: number;
    x?: number; // computed later
    width: number;
    barycenter: number;
    // neighbors for constraints
};

function reduceCrossings(g: InternalGraph) {
    // Strategy: Group (Partner + Union + Partner) into a "Marriage Block" to keep them together.
    // Group (Siblings) into "Sibling Block"? No, usually siblings can be interleaved if needed, 
    // but for family trees, keeping siblings adjacent is nice.

    // We will build "Layer Rows" where each item is a Block.

    const layers = new Map<number, Block[]>();

    // Helper to get layer map
    const getLayer = (l: number) => {
        if (!layers.has(l)) layers.set(l, []);
        return layers.get(l)!;
    };

    // 1. Build Blocks
    const processedUnions = new Set<string>();
    const processedPersons = new Set<string>();

    // Detect Marriage Blocks: [P1, U, P2] or [P1, U]
    g.unions.forEach(u => {
        if (processedUnions.has(u.id)) return;

        // Identify all linked unions for these partners (complex multi-marriage chain)
        // For MVP: Simple single union block: P1 - U - P2

        const elements: (PersonNode | UnionNode)[] = [];

        // Add first partner
        const p1 = g.persons.get(u.partnerIds[0]);
        if (p1 && !processedPersons.has(p1.id)) {
            elements.push(p1);
            processedPersons.add(p1.id);
        }

        // Add Union
        elements.push(u);
        processedUnions.add(u.id);

        // Add second partner
        if (u.partnerIds.length > 1) {
            const p2 = g.persons.get(u.partnerIds[1]);
            if (p2 && !processedPersons.has(p2.id)) {
                elements.push(p2);
                processedPersons.add(p2.id);
            }
        }

        const b: Block = {
            id: `block-${u.id}`,
            type: "union-group",
            elements,
            layer: u.layer,
            width: elements.length * NODE_SIZE + (elements.length - 1) * PARTNER_GAP,
            barycenter: 0
        };
        getLayer(u.layer).push(b);
    });

    // Add remaining persons (unmarried or unprocessed)
    g.persons.forEach(p => {
        if (!processedPersons.has(p.id)) {
            const b: Block = {
                id: `block-p-${p.id}`,
                type: "person",
                elements: [p],
                layer: p.layer,
                width: NODE_SIZE,
                barycenter: 0
            };
            getLayer(p.layer).push(b);
            processedPersons.add(p.id);
        }
    });

    // 2. Sort layers
    const maxLayer = Math.max(...Array.from(layers.keys()));

    // Initial Sort: by some heuristic (e.g. parent order)
    // ... skip for brevity, rely on sweeping

    // 3. Barycenter Sweeps
    for (let i = 0; i < 4; i++) {
        // Top-down
        for (let l = 0; l <= maxLayer; l++) {
            const row = getLayer(l);
            // Calc barycenter from parents (if person) or from partners' parents (if union group)
            row.forEach(block => {
                let sum = 0, count = 0;
                // look "up"
                // If block is person: look at parent union
                // If block is union group: look at partners' parent unions

                const handlePerson = (p: PersonNode) => {
                    if (p.parentUnionId) {
                        const u = g.unions.get(p.parentUnionId);
                        if (u && u.x !== undefined) {
                            sum += u.x;
                            count++;
                        }
                    }
                };

                block.elements.forEach(el => {
                    if ('sex' in el) handlePerson(el as PersonNode);
                });

                if (count > 0) block.barycenter = sum / count;
                else block.barycenter = block.x || 0; // retain or default
            });

            // Sort row by barycenter
            row.sort((a, b) => a.barycenter - b.barycenter);

            // Assign tentative X (simple packing)
            let cx = 0;
            row.forEach(b => {
                b.x = cx + b.width / 2;
                // Update internal elements X
                if (b.elements.length > 1) {
                    // Distribute elements within block
                    b.elements.forEach((el, idx) => {
                        el.x = b.x! - b.width / 2 + (idx * (NODE_SIZE + PARTNER_GAP)) + NODE_SIZE / 2;
                        el.y = l * NODE_SPACING_Y;
                    });
                } else {
                    b.elements[0].x = b.x;
                    b.elements[0].y = l * NODE_SPACING_Y;
                }
                cx += b.width + SIBLING_GAP;
            });
        }

        // Bottom-up (align to children)
        for (let l = maxLayer; l >= 0; l--) {
            const row = getLayer(l);
            row.forEach(block => {
                let sum = 0, count = 0;
                // Look down: Unions -> Children
                const handleUnion = (u: UnionNode) => {
                    u.childrenIds.forEach(cid => {
                        const c = g.persons.get(cid);
                        if (c && c.x !== undefined) {
                            sum += c.x;
                            count++;
                        }
                    });
                };

                block.elements.forEach(el => {
                    if (!('sex' in el)) handleUnion(el as UnionNode); // is Union
                    // Persons can basically pull towards their own unions if needed?
                    // Usually we align Union to Children.
                });

                if (count > 0) block.barycenter = sum / count;
            });

            row.sort((a, b) => a.barycenter - b.barycenter);

            // Compact Assign X
            let cx = 0;
            row.forEach(b => {
                b.x = cx + b.width / 2;
                // update elements
                if (b.elements.length > 1) {
                    const startX = b.x - b.width / 2;
                    b.elements.forEach((el, idx) => {
                        el.x = startX + idx * (NODE_SIZE + PARTNER_GAP) + NODE_SIZE / 2;
                    });
                } else {
                    b.elements[0].x = b.x;
                }
                cx += b.width + SIBLING_GAP;
            });
        }
    }
}

// --- 4. Edge Routing (Bus) ---

function routeEdges(g: InternalGraph): LayoutEdge[] {
    const edges: LayoutEdge[] = [];

    // 1. Partner Edges (within group)
    // Already implicitly handled by placement? No, need visual line.
    g.unions.forEach(u => {
        if (u.partnerIds.length < 2) return;
        // Draw line between partners
        const p1 = g.persons.get(u.partnerIds[0]);
        const p2 = g.persons.get(u.partnerIds[1]);
        if (p1 && p2) {
            edges.push({
                id: `edge-spouse-${u.id}`,
                source: p1.id,
                target: p2.id,
                type: "spouse",
                path: [
                    { x: Math.min(p1.x, p2.x), y: p1.y },
                    { x: Math.max(p1.x, p2.x), y: p2.y }
                ]
            });
        }
    });

    // 2. Parent-Child (Bus Routing)
    g.unions.forEach(u => {
        if (u.childrenIds.length === 0) return;

        // Start from Union Center
        const startX = u.x;
        const startY = u.y; // Union node is virtually at same Y as partners

        // Bus calculation
        // Collect children
        const kids = u.childrenIds.map(cid => g.persons.get(cid)).filter(k => k !== undefined) as PersonNode[];
        if (kids.length === 0) return;

        // Sort kids by X
        kids.sort((a, b) => a.x - b.x);

        // Bus Height: halfway between layers
        const busY = startY + (NODE_SPACING_Y / 2);

        // Trunk: Union -> Bus
        // Actually we represent this as edges from Union -> Child?
        // Or we create a specific visual structure.
        // The requirement says "U -> Pchild".

        // We create one edge per child, but utilizing the shared bus points visually.

        kids.forEach(k => {
            edges.push({
                id: `edge-parent-${u.id}-${k.id}`,
                source: u.id,  // Source is the Union Node!
                target: k.id,
                type: "union-child",
                path: [
                    { x: startX, y: startY + NODE_SIZE / 2 }, // Start below union
                    { x: startX, y: busY }, // Down to bus Y
                    { x: k.x, y: busY }, // Across to child X
                    { x: k.x, y: k.y - NODE_SIZE / 2 } // Down to child top
                ]
            });
        });

        // Also, if Union is implicit (not rendered as node), we might need edges from Parents -> Union.
        // But our blueprint says "Node(U:union) untuk setiap union". So Union IS a node.
        // We expect the renderer to draw the Union Node (maybe as a dot or small circle).
        // Let's add edges from Partners -> Union? 
        // Usually Partner -> Union is invisible if Union is just placed between them.
        // But "Edges: P -> U (partner)" in blueprint.
        u.partnerIds.forEach(pid => {
            const p = g.persons.get(pid);
            if (p) {
                edges.push({
                    id: `edge-partner-${p.id}-${u.id}`,
                    source: p.id,
                    target: u.id,
                    type: "spouse",
                    path: [
                        { x: p.x, y: p.y },
                        { x: u.x, y: u.y }
                    ]
                });
            }
        });

    });

    return edges;
}

// --- Main Export ---

export function calculateSugiyamaLayout(nodes: FamilyNode[]): LayoutGraph {
    if (nodes.length === 0) return { nodes: [], edges: [], width: 0, height: 0 };

    // 1. Build
    const g = buildInternalGraph(nodes);

    // 2. Layer
    assignLayers(g);

    // 3. Crossing
    reduceCrossings(g);

    // 4. Coordinates (simplified above)

    // 5. Edges
    const edges = routeEdges(g);

    // 6. Output Transformation
    // Convert internal nodes back to FamilyNode (with X/Y)

    // We need to keep Union nodes if the renderer supports them? 
    // The User blueprint says "Graph internal yang digambar: Node(P), Node(U)".
    // But `FamilyNode` type usually represents People.

    // If the renderer expects `FamilyNode` to be only people, we assume UnionNodes are handled by edges/renderer.
    // BUT, to follow "Production Grade", we should probably include Unions in the 'nodes' list if they are visual.
    // Or keep them separate. 
    // Our updated `LayoutGraph` has `unions?: Union[]`.

    const layoutNodes = Array.from(g.persons.values()).map(p => {
        // Find original node content
        const original = nodes.find(n => n.id === p.id);
        return {
            ...original!,
            x: p.x,
            y: p.y,
            generation: p.layer, // update generation based on calculation
        } as FamilyNode;
    });

    const layoutUnions = Array.from(g.unions.values()).map(u => ({
        ...u
    })); // Copy union data

    // Calculate bounds
    let maxX = 0, maxY = 0;
    layoutNodes.forEach(n => {
        maxX = Math.max(maxX, (n.x || 0) + NODE_SIZE);
        maxY = Math.max(maxY, (n.y || 0) + NODE_SIZE);
    });

    return {
        nodes: layoutNodes,
        unions: layoutUnions,
        edges,
        width: maxX + 100,
        height: maxY + 100,
    };
}
