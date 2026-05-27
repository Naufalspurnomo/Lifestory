import { hash } from "bcryptjs";
import { prisma } from "../db";

export type AppUser = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  passwordHash: string;
  role: "admin" | "user";
  subscriptionActive: boolean;
  status: string;
};

// Find user by email (for auth)
export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });
}

// Find user by ID
export async function findUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
  });
}

// Create a new user
export async function createUser(data: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: "admin" | "user";
}) {
  const passwordHash = await hash(data.password, 10);

  return prisma.user.create({
    data: {
      name: data.name,
      email: data.email.toLowerCase().trim(),
      phone: data.phone?.trim(),
      passwordHash,
      role: data.role || "user",
      subscriptionActive: false,
      status: "inactive",
    },
  });
}

// Update user subscription status
export async function updateUserSubscription(id: string, active: boolean) {
  return prisma.user.update({
    where: { id },
    data: {
      subscriptionActive: active,
      status: active ? "active" : "inactive",
    },
  });
}

// Seed admin user if explicit seed credentials are provided.
export async function seedAdminUser() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL?.toLowerCase().trim();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    return;
  }

  if (adminPassword.length < 12) {
    throw new Error("SEED_ADMIN_PASSWORD must be at least 12 characters");
  }

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) return;

  const passwordHash = await hash(adminPassword, 10);
  await prisma.user.create({
    data: {
      name: process.env.SEED_ADMIN_NAME || "Admin",
      email: adminEmail,
      passwordHash,
      role: "admin",
      subscriptionActive: true,
      status: "active",
    },
  });

  console.log("Admin user created:", adminEmail);
}
