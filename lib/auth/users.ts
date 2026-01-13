import { prisma } from "../db";
import { hash } from "bcryptjs";

export type AppUser = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: "admin" | "user";
  subscriptionActive: boolean;
  status: string;
};

// Find user by email (for auth)
export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email: email.toLowerCase() },
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
  role?: "admin" | "user";
}) {
  const passwordHash = await hash(data.password, 10);

  return prisma.user.create({
    data: {
      name: data.name,
      email: data.email.toLowerCase(),
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

// Seed admin user if not exists
export async function seedAdminUser() {
  const adminEmail = "naufalspurnomo@gmail.com";

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const passwordHash = await hash("admin123", 10);

    await prisma.user.create({
      data: {
        name: "Admin",
        email: adminEmail,
        passwordHash,
        role: "admin",
        subscriptionActive: true,
        status: "active",
      },
    });

    console.log("✅ Admin user created:", adminEmail);
  }
}
