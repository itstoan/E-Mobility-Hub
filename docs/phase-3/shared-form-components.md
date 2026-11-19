# Phase 3 – Shared UI Foundation
## Member B – Shared Form Components

> **Trạng thái:** Bản triển khai đầu tiên (initial implementation), chờ review và đồng bộ giao diện.

### 1. Mục tiêu

Xây dựng các thành phần nhập liệu tái sử dụng cho giao diện Smart E-Mobility Hub, theo phân công Phase 3 trong `readme.txt`. Component độc lập với Zustand, Mock Data, routing và logic các Use Case của Phase 4.

### 2. Các file đã triển khai

| File | Công dụng |
|---|---|
| `src/components/ui/Button.tsx` | Button `primary`, `secondary`, `danger`; hỗ trợ `disabled`, `isLoading` và HTML button props. |
| `src/components/ui/Input.tsx` | Input HTML dùng chung; hỗ trợ trạng thái `invalid`, `disabled`. |
| `src/components/ui/Select.tsx` | Select native nhận `options`, `placeholder`; hỗ trợ `invalid`, `disabled`. |
| `src/components/ui/DateTimeInput.tsx` | Input `date`, `time`, `datetime-local` phù hợp các form đặt trước/yêu cầu sạc. |
| `src/components/ui/Textarea.tsx` | Ô ghi chú nhiều dòng, có thể dùng ở UC10; hỗ trợ `rows`, `invalid`, `disabled`. |
| `src/components/ui/Dialog.tsx` | Modal dùng HTML `<dialog>`, có `open`, `onClose`, `title`, `children`, `footer`. |
| `src/components/ui/FormField.tsx` | Nhóm `label`, `hint`, `error`, dấu trường bắt buộc cho các control. |
| `src/components/ui/index.ts` | Re-export components/types để thuận tiện import (tùy chọn sử dụng). |

### 3. Trang xem thử (chỉ dùng để phát triển)

- `ui-preview.html` ở thư mục gốc và `src/dev/ui-preview.tsx` tạo trang xem riêng, không cần đăng nhập hoặc dùng `AppRouter`.
- Chạy `npm run dev`, sau đó mở `/ui-preview` theo cổng Vite hiển thị.
- Preview có ví dụ typography và các trạng thái mặc định, lỗi, vô hiệu hóa, loading, và Dialog để so sánh với mockup Submission #2.
- Đã quan sát được trang preview render qua ảnh chụp trong quá trình phát triển; các tương tác và chức năng chi tiết cần kiểm tra riêng.

### 4. Quy ước và giới hạn

- Công nghệ: React + TypeScript + Tailwind CSS 4 đã có trong project; không thêm thư viện UI component.
- Màu `teal`/`slate`, kích thước, font và spacing hiện tại là **style mẫu**, **chưa được xác nhận khớp Figma**. Member C sẽ phối hợp chốt/tinh chỉnh màu và design tokens; thông báo trước khi sửa API/props dùng chung.
- Member A phụ trách layout; Member C phụ trách shared display components. Member B chưa hiện thực màn hình hoặc nghiệp vụ UC04, UC06, UC10 trong PR này.
- `FormField` hiển thị label/hint/error; khi dùng thực tế cần truyền đúng `id`, `aria-describedby`, `required` và `invalid` xuống input tương ứng.
- `ui-preview.html` và `src/dev/ui-preview.tsx` là công cụ phát triển: có thể giữ trong PR để A/C review hoặc loại khỏi PR sau khi review; không phải route chính thức của ứng dụng.

### 5. Kiểm tra

Chạy `npx.cmd tsc -p tsconfig.app.json --noEmit` – không lỗi.
Chạy `npm.cmd run lint` – '_email' và '_password' được tạo mà không sử dụng (chỉ là mẫu).
Chạy `npm.cmd run build` – thành công.
Mở preview, thử nhập liệu và các trạng thái `disabled`/`invalid`.
Thử Dialog mở/đóng qua nút, dấu ×, phím Escape.
Kiểm tra Responsive cơ bản và khả năng sử dụng bằng bàn phím.
Cần thống nhất cách import, props và chỉnh màu theo Figma.

### 6. Trạng thái bàn giao

| Hạng mục | Trạng thái |
|---|---|
| 7 shared form components | Đã có bản triển khai đầu tiên |
| Re-export qua `index.ts` | Đã có |
| Preview độc lập | Đã render trên trình duyệt |
| Lint / TypeScript / build trên repository nhóm | Chờ xác nhận bằng lệnh local |
| Đồng bộ pixel/color/font với Figma | Chờ Member C review và hiệu chỉnh |
| Tích hợp với các Use Case | Phase 4 |

