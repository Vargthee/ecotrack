import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/contexts/NotificationsContext";
import type { NotificationSeverity } from "@/contexts/NotificationsContext";

export function useRealtimeEvents() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    function connect() {
      const es = new EventSource("/api/events");
      esRef.current = es;

      es.onmessage = (e) => {
        try {
          const event = JSON.parse(e.data);
          handleEvent(event, user!, queryClient, addNotification);
        } catch {}
      };

      es.onerror = () => {
        es.close();
        esRef.current = null;
        setTimeout(connect, 5000);
      };
    }

    connect();

    return () => {
      esRef.current?.close();
      esRef.current = null;
    };
  }, [isAuthenticated, user?.id, queryClient, addNotification]);
}

type AddNotification = ReturnType<typeof useNotifications>["addNotification"];

function notify(
  addNotification: AddNotification,
  severity: NotificationSeverity,
  title: string,
  description: string
) {
  addNotification({ severity, title, description });
  switch (severity) {
    case "success": toast.success(title, { description }); break;
    case "warning": toast.warning(title, { description }); break;
    case "error":   toast.error(title, { description });   break;
    default:        toast.info(title, { description });    break;
  }
}

function handleEvent(
  event: any,
  user: { id: string; role: string },
  queryClient: ReturnType<typeof useQueryClient>,
  addNotification: AddNotification
) {
  const role = user.role;
  const userId = Number(user.id);

  switch (event.type) {
    case "pickup:new": {
      if (role === "admin" || role === "driver") {
        queryClient.invalidateQueries({ queryKey: ["/api/pickups"] });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
        notify(addNotification, "info", "New pickup request",
          `${event.data.wasteType} waste${event.data.address ? ` · ${event.data.address}` : ""}`);
      }
      break;
    }
    case "pickup:status": {
      queryClient.invalidateQueries({ queryKey: ["/api/pickups"] });
      if (event.data.userId === userId) {
        const labels: Record<string, [NotificationSeverity, string]> = {
          assigned:    ["info",    "A driver has been assigned to your pickup"],
          in_progress: ["info",    "Your pickup is now in progress"],
          completed:   ["success", "Your pickup has been completed"],
          cancelled:   ["warning", "Your pickup was cancelled"],
        };
        const hit = labels[event.data.status];
        if (hit) notify(addNotification, hit[0], "Pickup update", hit[1]);
      }
      break;
    }
    case "report:new": {
      if (role === "admin") {
        queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
        notify(addNotification, "info", "New citizen report",
          `${event.data.reportType.replace("_", " ")} · ${event.data.description.slice(0, 60)}`);
      }
      break;
    }
    case "report:status": {
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      break;
    }
    case "task:new": {
      if (role === "admin" || role === "driver") {
        queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
        if (role === "driver") {
          notify(addNotification, "info", "New collection task",
            `${event.data.location} · ${event.data.priority} priority`);
        }
      }
      break;
    }
    case "task:complete": {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/driver/earnings"] });
      if (role === "admin") {
        notify(addNotification, "success", "Task completed",
          `Task ${event.data.id} has been marked done`);
      }
      break;
    }
    case "kyc:status": {
      if (userId === event.data.driverId) {
        queryClient.invalidateQueries({ queryKey: ["/api/driver/kyc"] });
        if (event.data.status === "approved") {
          notify(addNotification, "success", "KYC approved!",
            "You can now accept pickup requests");
        } else {
          notify(addNotification, "error", "KYC rejected",
            event.data.rejectionReason || "Please resubmit your documents");
        }
      }
      if (role === "admin") {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/kyc"] });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      }
      break;
    }
    case "bin:update": {
      queryClient.invalidateQueries({ queryKey: ["/api/bins"] });
      if (role === "admin" && event.data.fillLevel >= 80) {
        notify(addNotification, "warning", "Bin nearly full",
          `Bin ${event.data.id} is at ${event.data.fillLevel}%`);
      }
      break;
    }
  }
}
