export function joinKeywords(k: string | string[]): string {
  if (Array.isArray(k)) return k.join(", ");
  return k.trim();
}
