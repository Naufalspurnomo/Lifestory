import { prisma } from "../lib/db";
import { syncFamilyIdentityForTree } from "../lib/family-identity";

if (process.env.DIRECT_URL) process.env.DATABASE_URL = process.env.DIRECT_URL;

const batchSize = Number(process.env.FAMILY_RESYNC_BATCH_SIZE || 50);

async function main() {
  const trees = await prisma.tree.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true, _count: { select: { nodes: true } } },
    orderBy: { updatedAt: "desc" },
  });

  let synced = 0;
  let skippedEmpty = 0;
  const failed: Array<{ id: string; name: string; error: string }> = [];

  for (let index = 0; index < trees.length; index += batchSize) {
    const batch = trees.slice(index, index + batchSize);
    await Promise.all(batch.map(async (tree) => {
      try {
        if (tree._count.nodes === 0) { skippedEmpty += 1; return; }
        await syncFamilyIdentityForTree(tree.id);
        synced += 1;
      } catch (error) {
        failed.push({ id: tree.id, name: tree.name, error: error instanceof Error ? error.message : String(error) });
      }
    }));
    console.log("Synced " + Math.min(index + batch.length, trees.length) + "/" + trees.length);
  }

  const [identityCount, keyCount, linkedTreeCount] = await Promise.all([
    prisma.familyIdentity.count({ where: { status: "active" } }),
    prisma.familyMatchKey.count(),
    prisma.tree.count({ where: { deletedAt: null, familyIdentityId: { not: null } } }),
  ]);

  console.log(JSON.stringify({ activeTrees: trees.length, synced, skippedEmpty, failed, activeFamilyIdentities: identityCount, familyMatchKeys: keyCount, activeTreesLinkedToIdentity: linkedTreeCount }, null, 2));

  if (failed.length > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => {
  await prisma.$disconnect();
});
