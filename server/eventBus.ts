import { EventEmitter } from "events";

export type AppEvent =
  | { type: "pickup:new";    data: { id: number; wasteType: string; address?: string } }
  | { type: "pickup:status"; data: { id: number; status: string; userId?: number } }
  | { type: "report:new";    data: { id: string; reportType: string; description: string } }
  | { type: "report:status"; data: { id: string; status: string } }
  | { type: "task:new";      data: { id: string; location: string; priority: string; driverId?: number | null } }
  | { type: "task:complete"; data: { id: string; driverId?: number | null } }
  | { type: "kyc:status";    data: { driverId: number; status: string; rejectionReason?: string } }
  | { type: "bin:update";    data: { id: string; fillLevel: number } };

class AppEventBus extends EventEmitter {}

export const eventBus = new AppEventBus();
eventBus.setMaxListeners(200);

export function emitEvent(event: AppEvent) {
  eventBus.emit("app:event", event);
}
