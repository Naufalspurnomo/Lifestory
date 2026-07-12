/**
 * Union ids are internal graph keys. Keep the complete sorted id tuple in the
 * key instead of joining with a delimiter that a user/imported id may contain.
 */
export function makeFamilyUnionId(partnerIds: string[]): string {
  const ids = Array.from(new Set(partnerIds.filter(Boolean))).sort();
  if (ids.length === 0) return "unit-unknown-parent";
  return `unit-${JSON.stringify(ids)}`;
}
