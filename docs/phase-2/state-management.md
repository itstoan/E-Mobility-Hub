# Phase 2 – Architecture Design
## Thiết kế quản lý trạng thái với Zustand

## 1. Xác định trạng thái dùng chung (Shared State Identification)

### 1.1. Mục tiêu

Xác định các trạng thái cần được chia sẻ giữa nhiều component trong ứng dụng và thống nhất cách quản lý bằng Zustand.

Phạm vi chỉ bao gồm trạng thái ở cấp độ toàn ứng dụng (*application-level shared state*). Trạng thái riêng của từng feature sẽ do thành viên phụ trách feature xác định trong Phase 4.

### 1.2. Các trạng thái được xác định

| State | Kiểu dữ liệu | Ý nghĩa | Store |
|---|---|---|---|
| `sidebarOpen` | `boolean` | Trạng thái mở/thu gọn Sidebar | `useAppStore` |
| `currentUser` | `User \| null` | Thông tin người dùng hiện tại | `useAuthStore` |
| `authStatus` | `AuthStatus` | Trạng thái xác thực và khởi tạo session | `useAuthStore` |

Các trạng thái được chia thành hai nhóm:

- **Application UI State:** Quản lý trạng thái giao diện dùng chung.
- **Authentication & Session State:** Quản lý người dùng hiện tại và trạng thái xác thực.

### 1.3. Phạm vi quản lý

Không đưa trạng thái nghiệp vụ riêng của các feature vào hai store trên. Chỉ bổ sung shared state khi thực sự có nhu cầu sử dụng chung ở cấp độ ứng dụng.

---

## 2. Thiết kế Authentication & Session

### 2.1. Mục tiêu

Quản lý thông tin người dùng và trạng thái xác thực thống nhất trong toàn ứng dụng. Trong giai đoạn Frontend hiện tại, việc đăng nhập sử dụng Mock Data, chưa yêu cầu tích hợp Backend.

### 2.2. Trạng thái xác thực

`useAuthStore` quản lý:

- `currentUser`: Người dùng hiện tại, có giá trị `null` khi chưa có session.
- `authStatus`: Trạng thái xác thực, gồm:

```ts
type AuthStatus =
  | 'initializing'
  | 'authenticated'
  | 'unauthenticated'
  | 'error'
```

Ý nghĩa:

| Trạng thái | Ý nghĩa |
|---|---|
| `initializing` | Đang khôi phục session |
| `authenticated` | Đã xác lập trạng thái có người dùng |
| `unauthenticated` | Không có người dùng đăng nhập |
| `error` | Khôi phục session gặp lỗi |

Tách `authStatus` khỏi `currentUser` giúp phân biệt quá trình khởi tạo, lỗi khôi phục và trạng thái chưa đăng nhập.

### 2.3. Các thao tác chính

| Hàm | Trách nhiệm |
|---|---|
| `initializeAuth()` | Xác định trạng thái xác thực sau khi khôi phục dữ liệu |
| `login(email, password)` | Kiểm tra thông tin đăng nhập và thiết lập session |
| `logout()` | Xóa thông tin người dùng và kết thúc session |
| `setAuthError()` | Đánh dấu lỗi khôi phục session |

`setCurrentUser()` là helper nội bộ của store, chịu trách nhiệm cập nhật `currentUser` và `authStatus`. Component không gọi trực tiếp helper này mà sử dụng các thao tác nghiệp vụ như `login()` và `logout()`.

### 2.4. Luồng đăng nhập và đăng xuất

**Đăng nhập:**
1. Người dùng nhập email và password.
2. Hệ thống đối chiếu thông tin với Mock User Data.
3. Nếu hợp lệ, lưu thông tin cần thiết của người dùng và chuyển sang `authenticated`.
4. Nếu không hợp lệ, thông báo lỗi chung và giữ nguyên session hiện tại.

Chỉ lưu các thông tin cần thiết như ID, tên, email và role. Không lưu password.

**Đăng xuất:**
1. Xóa `currentUser`.
2. Chuyển `authStatus` sang `unauthenticated`.
3. Persist Middleware đồng bộ dữ liệu mới vào Local Storage.

Đăng xuất không tự động thay đổi các trạng thái UI độc lập như `sidebarOpen`.

### 2.5. Khôi phục session và Persistence

Sử dụng Zustand Persist Middleware với cấu hình:

| Thuộc tính | Giá trị |
|---|---|
| Storage key | `auth-storage` |
| Storage | Local Storage |
| Dữ liệu được lưu | `currentUser` |
| Dữ liệu không lưu | `authStatus` |

Sau khi khôi phục:

- Có `currentUser` → `authenticated`.
- Không có `currentUser` → `unauthenticated`.
- Khôi phục thất bại → `error`.

`AuthInitializer` chờ quá trình khởi tạo hoàn tất trước khi render nội dung ứng dụng. Component này không thay thế Auth Guard hoặc cơ chế phân quyền.

### 2.6. Nguyên tắc bảo mật và phạm vi

- Không lưu password trong Zustand hoặc Local Storage.
- Role được lấy từ thông tin người dùng trong Mock Data, không lấy từ dữ liệu nhập tùy ý.
- Kiểm tra role ở Frontend chỉ phục vụ hiển thị và điều hướng giao diện, không thay thế Backend Authorization.
- Lỗi khôi phục session không được xem là trạng thái chưa đăng nhập.
- Thiết kế hiện tại phục vụ Frontend sử dụng Mock Data, chưa yêu cầu API xác thực thực tế.

`User`, `UserRole` và cấu trúc Mock User Data sẽ sử dụng định nghĩa chung do Member B phụ trách, không tạo kiểu dữ liệu trùng lặp trong Auth Store.

---

## 3. Trạng thái hoàn thành

| Hạng mục | Tiến độ |
|---|---|
| Xác định application-level shared state | Hoàn thành |
| Thiết kế Zustand stores | Đã thống nhất |
| Thiết kế Authentication & Session | Đã thống nhất |
| Quy tắc cập nhật state | Đã thống nhất |
| Tích hợp `User`, `UserRole`, Mock Data | Chờ Member B |
| Hoàn thiện và kiểm thử đăng nhập | Chưa hoàn thành |

**Phạm vi:** Tài liệu này chỉ mô tả thiết kế shared state và authentication/session trong Phase 2. Không bao gồm feature-specific state của Phase 4.