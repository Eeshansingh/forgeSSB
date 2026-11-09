const KEY = "forgessb_anonymous_id";

export function getAnonymousId(): string {
  const existing = localStorage.getItem(KEY);
  if (existing) return existing;
  const generated =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `anon-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  localStorage.setItem(KEY, generated);
  return generated;
}
