import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function createSeedUser(input: {
  email: string;
  password: string;
  name: string;
  role: "admin" | "user";
  subscriptionActive: boolean;
  status: "active" | "inactive" | "suspended";
}) {
  if (input.password.length < 12) {
    throw new Error(`Seed password for ${input.email} must be at least 12 characters`);
  }

  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existing) {
    console.log("Seed user already exists:", input.email);
    return;
  }

  const passwordHash = await hash(input.password, 10);
  await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role,
      subscriptionActive: input.subscriptionActive,
      status: input.status,
    },
  });

  console.log("Seed user created:", input.email);
}

async function main() {
  console.log("Seeding database...");

  const adminEmail = process.env.SEED_ADMIN_EMAIL?.toLowerCase().trim();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    await createSeedUser({
      email: adminEmail,
      password: adminPassword,
      name: process.env.SEED_ADMIN_NAME || "Admin",
      role: "admin",
      subscriptionActive: true,
      status: "active",
    });
  } else {
    console.log(
      "Skipping admin seed. Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD to create one."
    );
  }

  const demoEmail = process.env.SEED_DEMO_EMAIL?.toLowerCase().trim();
  const demoPassword = process.env.SEED_DEMO_PASSWORD;
  if (demoEmail && demoPassword) {
    await createSeedUser({
      email: demoEmail,
      password: demoPassword,
      name: process.env.SEED_DEMO_NAME || "Demo User",
      role: "user",
      subscriptionActive: false,
      status: "inactive",
    });
  } else {
    console.log(
      "Skipping demo seed. Set SEED_DEMO_EMAIL and SEED_DEMO_PASSWORD to create one."
    );
  }

  console.log("Seeding complete.");
}

main()
  .catch((error) => {
    console.error("Error seeding:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
