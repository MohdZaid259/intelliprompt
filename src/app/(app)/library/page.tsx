import { Bookmark, Star } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { FeedList, FeedSkeletonGrid } from "@/components/community/feed-list";
import { EmptyState, PageHeading } from "@/components/folders/prompts-view";
import { SoonBadge } from "@/components/soon-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requireUser } from "@/server/auth";

export const metadata: Metadata = { title: "My Library" };

export default function LibraryPage({ searchParams }: PageProps<"/library">) {
  return (
    <div className="space-y-6">
      <PageHeading
        title="My Library"
        description="Prompts you've saved from the community, and your favorites."
      />
      <Tabs defaultValue="saved" className="gap-6">
        <TabsList>
          <TabsTrigger value="saved">Saved prompts</TabsTrigger>
          <TabsTrigger value="fav-prompts" className="gap-2">
            Favorite prompts <SoonBadge className="hidden sm:inline-flex" />
          </TabsTrigger>
          <TabsTrigger value="fav-versions" className="gap-2">
            Favorite versions <SoonBadge className="hidden sm:inline-flex" />
          </TabsTrigger>
        </TabsList>
        <TabsContent value="saved">
          <Suspense fallback={<FeedSkeletonGrid />}>
            <Saved searchParams={searchParams} />
          </Suspense>
        </TabsContent>
        <TabsContent value="fav-prompts">
          <ComingSoon
            title="Favorite prompts"
            body="Star your own best prompts to keep them one click away."
          />
        </TabsContent>
        <TabsContent value="fav-versions">
          <ComingSoon
            title="Favorite versions"
            body="Pin the exact versions that worked best, across all your prompts."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

async function Saved({ searchParams }: { searchParams: PageProps<"/library">["searchParams"] }) {
  const [user, query] = await Promise.all([requireUser(), searchParams]);
  const page = Math.max(1, Number(query.page) || 1);
  return (
    <FeedList
      viewerId={user.id}
      options={{ savedBy: user.id }}
      page={page}
      pageHref={(p) => (p > 1 ? `/library?page=${p}` : "/library")}
      empty={
        <EmptyState
          icon={<Bookmark className="size-8" />}
          title="No saved prompts found"
          body="Tap the bookmark on any prompt in Explore to keep it here."
        />
      }
    />
  );
}

function ComingSoon({ title, body }: { title: string; body: string }) {
  return (
    <EmptyState
      icon={<Star className="size-8" />}
      title={title}
      body={body}
      action={<SoonBadge className="text-xs" />}
    />
  );
}
