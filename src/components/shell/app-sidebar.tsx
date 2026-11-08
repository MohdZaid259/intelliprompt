"use client";

import { SignOutButton } from "@clerk/nextjs";
import {
  BookIcon,
  ChevronRight,
  ChevronsUpDown,
  CreditCard,
  FileText,
  Folder,
  FolderOpen,
  Inbox,
  LayoutDashboard,
  LibraryIcon,
  LogOut,
  MoreHorizontal,
  Pencil,
  Plus,
  Settings,
  Shield,
  Star,
  Sparkles,
  Trash2,
  TrophyIcon,
  User,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { DeleteFolderDialog, FolderNameDialog } from "@/components/folders/folder-dialogs";
import { ReviewDialog, type MyReview } from "@/components/reviews/review-dialog";

export type ShellUser = {
  name: string;
  username: string;
  avatarUrl: string;
  role: "user" | "admin";
  review: MyReview | null;
};
export type ShellFolder = { id: string; name: string; promptCount: number };
export type ShellPrompt = { id: string; title: string; folderId: string | null };

const MAIN = [
  { href: "/explore", label: "Explore", icon: UsersIcon, auth: false },
  { href: "/leaderboard", label: "Leaderboard", icon: TrophyIcon, auth: false },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, auth: true },
  { href: "/library", label: "My Library", icon: LibraryIcon, auth: true },
  { href: "/blog", label: "Blog", icon: BookIcon, auth: false },
  { href: "/pricing", label: "Pricing", icon: Sparkles, auth: false, signedOutOnly: true },
] as const;

