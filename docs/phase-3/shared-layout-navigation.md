# Phase 3 – Shared UI Foundation
## Thiết kế Application Layout, Typography Tokens & Sidebar dùng chung

## 1. Mục tiêu và Phạm vi thực hiện

### 1.1. Mục tiêu

Xây dựng bộ khung bố cục giao diện dùng chung (`MainLayout`, `Sidebar`) và chuẩn hóa hệ thống font chữ theo đúng quy chuẩn thiết kế Figma (`EmobilityHub-v1`), đồng bộ trạng thái thu gọn/mở rộng Sidebar qua Zustand (`useAppStore`) và thông tin phiên đăng nhập (`useAuthStore`).

### 1.2. Truy vết yêu cầu

- **Tính nhất quán giao diện & Typography (`NFR-U01`, `NFR-U02`):** Chuẩn hóa bộ 3 font Figma (`Jura`, `Inter`, `Jost`) thành design tokens dùng chung và đảm bảo thanh điều hướng thống nhất trên mọi màn hình của `student` (`UC01–UC06`) và `system_operator` (`UC07–UC11`).
- **Phân quyền hiển thị (`FR-AUTH01`, `NFR-S01`):** Tự động kết xuất danh sách menu tương ứng với `UserRole` (`student` hoặc `system_operator`).
- **Tính mô-đun (`NFR-M01`):** Tách biệt toàn bộ thành phần bố cục vào `src/layouts/`, giúp các Feature Page trong Phase 4 tập trung vào nội dung nghiệp vụ bên trong `<Outlet />`.

---

## 2. Cấu trúc thư mục & Design Tokens Font

```text
index.html                 # Nhúng Google Fonts: Jura, Inter, Jost
src/
├── index.css              # Khai báo Tailwind v4 @theme tokens (--font-brand, --font-sans, --font-heading)
├── layouts/
│   ├── NavIcons.tsx       # Bộ icon SVG chuẩn Figma (Brand, Navigation, Chevrons, Logout, Menu)
│   ├── Sidebar.tsx        # Thanh điều hướng trái mở rộng (w-72) / thu gọn (w-20), căn giữa menu dọc
│   ├── MainLayout.tsx     # Khung bố cục tổng ghép Sidebar + vùng nội dung <Outlet/>
│   └── index.ts           # Barrel file export MainLayout, Sidebar
└── routes/
    └── AppRouter.tsx      # Bọc các route bảo vệ trong <MainLayout/>
```

### Quy chuẩn Typography theo Figma

| Token / Class | Font Family | Phạm vi áp dụng |
|---|---|---|
| `font-brand` (`--font-brand`) | **Jura** | Tên thương hiệu `SMART E-MOBILITY HUB` ở góc trên bên trái Sidebar |
| `font-sans` (`--font-sans`) | **Inter** | Các mục điều hướng trên Sidebar (`Explore Hubs`, `Parking`, `My Reservations`, `Charging`, ...) và nội dung văn bản chung |
| `font-heading` (`--font-heading`) | **Jost** | Tiêu đề chính (`<h1>`) của từng trang màn hình (ví dụ: `Search Mobility Hubs and Resources`) |

---

## 3. Đặc tả các thành phần Layout

### 3.1. `MainLayout` (`src/layouts/MainLayout.tsx`)

- Kết hợp `<Sidebar />` cố định bên trái (`md:sticky md:top-0 md:h-screen`) và vùng nội dung chính màu trắng (`bg-white`) bên phải, loại bỏ thanh Header phụ phía trên để khớp hoàn toàn với không gian mở của Figma.
- Vùng chứa nội dung căn giữa với độ rộng tối đa `max-w-6xl` và khoảng đệm `px-6 py-8 sm:px-12 sm:py-10`.

### 3.2. `Sidebar` (`src/layouts/Sidebar.tsx`)

| Thuộc tính / Hành vi | Chi tiết triển khai |
|---|---|
| Bảng màu chuẩn Figma | Nền `#071915`, biểu tượng thương hiệu & mục đang chọn màu xanh ngọc `#2AD08C`, nền mục đang chọn `#10382F` |
| Căn chỉnh danh sách menu | Khối `<nav>` sử dụng `flex flex-1 flex-col justify-center` để căn giữa dọc toàn bộ các mục điều hướng ở khoảng giữa Sidebar giống các frame Figma |
| Trạng thái mở rộng / thu gọn | Đọc `sidebarOpen` và gọi `toggleSidebar()` từ `useAppStore`; chuyển đổi mượt giữa `w-72` (mở rộng) và `w-20` (thu gọn) |
| Chân Sidebar (Footer) | Hiển thị avatar chữ cái đầu, `currentUser.displayName`, nhãn vai trò và nút đăng xuất (`logout()` + chuyển về `/login`) |

---

## 4. Quy ước tích hợp cho Phase 4

1. **Sử dụng đúng class Typography:** Tiêu đề trang (`<h1>`) dùng `font-heading` (**Jost**); văn bản mô tả, bảng biểu, nút bấm và form dùng `font-sans` (**Inter**).
2. **Không tự tạo Sidebar trong từng Feature Page:** Mọi trang thuộc `/student/*` và `/operator/*` đã được bọc tự động trong `<MainLayout />`.

---

## 5. Trạng thái hoàn thành Phase 3 (Member A)

| Hạng mục | Tệp triển khai | Trạng thái |
|---|---|---|
| Thiết lập Font Tokens Figma (`Jura`, `Inter`, `Jost`) | `index.html`, `src/index.css` | Hoàn thành |
| Cập nhật Sidebar căn giữa menu & chuẩn font | `src/layouts/Sidebar.tsx` | Hoàn thành |
| Tinh gọn MainLayout (loại bỏ thanh Header phụ) | `src/layouts/MainLayout.tsx`, `src/layouts/index.ts` | Hoàn thành |
| Tài liệu tổng hợp Phase 3 | `docs/phase-3/shared-layout-navigation.md` | Hoàn thành |