import fs from "node:fs/promises";
import path from "node:path";
import Handlebars from "handlebars";

const templatesDir = path.join(__dirname, "templates");

export type TemplateName = "welcome" | "invite" | "reset-password";

const cache = new Map<TemplateName, HandlebarsTemplateDelegate>();

/**
 * Loads and compiles Handlebars templates from disk (cached after first read).
 */
export async function renderTemplate<T extends Record<string, unknown>>(
  name: TemplateName,
  variables: T,
): Promise<string> {
  const compiled = await getCompiled(name);
  return compiled(variables);
}

async function getCompiled(name: TemplateName): Promise<HandlebarsTemplateDelegate> {
  const hit = cache.get(name);
  if (hit) return hit;
  const filePath = path.join(templatesDir, `${name}.html`);
  const raw = await fs.readFile(filePath, "utf8");
  const compiled = Handlebars.compile(raw, { strict: true });
  cache.set(name, compiled);
  return compiled;
}

/** Clears template cache (useful in tests or hot reload). */
export function clearTemplateCache(): void {
  cache.clear();
}
