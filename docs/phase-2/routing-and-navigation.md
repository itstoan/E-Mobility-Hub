# Phase 2 – Architecture Design
## Thiết kế Cấu trúc Điều hướng, Phân quyền Route & Tổ chức Feature

## 1. Mục tiêu và Phạm vi thiết kế

### 1.1. Mục tiêu

Thống nhất kiến trúc định tuyến (Routing), cơ chế kiểm soát truy cập theo vai trò (Role-Based Route Guards) và quy ước tổ chức mã nguồn theo mô-đun chức năng (`features/`) cho ứng dụng Frontend **Smart E-Mobility Hub** trong Phase 2.

### 1.2. Phạm vi và Truy vết yêu cầu

- **Phạm vi Use Case:** Bao phủ toàn bộ 12 Use Case từ `UC00` đến `UC11`, phân tách theo hai vai trò người dùng chính là `student` và `system_operator`.
- **Yêu cầu chức năng & phi chức năng:** Đáp ứng `FR-AUTH01` (xác thực và điều hướng theo vai trò), `NFR-S01` (kiểm soát truy cập theo vai trò), `NFR-S02` (ngăn chặn Sinh viên truy cập trái phép chức năng của Đơn vị vận hành) và `NFR-M01` (tính mô-đun).
- **Đồng bộ kiến trúc nhóm:** Tích hợp trực tiếp với Zustand Auth Store (`useAuthStore`) và `AuthInitializer` do Member C thiết kế, đồng thời chuẩn bị các tham số định danh động (`:id`) tương thích với Domain Types do Member B phụ trách.

---

## 2. Cấu trúc thư mục điều hướng và Tích hợp `App.tsx`

### 2.1. Tổ chức các tệp trong `src/routes/`

```text
src/
├── routes/
│   ├── types.ts           # Định nghĩa UserRole ('student' | 'system_operator') và NavItemConfig
│   ├── paths.ts           # Hằng số đường dẫn ROUTES.* & hàm getDefaultHomeByRole()
│   ├── navigation.ts      # Cấu hình danh sách menu Sidebar chuẩn Figma cho Student & Operator
│   ├── ProtectedRoute.tsx # Route Guard kết nối trực tiếp useAuthStore (NFR-S01, NFR-S02)
│   └── AppRouter.tsx      # Cây định tuyến tổng hợp ánh xạ URL tới các Feature Pages
├── features/
│   └── auth/components/
│       └── AuthInitializer.tsx  # Thành phần chờ khôi phục session trước khi render Router
└── App.tsx                # Bọc <AuthInitializer> bên ngoài <AppRouter />
```

### 2.2. Nguyên tắc tích hợp với `src/App.tsx`

- **Tránh lồng ghép Router:** Vì `BrowserRouter` đã được cấu hình ở cấp gốc (`src/main.tsx`), `src/App.tsx` chỉ bọc `<AuthInitializer>` bên ngoài `<AppRouter />`.
- **Đảm bảo thứ tự khởi tạo phiên:** `<AuthInitializer>` chờ trạng thái `authStatus === 'initializing'` hoàn tất khôi phục session từ Local Storage (`auth-storage`) trước khi kích hoạt các Route Guard.
- **Thống nhất thư viện định tuyến:** Toàn bộ các tệp định tuyến sử dụng import từ gói `react-router` để đồng bộ với cấu hình hiện tại của dự án.

---

## 3. Bảng ánh xạ Route – Use Case – Feature Module

Để tránh xung đột đường dẫn giữa các chức năng cùng miền nghiệp vụ (đặc biệt giữa UC06 – Gửi yêu cầu sạc của Sinh viên và UC08 – Quản lý và lập lịch sạc của Đơn vị vận hành), hệ thống tách không gian URL thành ba nhóm: Public (`/login`), Student Workspace (`/student/*`) và System Operator Workspace (`/operator/*`).

### 3.1. Nhóm Public / Authentication

