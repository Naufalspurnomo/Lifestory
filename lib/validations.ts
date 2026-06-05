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

export const contactInquirySchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
  email: z.string().trim().max(254).email("Invalid email format"),
  message: z
    .string()
    .trim()
    .min(10, "Message must be at least 10 characters")
    .max(4_000, "Message is too long"),
});

// ====== Family Tree Schemas ======

const nodeIdSchema = z.string().trim().min(1).max(128);
const yearSchema = z.number().int().min(0).max(9999).nullable();
const textEncoder = new TextEncoder();

const MAX_MEDIA_ITEMS_PER_NODE = 10;
const MAX_TREE_MEDIA_BYTES = 5 * 1024 * 1024;
const MAX_TREE_OBJECT_MEDIA_BYTES = 5 * 1024 * 1024 * 1024;
const MAX_TREE_TEXT_BYTES = 1 * 1024 * 1024;
const MAX_MEDIA_UPLOAD_BYTES = 5 * 1024 * 1024;

const allowedDataMediaTypes = new Set([
  "image/avif",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/ogg",
  "video/webm",
]);

function isSafeMediaUrl(value: string): boolean {
  const trimmed = value.trim();
  const lower = trimmed.toLowerCase();

  if (lower.startsWith("data:")) {
    const commaIndex = lower.indexOf(",");
    if (commaIndex === -1) return false;

    const metadata = lower.slice("data:".length, commaIndex);
    const [mediaType, ...parameters] = metadata.split(";");
    return (
      allowedDataMediaTypes.has(mediaType) &&
      parameters.includes("base64")
    );
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

const mediaUrlSchema = z
  .string()
  .trim()
  .min(1)
  .max(100_000)
  .refine(isSafeMediaUrl, {
    message:
      "URL must be http(s) or a base64 data URL for supported image/video media",
  });

const optionalMediaUrlSchema = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? null : value),
  mediaUrlSchema.nullable().optional().default(null)
);

const storageKeySchema = z
  .string()
  .trim()
  .min(1)
  .max(700)
  .refine((value) => !value.includes("..") && !value.includes("\\"), {
    message: "Invalid storage key",
  });

const mimeTypeSchema = z
  .string()
  .trim()
  .max(120)
  .regex(/^[a-z0-9.+-]+\/[a-z0-9.+-]+$/i, "Invalid MIME type");

