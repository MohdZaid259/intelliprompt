import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/prompts", "/saved", "/settings", "/billing", "/admin", "/unsubscribe"],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
