import type { UserRole } from './types';

export const ROUTES = {
    ROOT: '/',
    LOGIN: '/login',

    STUDENT: {
        ROOT: '/student',
        // UC01: Tra cứu Hub & phương tiện
        HUBS: '/student/hubs',
        VEHICLE_DETAILS: (vehicleId = ':vehicleId') =>
            `/student/hubs/vehicles/${vehicleId}`,
        // UC02: Đặt trước phương tiện điện dùng chung
        VEHICLE_RESERVE: (vehicleId = ':vehicleId') =>
            `/student/hubs/vehicles/${vehicleId}/reserve`,
        // UC03 & UC04: Danh sách đơn đặt, nhận xe (QR/PIN) & trả xe / theo dõi chuyến đi
        RESERVATIONS: '/student/reservations',
        PICKUP_VEHICLE: (reservationId = ':reservationId') =>
            `/student/reservations/${reservationId}/pickup`,
        ACTIVE_TRIP: (tripId = ':tripId') => `/student/trips/${tripId}`,
        // UC05: Đặt trước vị trí đỗ (chọn Hub -> chọn ô P-01 -> chọn giờ -> xác nhận)
        PARKING: '/student/parking',
        // UC06: Gửi yêu cầu sạc (trạng thái Pending Scheduling)
        CHARGING: '/student/charging',
    },

    OPERATOR: {
        ROOT: '/operator',
        // UC07: Giám sát mạng lưới Mobility Hub (kèm trạng thái Disconnected / Last-known)
        MONITORING: '/operator/monitoring',
        HUB_DETAILS: (hubId = ':hubId') => `/operator/monitoring/${hubId}`,
        // UC08: Quản lý và lập lịch sạc
        CHARGING: '/operator/charging',
        // UC09: Điều phối phương tiện giữa các Hub
        COORDINATION: '/operator/coordination',
        COORDINATION_PROPOSAL: (planId = ':planId') =>
            `/operator/coordination/${planId}`,
        // UC10: Quản lý sự cố
        INCIDENTS: '/operator/incidents',
        INCIDENT_DETAILS: (incidentId = ':incidentId') =>
            `/operator/incidents/${incidentId}`,
        // UC11: Mô phỏng kịch bản What-if
        SIMULATION: '/operator/simulation',
    },
} as const;

export function getDefaultHomeByRole(role: UserRole | null): string {
    if (role === 'operator') return ROUTES.OPERATOR.MONITORING;
    if (role === 'student') return ROUTES.STUDENT.HUBS;
    return ROUTES.LOGIN;
}