const mediaItemSchema = z.object({
  type: z.enum(["image", "video"]),
  url: mediaUrlSchema,
  caption: z.string().max(500).optional(),
  storageKey: storageKeySchema.optional(),
  mimeType: mimeTypeSchema.optional(),
  sizeBytes: z.number().int().positive().max(MAX_MEDIA_UPLOAD_BYTES).optional(),
  uploadedAt: z.string().datetime().optional(),
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
  imageUrl: optionalMediaUrlSchema,
  imageStorageKey: storageKeySchema.nullable().optional(),
  imageMimeType: mimeTypeSchema.nullable().optional(),
  imageSizeBytes: z
    .number()
    .int()
    .positive()
    .max(MAX_MEDIA_UPLOAD_BYTES)
    .nullable()
    .optional(),
  content: z
    .object({
      description: z.string().max(20_000).optional().default(""),
      media: z
        .array(mediaItemSchema)
        .max(MAX_MEDIA_ITEMS_PER_NODE)
        .optional()
        .default([]),
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

function stringBytes(value: string | null | undefined): number {
  return value ? textEncoder.encode(value).byteLength : 0;
}

function validateFamilyTreeStorageBudget(
  nodes: z.infer<typeof familyTreeNodesBaseSchema>,
  ctx: z.RefinementCtx
) {
  let mediaBytes = 0;
  let objectMediaBytes = 0;
  let textBytes = 0;

  nodes.forEach((node) => {
    if (node.imageUrl?.toLowerCase().startsWith("data:")) {
      mediaBytes += stringBytes(node.imageUrl);
    } else {
      textBytes += stringBytes(node.imageUrl);
    }
    if (node.imageStorageKey) {
      objectMediaBytes += node.imageSizeBytes ?? 0;
      textBytes += stringBytes(node.imageStorageKey);
      textBytes += stringBytes(node.imageMimeType);
    }
    textBytes += stringBytes(node.label);
    textBytes += stringBytes(node.content?.description);
    textBytes += stringBytes(node.content?.instagram);
    textBytes += stringBytes(node.content?.tiktok);
    textBytes += stringBytes(node.content?.linkedin);

    for (const media of node.content?.media ?? []) {
      if (media.url.toLowerCase().startsWith("data:")) {
        mediaBytes += stringBytes(media.url);
      } else {
        textBytes += stringBytes(media.url);
      }
      if (media.storageKey) {
        objectMediaBytes += media.sizeBytes ?? 0;
        textBytes += stringBytes(media.storageKey);
        textBytes += stringBytes(media.mimeType);
      }
      textBytes += stringBytes(media.caption);
    }

    for (const work of node.works ?? []) {
      textBytes += stringBytes(work.title);
      textBytes += stringBytes(work.description);
    }
  });

  if (mediaBytes > MAX_TREE_MEDIA_BYTES) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: [],
      message: `Tree media exceeds ${Math.floor(
        MAX_TREE_MEDIA_BYTES / 1024 / 1024
      )} MB. Move larger media to object storage and keep only public URLs in the tree.`,
    });
  }

  if (objectMediaBytes > MAX_TREE_OBJECT_MEDIA_BYTES) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: [],
      message: `Tree object media exceeds ${Math.floor(
        MAX_TREE_OBJECT_MEDIA_BYTES / 1024 / 1024 / 1024
      )} GB.`,
    });
  }

  if (textBytes > MAX_TREE_TEXT_BYTES) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: [],
      message: `Tree text content exceeds ${Math.floor(
        MAX_TREE_TEXT_BYTES / 1024 / 1024
      )} MB.`,
    });
  }
}

function validateFamilyTree(
  nodes: z.infer<typeof familyTreeNodesBaseSchema>,
  ctx: z.RefinementCtx
) {
  validateFamilyTreeNodeRefs(nodes, ctx);
  validateFamilyTreeStorageBudget(nodes, ctx);
}

export const familyTreeNodesSchema =
  familyTreeNodesBaseSchema.superRefine(validateFamilyTree);

export const nonEmptyFamilyTreeNodesSchema = familyTreeNodesBaseSchema
  .min(1, "treeData.nodes is required")
  .superRefine(validateFamilyTree);

export const treeCreateSchema = z.object({
  id: nodeIdSchema.optional(),
  name: z.string().trim().min(1, "Name is required").max(120),
  nodes: nonEmptyFamilyTreeNodesSchema,
});

export const treeNodesPayloadSchema = z.object({
  expectedVersion: z.number().int().positive(),
  nodes: nonEmptyFamilyTreeNodesSchema,
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
        previousPayload: familyNodeSchema.nullable().optional(),
      })
    )
    .min(1, "At least one mutation is required")
    .max(250, "A sync batch can contain at most 250 mutations"),
});

export const inviteCreateSchema = z.object({
  treeId: nodeIdSchema,
  role: z.enum(["editor", "viewer"]).optional().default("editor"),
});

export const mediaUploadIntentSchema = z.object({
  treeId: nodeIdSchema,
  nodeId: nodeIdSchema.nullable().optional(),
  purpose: z.enum(["profile", "gallery"]),
  fileName: z.string().trim().min(1).max(240),
  contentType: mimeTypeSchema,
  sizeBytes: z.number().int().positive().max(MAX_MEDIA_UPLOAD_BYTES),
});

export const mediaDeleteSchema = z.object({
  treeId: nodeIdSchema,
  storageKey: storageKeySchema,
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
