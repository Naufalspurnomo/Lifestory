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
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
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
