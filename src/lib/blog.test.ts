import { describe, expect, it } from "vitest";
import { getPost, getPosts, parsePost } from "./blog";

describe("blog", () => {
  it("parses frontmatter and body", () => {
    const post = parsePost(
      "hello",
      `---
title: "Hello: world"
excerpt: "An intro"
date: 2026-11-01
author: "Zaid"
category: news
readTime: "2 min read"
image: /blog/x.jpeg
---
# Body`,
    );
    expect(post).toMatchObject({
      slug: "hello",
      title: "Hello: world",
      date: "2026-11-01",
      body: "# Body",
    });
  });

  it("loads every post in content/blog, newest first", async () => {
    const posts = await getPosts();
    expect(posts.length).toBeGreaterThanOrEqual(6);
    const dates = posts.map((p) => p.date);
    expect([...dates].sort().reverse()).toEqual(dates);
  });

  it("rejects unsafe or unknown slugs", async () => {
    expect(await getPost("../package")).toBeNull();
    expect(await getPost("does-not-exist")).toBeNull();
  });
});
