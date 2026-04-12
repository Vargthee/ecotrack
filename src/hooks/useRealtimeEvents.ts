import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export function useRealtimeEvents() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    function connect() {
      const es = new EventSource("/api/events");
      esRef.current = es;

      es.onmessage = (e) => {
        try {
          const event = JSON.parse(e.data);
          handleEvent(event, user!, queryClient);
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
  }, [isAuthenticated, user?.id, queryClient]);
}

function handleEvent(event: any, user: { id: string; role: string }, queryClient: ReturnType<typeof useQueryClient>) {
  const role = user.role;
  const userId = Number(user.id);

  switch (event.type) {
    case "pickup:new": {
      if (role === "admin" || role === "driver") {
        queryClient.invalidateQueries({ queryKey: ["/api/pickups"] });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
        toast.info("New pickup request", {
          description: `${event.data.wasteType} waste${event.data.address ? ` · ${event.data.address}` : ""}`,
        });
      }
      break;
    }
    case "pickup:status": {
      queryClient.invalidateQueries({ queryKey: ["/api/pickups"] });
      if (event.data.userId === userId) {
        const labels: Record<string, string> = {
          assigned: "A driver has been assigned to your pickup",
          in_progress: "Your pickup is now in progress",
          completed: "Your pickup has been completed",
          cancelled: "Your pickup was cancelled",
        };
        const msg = labels[event.data.status];
        if (msg) toast.info("Pickup update", { description: msg });
      }
      break;
    }
    case "report:new": {
      if (role === "admin") {
        queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
        toast.info("New citizen report", {
          description: `${event.data.reportType.replace("_", " ")} · ${event.data.description.slice(0, 60)}`,
        });
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
          toast.info("New collection task", {
            description: `${event.data.location} · ${event.data.priority} priority`,
          });
        }
      }
      break;
    }
    case "task:complete": {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/driver/earnings"] });
      if (role === "admin") {
        toast.success("Task completed", { description: `Task ${event.data.id} has been marked done` });
      }
      break;
    }
    case "kyc:status": {
      if (userId === event.data.driverId) {
        queryClient.invalidateQueries({ queryKey: ["/api/driver/kyc"] });
        if (event.data.status === "approved") {
          toast.success("KYC approved!", { description: "You can now accept pickup requests" });
        } else {
          toast.error("KYC rejected", { description: event.data.rejectionReason || "Please resubmit your documents" });
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
        toast.warning("Bin nearly full", {
          description: `Bin ${event.data.id} is at ${event.data.fillLevel}%`,
        });
      }
      break;
    }
  }
}
