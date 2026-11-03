import type { MetadataRoute } from "next";
import { cacheLife } from "next/cache";
import { getPosts } from "@/lib/blog";
import { siteUrl } from "@/lib/site-url";
import { db } from "@/server/db";
import { listPublicPromptIds } from "@/server/data/community";

async function publicPrompts() {
  "use cache";
  cacheLife("hours");
  try {
    return await listPublicPromptIds(db());
  } catch {
    return []; // e.g. a build without a database; refreshed on the next revalidation
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const [posts, prompts] = await Promise.all([getPosts(), publicPrompts()]);
  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/explore`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${base}/leaderboard`, changeFrequency: "daily" },
    { url: `${base}/pricing`, changeFrequency: "monthly" },
    { url: `${base}/blog`, changeFrequency: "weekly" },
    ...posts.map((p) => ({ url: `${base}/blog/${p.slug}`, lastModified: p.date })),
    ...prompts.map((p) => ({ url: `${base}/p/${p.id}`, lastModified: p.updatedAt })),
  ];
}
