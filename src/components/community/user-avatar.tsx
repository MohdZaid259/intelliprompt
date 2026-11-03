import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export function UserAvatar({
  user,
  className,
}: {
  user: { username: string; avatarUrl: string };
  className?: string;
}) {
  return (
    <Avatar className={cn("size-6", className)}>
      {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" />}
      <AvatarFallback className="text-[10px] uppercase">{user.username.slice(0, 2)}</AvatarFallback>
    </Avatar>
  );
}
