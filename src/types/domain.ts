
export type Id = string;
// All seed timestamps use UTC ISO 8601 (Date#toISOString).
export type ISODateTime = string;

export type UserRole = "student" | "system_operator";
export interface User {
  id: Id;
  displayName: string;
  email: string; // Unique after trimming and lowercasing; never store a password here.
  role: UserRole;
}

export type ConnectionStatus = "online" | "disconnected";
export interface MobilityHub {
  id: Id;
  name: string;
  locationLabel: string;
  connectionStatus: ConnectionStatus;
  lastTelemetryAt: ISODateTime; //mốc dữ liệu cuối.
  sharedVehicleCapacity: number;
}

export type VehicleStatus =
  | "available" | "reserved" | "in_use"
  | "needs_charging" | "charging" | "maintenance" | "unavailable";
export interface Vehicle {
  id: Id;
  label: string;
  type: "e_bike" | "e_scooter";
  currentHubId: Id | null; // là null khi xe không ở Hub
  batteryPercent: number;
  status: VehicleStatus;
}

export type ParkingOccupancy = "empty" | "occupied" | "out_of_service";
export interface ParkingSpace {
  id: Id;
  hubId: Id;
  code: string;
  occupancy: ParkingOccupancy;
}

// Trạng thái hiện tại của cổng sạc, không phải trạng thái đặt trước
export type ChargingPortState = "idle" | "charging" | "out_of_service";
export interface ChargingPort {
  id: Id;
  hubId: Id;
  code: string;
  physicalState: ChargingPortState;
}

export type VehicleReservationStatus =
  | "reserved" | "active" | "completed" | "cancelled" | "expired";
export interface VehicleReservation {
  id: Id;
  userId: Id;
  vehicleId: Id;
  pickupHubId: Id;
  createdAt: ISODateTime;
  requestedStartAt: ISODateTime;
  requestedEndAt: ISODateTime;
  expiresAt: ISODateTime; // Pickup/hold deadline

  pickupCode: string;
  status: VehicleReservationStatus;
}

export interface Trip {
  id: Id;
  reservationId: Id;
  userId: Id;
  vehicleId: Id;
  startHubId: Id;
  returnHubId: Id | null;
  startedAt: ISODateTime;
  endedAt: ISODateTime | null;
  returnConfirmedAt: ISODateTime | null;
  status: "active" | "completed";
}

export interface ParkingReservation {
  id: Id;
  userId: Id;
  parkingSpaceId: Id;
  startAt: ISODateTime;
  endAt: ISODateTime;
  status: "confirmed" | "cancelled" | "completed";
}

export type ChargingRequestStatus =
  | "pending_scheduling" | "scheduled" | "needs_rescheduling"
  | "charging" | "completed" | "cancelled";
export interface ChargingRequest {
  id: Id;
  userId: Id;
  hubId: Id;
  personalVehicleLabel: string;
  requestedStartAt: ISODateTime;
  requestedEndAt: ISODateTime;
  batteryPercent?: number;
  neededByAt?: ISODateTime;
  status: ChargingRequestStatus;
}

// Đề xuất lịch trình sạc (UC08)
export interface ChargingScheduleProposal {
  id: Id;
  requestId: Id;
  portId: Id;
  startAt: ISODateTime;
  endAt: ISODateTime;
  status: "proposed" | "outdated";
}

// Phiên sạc thực tế
export interface ChargingSchedule {
  id: Id;
  requestId: Id;
  portId: Id;
  startAt: ISODateTime;
  endAt: ISODateTime;
  status: "allocated" | "charging" | "completed" | "cancelled" | "disrupted";
}

// Đề xuất chuyển xe (UC09)
export type VehicleTransferProposalStatus =
  | "proposed" | "approved" | "rejected" | "outdated";
export interface VehicleTransferProposal {
  id: Id;
  sourceHubId: Id;
  destinationHubId: Id;
  vehicleCount: number;
  status: VehicleTransferProposalStatus;
  createdAt: ISODateTime;
  reviewedByUserId?: Id;
  reviewedAt?: ISODateTime;
}

export type IncidentStatus =
  | "reported" | "confirmed" | "in_progress" | "resolved" | "false_alarm";
export interface Incident {
  id: Id;
  hubId: Id;
  resourceType: "vehicle" | "charging_port";
  resourceId: Id;
  description: string;
  status: IncidentStatus;
  reportedAt: ISODateTime;
  reportedByUserId?: Id; // User(UC03) hoặc System(UC10)
  handlingNotes?: string;
  proposedResolution?: string;
}

export interface IncidentImpact {
  id: Id;
  incidentId: Id;
  affectedType: "vehicle_reservation" | "charging_schedule";
  affectedId: Id;
  status: "pending_review" | "resolved";
}

//Mẫu dataset
export interface MockDatabase {
  users: User[];
  hubs: MobilityHub[];
  vehicles: Vehicle[];
  parkingSpaces: ParkingSpace[];
  chargingPorts: ChargingPort[];
  vehicleReservations: VehicleReservation[];
  trips: Trip[];
  parkingReservations: ParkingReservation[];
  chargingRequests: ChargingRequest[];
  chargingScheduleProposals: ChargingScheduleProposal[];
  chargingSchedules: ChargingSchedule[];
  vehicleTransferProposals: VehicleTransferProposal[];
  incidents: Incident[];
  incidentImpacts: IncidentImpact[];
}
