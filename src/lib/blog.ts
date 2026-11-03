import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

// Posts are markdown files in content/blog with a small frontmatter block.
const DIR = path.join(process.cwd(), "content", "blog");

const frontmatterSchema = z.object({
  title: z.string(),
  excerpt: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  author: z.string(),
  category: z.string(),
  readTime: z.string(),
  image: z.string(),
});

export type PostMeta = z.infer<typeof frontmatterSchema> & { slug: string };
export type Post = PostMeta & { body: string };

/** Parses `key: value` lines between `---` fences; quoted values are JSON strings. */
export function parsePost(slug: string, raw: string): Post {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) throw new Error(`Post "${slug}" is missing frontmatter`);
  const fields: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const at = line.indexOf(":");
    if (at === -1) continue;
    const value = line.slice(at + 1).trim();
    fields[line.slice(0, at).trim()] = value.startsWith('"') ? JSON.parse(value) : value;
  }
  return { ...frontmatterSchema.parse(fields), slug, body: match[2].trim() };
}

// "use cache": posts only change on deploy, so pages built from them can be fully static.
export async function getPosts(): Promise<PostMeta[]> {
  "use cache";
  const files = (await readdir(DIR)).filter((f) => f.endsWith(".md"));
  const posts = await Promise.all(files.map((f) => getPost(f.replace(/\.md$/, ""))));
  return posts
    .filter((p): p is Post => p !== null)
    .map(({ body, ...meta }) => meta)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export async function getPost(slug: string): Promise<Post | null> {
  "use cache";
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  try {
    return parsePost(slug, await readFile(path.join(DIR, `${slug}.md`), "utf8"));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
}

export function formatPostDate(date: string) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}
