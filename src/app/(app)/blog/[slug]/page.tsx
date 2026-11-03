import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Markdown } from "@/components/markdown";
import { Button } from "@/components/ui/button";
import { formatPostDate, getPost, getPosts } from "@/lib/blog";

export async function generateStaticParams() {
  return (await getPosts()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const post = await getPost((await params).slug);
  if (!post) return { title: "Post not found" };
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      images: [post.image],
    },
  };
}

export default async function BlogPostPage({ params }: PageProps<"/blog/[slug]">) {
  const post = await getPost((await params).slug);
  if (!post) notFound();

  return (
    <article className="mx-auto max-w-2xl space-y-6">
      <Link href="/blog" className="text-muted-foreground text-sm hover:underline">
        ← All posts
      </Link>
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">{post.title}</h1>
        <p className="text-muted-foreground text-sm">
          {post.author} · {formatPostDate(post.date)} · {post.readTime}
        </p>
      </header>
      <Image
        src={post.image}
        alt=""
        width={1280}
        height={720}
        priority
        className="aspect-video w-full rounded-lg border object-cover"
      />
      <Markdown className="prose-base">{post.body}</Markdown>
      <div className="bg-muted/50 rounded-lg border p-6 text-center">
        <p className="font-medium">Try it on your own prompts</p>
        <p className="text-muted-foreground mt-1 text-sm">
          Enhance a prompt, compare models side by side, and keep the best version.
        </p>
        <Button asChild className="mt-4">
          <Link href="/prompts/new">Write a prompt</Link>
        </Button>
      </div>
    </article>
  );
}