| Route Path | Use Case | Feature Module | Vai trò | Mục đích màn hình |
|---|---|---|---|---|
| `/` | — | `routes/AppRouter.tsx` | All | Tự động điều hướng về `/login`, `/student/hubs` hoặc `/operator/monitoring` |
| `/login` | UC00 | `features/auth/` | Public | Đăng nhập hệ thống và hiển thị thông báo lỗi xác thực |

### 3.2. Không gian làm việc của Sinh viên (`/student/*`)

| Route Path | Use Case | Feature Module | Phụ trách Phase 4 | Mục đích màn hình |
|---|---|---|---|---|
| `/student/hubs` | UC01 | `features/mobility-hub/` | Member A | Tìm kiếm Mobility Hub và phương tiện điện dùng chung |
| `/student/hubs/vehicles/:vehicleId` | UC01 | `features/mobility-hub/` | Member A | Xem chi tiết phương tiện (mức pin, trạng thái khả dụng) |
| `/student/hubs/vehicles/:vehicleId/reserve` | UC02 | `features/reservations/` | Member A | Xác nhận đặt xe nguyên tử chống đặt trùng & nhận mã QR/PIN |
| `/student/reservations` | UC02, UC03 | `features/reservations/` | Member A | Danh sách đơn đặt xe đang giữ chỗ và đơn hết hạn |
| `/student/reservations/:reservationId/pickup` | UC03 | `features/reservations/` | Member A | Quét QR/PIN nhận xe, báo cáo lỗi trước chuyến đi, mở khóa |
| `/student/trips/:tripId` | UC03, UC04 | `features/reservations/` | Member A & B | Theo dõi chuyến đi đang hoạt động và trả xe về Hub |
| `/student/parking` | UC05 | `features/reservations/` | Member A | Tìm Hub, chọn vị trí đỗ cụ thể (VD: P-01), chọn khung giờ & xác nhận |
| `/student/charging` | UC06 | `features/charging/` | Member B | Xem trạng thái cổng sạc & gửi yêu cầu sạc (Pending Scheduling) |

### 3.3. Không gian làm việc của Đơn vị vận hành (`/operator/*`)

| Route Path | Use Case | Feature Module | Phụ trách Phase 4 | Mục đích màn hình |
|---|---|---|---|---|
| `/operator/monitoring` | UC07 | `features/monitoring/` | Member C | Tổng quan mạng lưới Hub, cảnh báo thiếu xe hoặc quá tải bãi đỗ |
| `/operator/monitoring/:hubId` | UC07 | `features/monitoring/` | Member C | Chi tiết tài nguyên Hub & xử lý trạng thái mất kết nối (Last-known) |
| `/operator/charging` | UC08 | `features/charging/` | Member C | Quản lý yêu cầu sạc, xem đề xuất và xác nhận phân bổ cổng sạc |
| `/operator/coordination` | UC09 | `features/vehicle-coordination/` | Member C | Danh sách đề xuất điều phối xe giữa các Mobility Hub |
| `/operator/coordination/:planId` | UC09 | `features/vehicle-coordination/` | Member C | Kiểm tra điều kiện thực tế và phê duyệt/từ chối phương án |
| `/operator/incidents` | UC10 | `features/incidents/` | Member B | Danh sách sự cố phương tiện và cổng sạc cần xử lý |
| `/operator/incidents/:incidentId` | UC10 | `features/incidents/` | Member B | Xác nhận sự cố, cập nhật tiến độ, đóng cảnh báo giả & đơn bị ảnh hưởng |
| `/operator/simulation` | UC11 | `features/simulation/` | Member C | Thiết lập kịch bản giả định (What-if) và xem khuyến nghị điều phối |

---

## 4. Quy tắc điều hướng và Cơ chế Bảo vệ Route

### 4.1. Nguyên tắc điều hướng

- Mọi Route thuộc `/student/*` và `/operator/*` đều được bọc bởi `<ProtectedRoute allowedRoles={[...]} />`.
- Tuyệt đối không sử dụng chuỗi đường dẫn tĩnh (hardcoded URL strings) trong các component; mọi thao tác `<Link>` và `navigate()` phải gọi thông qua hằng số `ROUTES` trong `src/routes/paths.ts`.

