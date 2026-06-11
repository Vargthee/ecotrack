import { useState } from "react";
import { Bell, CheckCheck, Trash2, Info, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useNotifications, type AppNotification, type NotificationSeverity } from "@/contexts/NotificationsContext";
import { cn } from "@/lib/utils";

const severityConfig: Record<NotificationSeverity, { icon: React.ComponentType<any>; color: string; bg: string }> = {
  info:    { icon: Info,          color: "text-blue-500",   bg: "bg-blue-50 dark:bg-blue-950/40" },
  success: { icon: CheckCircle2,  color: "text-green-500",  bg: "bg-green-50 dark:bg-green-950/40" },
  warning: { icon: AlertTriangle, color: "text-amber-500",  bg: "bg-amber-50 dark:bg-amber-950/40" },
  error:   { icon: XCircle,       color: "text-red-500",    bg: "bg-red-50 dark:bg-red-950/40" },
};

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function NotificationItem({ n, onRead }: { n: AppNotification; onRead: (id: string) => void }) {
  const { icon: Icon, color, bg } = severityConfig[n.severity];
  return (
    <button
      onClick={() => onRead(n.id)}
      className={cn(
        "w-full text-left flex gap-3 p-3 rounded-lg transition-colors hover:bg-muted/60",
        !n.read && bg
      )}
    >
      <Icon className={cn("shrink-0 mt-0.5 h-4 w-4", color)} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={cn("text-sm font-medium truncate", !n.read && "font-semibold")}>{n.title}</p>
          <span className="text-[11px] text-muted-foreground whitespace-nowrap shrink-0">{timeAgo(n.timestamp)}</span>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.description}</p>
      </div>
      {!n.read && <span className="shrink-0 mt-1.5 h-2 w-2 rounded-full bg-primary" />}
    </button>
  );
}

export function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead, clearAll } = useNotifications();
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 shrink-0">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-4 min-w-[1rem] px-1 text-[10px] leading-none flex items-center justify-center bg-primary text-primary-foreground border-background border-2"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[340px] p-0 shadow-lg"
        sideOffset={8}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <h4 className="text-sm font-semibold">Notifications</h4>
            {unreadCount > 0 && (
              <p className="text-xs text-muted-foreground">{unreadCount} unread</p>
            )}
          </div>
          <div className="flex gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={markAllRead}
                title="Mark all as read"
              >
                <CheckCheck className="h-3.5 w-3.5" />
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground"
                onClick={clearAll}
                title="Clear all"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
        <Separator />
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center px-4">
            <Bell className="h-8 w-8 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">All caught up</p>
            <p className="text-xs text-muted-foreground/60 mt-1">New alerts will appear here</p>
          </div>
        ) : (
          <ScrollArea className="h-[360px]">
            <div className="p-2 space-y-0.5">
              {notifications.map((n) => (
                <NotificationItem key={n.id} n={n} onRead={markRead} />
              ))}
            </div>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
}
