import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create admin user
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
  } else {
    console.log("ℹ️ Admin user already exists:", adminEmail);
  }

  // Create a demo user
  const demoEmail = "demo@lifestory.id";
  const existingDemo = await prisma.user.findUnique({
    where: { email: demoEmail },
  });

  if (!existingDemo) {
    const passwordHash = await hash("demo123", 10);

    await prisma.user.create({
      data: {
        name: "Demo User",
        email: demoEmail,
        passwordHash,
        role: "user",
        subscriptionActive: false,
        status: "inactive",
      },
    });

    console.log("✅ Demo user created:", demoEmail);
  } else {
    console.log("ℹ️ Demo user already exists:", demoEmail);
  }

  console.log("🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
