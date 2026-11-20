// File này để dự phòng cho UC07 - tạm thời không sử dụng
// Nhưng vẫn giữ lại để tham khảo cách tạo dữ liệu giả lập cho UC07
import { createMockSeed } from "../../../data/mock/seed";

export type MonitoringRisk =
  | "Parking-capacity risk"
  | "Vehicle shortage";

const mockDatabase = createMockSeed();

export const monitoringSnapshots =
  mockDatabase.monitoring.currentSnapshots;

export const disconnectedHubLastKnown =
  mockDatabase.monitoring.lastKnownSnapshots.find(
    (snapshot) => snapshot.hubId === "HUB-C",
  )!;

export const hubNames: Record<string, string> =
  Object.fromEntries(
    mockDatabase.hubs.map((hub) => [hub.id, hub.name]),
  );

export interface MonitoringAlert {
  hubId: string;
  hubName: string;
  type: MonitoringRisk;
  message: string;
}

export const monitoringAlerts: MonitoringAlert[] =
  monitoringSnapshots
    .flatMap((snapshot) => {
      const hubName = hubNames[snapshot.hubId];

      return snapshot.risks.map((risk) => ({
        hubId: snapshot.hubId,
        hubName,
        type: risk,
        message:
          risk === "Vehicle shortage"
            ? `${snapshot.vehicle.available} vehicles available`
            : `${snapshot.parking.occupied} of ${snapshot.parking.total} spaces occupied`,
      }));
    })
    .reverse();