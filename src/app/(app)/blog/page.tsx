import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatPostDate, getPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog",
  description: "Prompting tips, guides and product notes from the IntelliPrompt team.",
};

export default async function BlogPage() {
  const posts = await getPosts();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Blog</h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}`} className="group space-y-3">
            <Image
              src={post.image}
              alt=""
              width={640}
              height={360}
              className="aspect-video w-full rounded-lg border object-cover"
            />
            <div className="space-y-1">
              <div className="text-muted-foreground flex items-center gap-2 text-xs">
                <Badge variant="secondary">{post.category}</Badge>
                {formatPostDate(post.date)} · {post.readTime}
              </div>
              <h2 className="font-semibold group-hover:underline">{post.title}</h2>
              <p className="text-muted-foreground line-clamp-2 text-sm">{post.excerpt}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
