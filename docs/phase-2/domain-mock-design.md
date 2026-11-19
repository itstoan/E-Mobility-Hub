# Phase 2 – Architecture Design
## Thiết kế Domain Types & Mock Data

### 1. Mục tiêu

Thiết kế các TypeScript domain types/interfaces, xác định các thực thể và quan hệ dữ liệu cần dùng cho Smart E-Mobility Hub.
Tổ chức Mock Data và quy ước truy cập dữ liệu mẫu để các thành viên sử dụng chung khi triển khai feature.

### 2. Công việc đã thực hiện

| Hạng mục | Nội dung |
|---|---|
| **Domain Model** | Định nghĩa các kiểu và interface chung trong `domain.ts`: User, MobilityHub, Vehicle, ParkingSpace, ChargingPort, các loại Reservation, Trip, ChargingRequest/Schedule, VehicleTransferProposal, Incident và IncidentImpact. |
| **Quan hệ dữ liệu** | Liên kết các thực thể thông qua ID (ví dụ: `Vehicle.currentHubId`, `Trip.reservationId`, `ChargingSchedule.requestId`, `Incident.resourceId`); tập hợp các collection trong `MockDatabase`. |
| **Mock Data** | Tạo dữ liệu giả cho người dùng, Hub, xe, chỗ đỗ, cổng sạc, đặt trước, chuyến đi, yêu cầu/lịch sạc, đề xuất điều phối và sự cố. Có tình huống mẫu như Hub mất kết nối, xe không khả dụng và lịch sạc bị gián đoạn. |
| **Mock Authentication** | Cung cấp danh sách tài khoản demo và `authenticateMockUser(email, password)` để phần Auth Store của C sử dụng. `User` trả về không chứa password. |
| **Truy cập dữ liệu** | Cung cấp `loadInitialSnapshot()` qua `mockDataSource`, trả về bản sao độc lập của dữ liệu khởi tạo, không cập nhật trực tiếp seed gốc. |
| **Kiểm tra TypeScript** | Đã kiểm tra trên project chung bằng `npx.cmd tsc -p tsconfig.app.json --noEmit`; kết quả không có lỗi sau khi Auth Store của C import kiểu `User` từ `domain.ts`. |

### 3. File bàn giao

```text
src/
├── types/
│   └── domain.ts
└── data/
    └── mock/
        ├── users.ts
        ├── mockAuth.ts
        ├── seed.ts
        └── mockDataSource.ts
```

- `domain.ts`: định nghĩa cấu trúc và trạng thái dữ liệu dùng chung.
- `users.ts`: dữ liệu người dùng mẫu.
- `mockAuth.ts`: hàm xác thực demo dựa trên dữ liệu mẫu.
- `seed.ts`: hàm `createMockSeed(now)` tạo bộ dữ liệu khởi tạo; các mốc thời gian tính tương đối từ `now`.
- `mockDataSource.ts`: hợp đồng `AppDataSource` và hàm tải snapshot ban đầu cho ứng dụng.

### 4. Quy ước sử dụng và phạm vi

- Import kiểu dữ liệu chung từ `src/types/domain.ts`, tránh định nghĩa trùng ở từng feature.
- Dùng `mockDataSource.loadInitialSnapshot()` để lấy dữ liệu nghiệp vụ khởi tạo; không sửa trực tiếp dữ liệu seed. `mockAuth.ts` phục vụ xác thực demo riêng.
- Các quan hệ giữa thực thể dùng ID, thời gian trong seed là chuỗi ISO 8601 (UTC), trạng thái được giới hạn bằng union types.
- Đây là nền tảng dữ liệu cho prototype Frontend, chưa bao gồm xử lý nghiệp vụ UC trong Phase 4, quản lý Zustand hoặc backend/database.
- Chưa viết script kiểm thử/validator cho seed; chưa kiểm thử chức năng và các luồng UC (thuộc Phase 4).

**Kiểm tra tích hợp TypeScript trên local**

```powershell
npx.cmd tsc -p tsconfig.app.json --noEmit
```

- **Kết quả đã thực hiện:** Không có lỗi TypeScript trên project chung.
- **Tương thích với C:** `src/stores/useAuthStore.ts` cần `import type { User } from "../types/domain";`; sau khi bổ sung import, lệnh kiểm tra chạy thành công. Đây là thay đổi trong file do C phụ trách, cần C xác nhận/đưa vào commit phù hợp.
- **Giới hạn:** Kết quả trên chỉ kiểm tra TypeScript; chưa xác nhận `npm run build`, dữ liệu seed hợp lệ khi chạy thực tế hoặc luồng đăng nhập/Use Case hoạt động.

### 5. Trạng thái hoàn thành

| Hạng mục | Trạng thái |
|---|---|
| Thiết kế TypeScript domain types/interfaces | Đã soạn đề xuất |
| Xác định các entity và quan hệ dữ liệu | Đã soạn đề xuất |
| Tổ chức cấu trúc Mock Data và dữ liệu mẫu | Đã hoàn thành file mẫu |
| Xác định nguyên tắc truy cập Mock Data | Đã hoàn thành thiết kế và file truy cập |
| Tương thích kiểu `User` với Auth Store của C | Đạt ở mức TypeScript sau khi bổ sung import |
| Kiểm tra TypeScript trên project chung | Đạt – không có lỗi |
| Thống nhất các interface và domain với A/C | Chờ review/chốt thiết kế |
| Kiểm tra build và chạy chức năng thực tế | Chưa thực hiện |