export function AppSidebar({
  user,
  folders,
  prompts,
}: {
  user: ShellUser | null;
  folders: ShellFolder[];
  prompts: ShellPrompt[];
}) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const close = () => setOpenMobile(false);
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const links = MAIN.filter((l) => (user ? !("signedOutOnly" in l) : !l.auth));

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <div className="px-2 py-2" onClick={close}>
          <Logo />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarMenu>
            {links.map(({ href, label, icon: Icon }) => (
              <SidebarMenuItem key={href}>
                <SidebarMenuButton asChild isActive={isActive(href)}>
                  <Link href={href} onClick={close}>
                    <Icon /> {label}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        {user && <PromptsSection pathname={pathname} close={close} prompts={prompts} />}
        {user && (
          <FoldersSection folders={folders} prompts={prompts} pathname={pathname} close={close} />
        )}
      </SidebarContent>

      <SidebarFooter>{user ? <UserMenu user={user} /> : <SignedOutCard />}</SidebarFooter>
    </Sidebar>
  );
}

function PromptsSection({
  pathname,
  close,
  prompts,
}: {
  pathname: string;
  close: () => void;
  prompts: ShellPrompt[];
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Prompts</SidebarGroupLabel>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton asChild isActive={pathname === "/prompts"}>
            <Link href="/prompts" onClick={close}>
              <FileText /> All prompts
            </Link>
          </SidebarMenuButton>
          <SidebarMenuBadge>{prompts.length}</SidebarMenuBadge>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton asChild isActive={pathname === "/prompts/new"}>
            <Link href="/prompts/new" onClick={close}>
              <Plus /> New prompt
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}

function FoldersSection({
  folders,
  prompts,
  pathname,
  close,
}: {
  folders: ShellFolder[];
  prompts: ShellPrompt[];
  pathname: string;
  close: () => void;
}) {
  const [creating, setCreating] = useState(false);
  const [renaming, setRenaming] = useState<ShellFolder | null>(null);
  const [deleting, setDeleting] = useState<ShellFolder | null>(null);
  const unsorted = prompts.filter((p) => !p.folderId).length;

  return (
    <SidebarGroup>
      <SidebarGroupLabel asChild>
        <Link href="/folders" onClick={close}>
          Folders
        </Link>
      </SidebarGroupLabel>
      <SidebarGroupAction title="New folder" onClick={() => setCreating(true)}>
        <Plus /> <span className="sr-only">New folder</span>
      </SidebarGroupAction>

      <SidebarMenu>
        {folders.length === 0 && (
          <p className="text-muted-foreground px-2 py-1 text-xs">No folders yet</p>
        )}
        {folders.map((folder) => {
          const href = `/folders/${folder.id}`;
          const inside = prompts.filter((p) => p.folderId === folder.id);
          const active = pathname === href;
          return (
            <Collapsible key={folder.id} asChild defaultOpen={active}>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={active}>
                  <Link href={href} onClick={close}>
                    {active ? <FolderOpen /> : <Folder />}
                    <span className="truncate">{folder.name}</span>
                  </Link>
                </SidebarMenuButton>
                <CollapsibleTrigger asChild>
                  <SidebarMenuAction className="right-7 data-[state=open]:rotate-90">
                    <ChevronRight /> <span className="sr-only">Show prompts</span>
                  </SidebarMenuAction>
                </CollapsibleTrigger>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuAction showOnHover>
                      <MoreHorizontal /> <span className="sr-only">Folder options</span>
                    </SidebarMenuAction>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="right" align="start">
                    <DropdownMenuItem onClick={() => setRenaming(folder)}>
                      <Pencil /> Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem variant="destructive" onClick={() => setDeleting(folder)}>
                      <Trash2 /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {inside.map((p) => (
                      <SidebarMenuSubItem key={p.id}>
                        <SidebarMenuSubButton asChild isActive={pathname === `/prompts/${p.id}`}>
                          <Link href={`/prompts/${p.id}`} onClick={close}>
                            <FileText /> <span className="truncate">{p.title}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                    <SidebarMenuSubItem>
                      <Link
                        href={`/prompts/new?folder=${folder.id}`}
                        onClick={close}
                        className="text-muted-foreground hover:text-primary px-2 py-1 text-xs"
                      >
                        + Add prompt
                      </Link>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
        {unsorted > 0 && (
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === "/folders/unsorted"}>
              <Link href="/folders/unsorted" onClick={close}>
                <Inbox /> Unsorted
              </Link>
            </SidebarMenuButton>
            <SidebarMenuBadge>{unsorted}</SidebarMenuBadge>
          </SidebarMenuItem>
        )}
        <SidebarMenuItem>
          <SidebarMenuButton onClick={() => setCreating(true)} className="text-muted-foreground">
            <Plus /> New folder
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>

      <FolderNameDialog open={creating} onOpenChange={setCreating} goToNew />
      <FolderNameDialog
        open={!!renaming}
        onOpenChange={(o) => !o && setRenaming(null)}
        folder={renaming ?? undefined}
      />
      <DeleteFolderDialog
        folder={deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        leavePage={!!deleting && pathname === `/folders/${deleting.id}`}
      />
    </SidebarGroup>
  );
}

function UserMenu({ user }: { user: ShellUser }) {
  const [reviewing, setReviewing] = useState(false);
  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg">
              <Avatar className="size-7">
                <AvatarImage src={user.avatarUrl} alt="" />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="text-muted-foreground truncate text-xs">@{user.username}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            align="start"
            className="w-(--radix-dropdown-menu-trigger-width) min-w-52"
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">Account</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href={`/u/${user.username}`}>
                <User /> Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/billing">
                <CreditCard /> Billing
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Settings /> Settings
              </Link>
            </DropdownMenuItem>
            {user.role === "admin" && (
              <DropdownMenuItem asChild>
                <Link href="/admin">
                  <Shield /> Admin
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onSelect={() => setReviewing(true)}>
              <Star /> {user.review ? "Edit your review" : "Leave a review"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <SignOutButton>
              <DropdownMenuItem variant="destructive">
                <LogOut /> Log out
              </DropdownMenuItem>
            </SignOutButton>
          </DropdownMenuContent>
        </DropdownMenu>
        {reviewing && (
          <ReviewDialog open={reviewing} onOpenChange={setReviewing} review={user.review} />
        )}
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

function SignedOutCard() {
  return (
    <div className="bg-sidebar-accent/50 space-y-2 rounded-lg border p-3 text-sm">
      <p className="font-medium">Build better prompts</p>
      <p className="text-muted-foreground text-xs">
        Sign in to save prompts, compare models and join the community.
      </p>
      <div className="flex gap-2">
        <Button asChild size="sm" className="flex-1">
          <Link href="/sign-up">Sign up</Link>
        </Button>
        <Button asChild size="sm" variant="outline" className="flex-1">
          <Link href="/sign-in">Sign in</Link>
        </Button>
      </div>
    </div>
  );
}
