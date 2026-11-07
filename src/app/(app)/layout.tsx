import { Suspense } from "react";
import { AppSidebar } from "@/components/shell/app-sidebar";
import { BreadcrumbProvider } from "@/components/shell/breadcrumbs";
import { TopBar } from "@/components/shell/top-bar";
import { Sidebar, SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getUser } from "@/server/auth";
import { db } from "@/server/db";
import { listFolders } from "@/server/data/folders";
import { listPrompts } from "@/server/data/prompts";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <SidebarProvider>
      <BreadcrumbProvider>
        {/* the shell reads the session, so it streams in behind boundaries */}
        <Suspense fallback={<Sidebar variant="inset" />}>
          <ShellSidebar />
        </Suspense>
        <SidebarInset>
          <Suspense fallback={<div className="h-14 shrink-0 border-b" />}>
            <ShellTopBar />
          </Suspense>
          <div className="mx-auto w-full max-w-6xl flex-1 p-4 md:p-8">{children}</div>
        </SidebarInset>
      </BreadcrumbProvider>
    </SidebarProvider>
  );
}

async function ShellSidebar() {
  const user = await getUser();
  if (!user) return <AppSidebar user={null} folders={[]} prompts={[]} />;
  const [folders, prompts] = await Promise.all([
    listFolders(db(), user.id),
    listPrompts(db(), user.id),
  ]);
  return (
    <AppSidebar
      user={{
        name: user.name,
        username: user.username,
        avatarUrl: user.avatarUrl,
        role: user.role,
      }}
      folders={folders}
      prompts={prompts.map((p) => ({ id: p.id, title: p.title, folderId: p.folderId }))}
    />
  );
}

async function ShellTopBar() {
  const user = await getUser();
  return <TopBar plan={user?.plan ?? null} />;
}
