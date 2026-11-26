const HTML_ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(value: unknown) {
  return String(value ?? "-").replace(
    /[&<>"']/g,
    (character) => HTML_ENTITIES[character] ?? character,
  );
}
