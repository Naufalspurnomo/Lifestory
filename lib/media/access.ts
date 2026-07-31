export type MediaAssetVisibility = "tree" | "private" | "selected";

export type MediaAssetVisibilityRecord = {
  visibility: string;
  uploaderId: string | null;
};

/**
 * `selected` recipients are not modelled yet, so keep those assets private
 * until an explicit recipient relation exists. This prevents a future
 * visibility value from widening access by accident.
 */
export function canViewMediaAsset(
  asset: MediaAssetVisibilityRecord,
  userId: string
): boolean {
  return asset.visibility === "tree" || asset.uploaderId === userId;
}