### 4.2. Ma trận xử lý trạng thái phiên từ `useAuthStore`

| Trạng thái (`authStatus` & `currentUser`) | Hành vi của `ProtectedRoute` / `PublicOnlyRoute` | Kết quả điều hướng |
|---|---|---|
| `authStatus === 'initializing'` | Chờ `AuthInitializer` khôi phục dữ liệu từ Local Storage | Không thực hiện chuyển hướng |
| `authStatus === 'unauthenticated'` | Chặn truy cập route bảo vệ, lưu đường dẫn hiện tại vào `state.from` | Chuyển hướng về `/login` |
| `authStatus === 'error'` | Chặn truy cập và truyền cờ `authError: true` qua `location.state` | Chuyển hướng về `/login` |
| `authenticated` + đúng role | Cho phép render `<Outlet />` (Layout và trang nghiệp vụ tương ứng) | Giữ nguyên URL hiện tại |
| `authenticated` + sai role | Ví dụ: `student` cố truy cập `/operator/*` hoặc ngược lại | Tự động chuyển hướng về trang mặc định của role hợp lệ |

---

## 5. Quy ước tổ chức mã nguồn trong `src/features/`

Hệ thống tổ chức 12 Use Case thành 8 nhóm feature theo miền nghiệp vụ:

| Thư mục Feature | Use Case bao phủ | Phạm vi nghiệp vụ |
|---|---|---|
| `features/auth/` | UC00 | Đăng nhập, khởi tạo phiên (`AuthInitializer`) và xác thực |
| `features/mobility-hub/` | UC01 | Tra cứu Mobility Hub, phương tiện điện dùng chung và mức pin |
| `features/reservations/` | UC02, UC03, UC04, UC05 | Đặt giữ chỗ nguyên tử, nhận xe, trả xe và đặt trước vị trí đỗ |
| `features/charging/` | UC06, UC08 | Gửi yêu cầu sạc (Pending Scheduling), quản lý và lập lịch sạc |
| `features/monitoring/` | UC07 | Giám sát mạng lưới Hub, cảnh báo sức chứa và dữ liệu mất kết nối |
| `features/vehicle-coordination/` | UC09 | Xem xét điều kiện và phê duyệt phương án điều phối phương tiện |
| `features/incidents/` | UC10 | Ghi nhận, xác nhận, xử lý sự cố và cập nhật đơn bị ảnh hưởng |
| `features/simulation/` | UC11 | Thiết lập tham số mô phỏng What-if và xem khuyến nghị |

Cấu trúc chuẩn bên trong mỗi thư mục feature (tạo theo nhu cầu thực tế):

```text
src/features/<feature-name>/
├── components/   # UI component nội bộ chỉ phục vụ riêng feature này
├── pages/        # Các trang màn hình (Page components) gắn vào AppRouter.tsx
├── hooks/        # Custom hooks đóng gói logic nghiệp vụ của feature
├── types.ts      # Kiểu dữ liệu cục bộ riêng của feature (nếu cần)
└── index.ts      # Barrel file export các thành phần công khai ra ngoài
```

---

## 6. Trạng thái hoàn thành Phase 2 (Member A)

| Hạng mục | Tệp triển khai | Tiến độ |
|---|---|---|
| Thiết kế kiểu dữ liệu điều hướng | `src/routes/types.ts` | Hoàn thành |
| Định nghĩa tập trung đường dẫn | `src/routes/paths.ts` | Hoàn thành |
| Cấu hình menu Sidebar chuẩn Figma | `src/routes/navigation.ts` | Hoàn thành |
| Xây dựng Route Guard kết nối `useAuthStore` | `src/routes/ProtectedRoute.tsx` | Hoàn thành |
| Xây dựng cây định tuyến tổng & tích hợp `App.tsx` | `src/routes/AppRouter.tsx`, `src/App.tsx` | Hoàn thành |
| Tài liệu kiến trúc điều hướng Phase 2 | `docs/phase-2/routing-and-navigation.md` | Hoàn thành |
