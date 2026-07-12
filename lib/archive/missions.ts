import type { FamilyNode } from "../types/tree";

export type ArchiveMission = {
  id: string;
  kind: "proposal" | "story" | "photo" | "year";
  nodeId?: string;
  title: string;
  body: string;
};

export function getArchiveMissions(
  nodes: FamilyNode[],
  pendingProposals: number
): ArchiveMission[] {
  const missions: ArchiveMission[] = [];
  if (pendingProposals) {
    missions.push({
      id: "pending-proposals",
      kind: "proposal",
      title: `${pendingProposals} kenangan menunggu ditinjau`,
      body: "Keluarga sudah mengirim cerita. Putuskan mana yang siap masuk arsip.",
    });
  }
  for (const node of nodes) {
    if ((node as FamilyNode & { isPlaceholder?: boolean }).isPlaceholder) continue;
    if (!node.content?.description?.trim()) {
      missions.push({ id: `story-${node.id}`, kind: "story", nodeId: node.id, title: `Cari satu cerita tentang ${node.label}`, body: "Minta keluarga membagikan kenangan kecil yang layak disimpan." });
    } else if (!node.imageUrl) {
      missions.push({ id: `photo-${node.id}`, kind: "photo", nodeId: node.id, title: `Cari foto ${node.label}`, body: "Satu foto yang diberi konteks bisa menghidupkan arsip keluarga." });
    } else if (!node.year) {
      missions.push({ id: `year-${node.id}`, kind: "year", nodeId: node.id, title: `Lengkapi tahun ${node.label}`, body: "Perkiraan tahun membantu cerita keluarga tersusun dalam kronik." });
    }
    if (missions.length >= 3) break;
  }
  return missions.slice(0, 3);
}
