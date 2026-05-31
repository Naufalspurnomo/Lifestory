import { z } from "zod";

// ====== User Schemas ======

export const userStatusSchema = z.enum(["active", "inactive", "suspended"]);

export const updateUserStatusSchema = z
  .object({
    status: userStatusSchema.optional(),
    subscriptionActive: z.boolean().optional(),
  })
  .refine(
    (data) =>
      data.status !== undefined || data.subscriptionActive !== undefined,
    { message: "At least one field (status or subscriptionActive) is required" }
  );

export const userIdParamSchema = z.object({
  id: z.string().min(1, "User ID is required"),
});

// ====== Pagination Schemas ======

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(["asc", "desc"]).default("desc"),
  q: z.string().optional(), // search query
});

// ====== Auth Schemas ======

export const loginSchema = z.object({
  email: z.string().trim().max(254).email("Invalid email format"),
  password: z
    .string()
    .min(1, "Password is required")
    .max(128, "Password is too long"),
});

const strongPasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password is too long")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
  email: z.string().trim().max(254).email("Invalid email format"),
  phone: z
    .string()
    .trim()
    .min(8, "Phone number must be at least 8 characters")
    .max(32, "Phone number is too long")
    .regex(
      /^[+0-9][0-9\s().-]{7,31}$/,
      "Phone number can only contain digits, spaces, and +().-"
    ),
  password: strongPasswordSchema,
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().max(254).email("Invalid email format"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(32, "Reset token is required").max(256),
  password: strongPasswordSchema,
});

// ====== Family Tree Schemas ======

const nodeIdSchema = z.string().trim().min(1).max(128);
const yearSchema = z.number().int().min(0).max(9999).nullable();

const mediaItemSchema = z.object({
  type: z.enum(["image", "video"]),
  url: z.string().min(1).max(100_000),
  caption: z.string().max(500).optional(),
});

const workItemSchema = z.object({
  type: z.enum(["book", "music", "film", "art", "other"]),
  title: z.string().trim().min(1).max(160),
  year: z.number().int().min(0).max(9999).optional(),
  description: z.string().max(2_000).optional(),
});

const familyNodeSchema = z.object({
  id: nodeIdSchema,
  label: z.string().trim().min(1, "Node name is required").max(160),
  sex: z.enum(["M", "F", "X"]).optional(),
  year: yearSchema.optional().default(null),
  deathYear: yearSchema.optional().default(null),
  parentId: nodeIdSchema.nullable().optional().default(null),
  parentIds: z.array(nodeIdSchema).max(4).optional().default([]),
  adoptiveParentIds: z.array(nodeIdSchema).max(4).optional().default([]),
  partners: z.array(nodeIdSchema).max(20).optional().default([]),
  childrenIds: z.array(nodeIdSchema).max(250).optional().default([]),
  generation: z.number().int().min(-100).max(100).optional().default(0),
  line: z
    .enum(["paternal", "maternal", "union", "descendant", "self", "default"])
    .optional()
    .default("default"),
  imageUrl: z.string().max(100_000).nullable().optional().default(null),
  content: z
    .object({
      description: z.string().max(20_000).optional().default(""),
      media: z.array(mediaItemSchema).max(50).optional().default([]),
      instagram: z.string().trim().max(120).optional(),
      tiktok: z.string().trim().max(120).optional(),
      linkedin: z.string().trim().max(160).optional(),
    })
    .optional()
    .default({ description: "", media: [] }),
  works: z.array(workItemSchema).max(50).optional().default([]),
});

const familyTreeNodesBaseSchema = z
  .array(familyNodeSchema)
  .max(500, "A tree can contain at most 500 people");

function validateFamilyTreeNodeRefs(
  nodes: z.infer<typeof familyTreeNodesBaseSchema>,
  ctx: z.RefinementCtx
) {
  const ids = new Set<string>();

  nodes.forEach((node, index) => {
    if (ids.has(node.id)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [index, "id"],
        message: `Duplicate node id: ${node.id}`,
      });
    }
    ids.add(node.id);
  });

  nodes.forEach((node, index) => {
    const refs = [
      ["parentId", node.parentId],
      ...node.parentIds.map((id) => ["parentIds", id] as const),
      ...node.adoptiveParentIds.map(
        (id) => ["adoptiveParentIds", id] as const
      ),
      ...node.partners.map((id) => ["partners", id] as const),
      ...node.childrenIds.map((id) => ["childrenIds", id] as const),
    ] as const;

    refs.forEach(([field, refId]) => {
      if (!refId) return;
      if (refId === node.id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [index, field],
          message: "A node cannot reference itself",
        });
      } else if (!ids.has(refId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [index, field],
          message: `Referenced node does not exist: ${refId}`,
        });
      }
    });
  });
}

export const familyTreeNodesSchema = familyTreeNodesBaseSchema.superRefine(
  validateFamilyTreeNodeRefs
);

export const nonEmptyFamilyTreeNodesSchema = familyTreeNodesBaseSchema
  .min(1, "treeData.nodes is required")
  .superRefine(validateFamilyTreeNodeRefs);

export const treeCreateSchema = z.object({
  id: nodeIdSchema.optional(),
  name: z.string().trim().min(1, "Name is required").max(120),
  nodes: familyTreeNodesSchema.optional().default([]),
});

export const treeNodesPayloadSchema = z.object({
  nodes: familyTreeNodesSchema,
});

export const treeSyncPayloadSchema = z.object({
  batchId: z.string().trim().min(1).max(256),
  clientVersion: z.number().int().positive(),
  mutations: z
    .array(
      z.object({
        seqNo: z.number().int().positive(),
        type: z.enum(["add", "update", "delete"]),
        nodeId: nodeIdSchema,
        payload: familyNodeSchema.nullable(),
      })
    )
    .min(1, "At least one mutation is required")
    .max(250, "A sync batch can contain at most 250 mutations"),
});

export const inviteCreateSchema = z.object({
  treeName: z.string().trim().min(1, "treeName is required").max(120),
  treeData: z
    .object({
      nodes: nonEmptyFamilyTreeNodesSchema,
    })
    .passthrough(),
});

// ====== Helper: Validate and parse ======

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: z.ZodError };

export function validateBody<T>(
  schema: z.ZodSchema<T>,
  body: unknown
): ValidationResult<T> {
  const result = schema.safeParse(body);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

export function formatZodErrors(errors: z.ZodError): string[] {
  return errors.errors.map((e) => `${e.path.join(".")}: ${e.message}`);
}
