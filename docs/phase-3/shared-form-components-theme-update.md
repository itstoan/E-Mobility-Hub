# Phase 3 – Member B: Shared Form Components (Semantic Theme Update)

> **Bản cập nhật để review** từ `phase3_test2.zip`. Chỉ chỉnh 7 component do Member B phụ trách; **không thay** `src/index.css`, `index.ts` hoặc các component của Member C.

## 1. Mục tiêu

Đồng bộ Button, Input, Select, DateTimeInput, Textarea, Dialog và FormField với semantic color tokens trong `src/index.css` do Member C định nghĩa bằng Tailwind CSS v4. Giữ nguyên TypeScript props/API và logic hiện có; không đưa business logic UC04/06/10 vào shared components.

## 2. Nội dung đã chỉnh

| Component | Thay đổi |
|---|---|
| `Button.tsx` | Primary/secondary sử dụng `brand-primary`, `brand-medium`, `surface-*`; danger dùng `status-danger-text`. Giữ `variant`, `isLoading`, `disabled`. |
| `Input.tsx` | Nền, chữ, placeholder, viền, focus, disabled và invalid dùng token. |
| `Select.tsx` | Đồng bộ Input; giữ native options/placeholder. |
| `DateTimeInput.tsx` | Đồng bộ Input; giữ `date`, `time`, `datetime-local`. |
| `Textarea.tsx` | Đồng bộ Input; giữ `rows` để tự điều chỉnh theo UC10. |
| `FormField.tsx` | Label/hint/error/required mark sử dụng token chữ và trạng thái. |
| `Dialog.tsx` | Nền, chữ, overlay và nút đóng theo token; giữ native `<dialog>` và cơ chế mở/đóng. |

### Phạm vi không thay đổi

- `Card.tsx`, `MetricCard.tsx`, `StatusBadge.tsx`, `Table.tsx` thuộc Member C.
- `src/index.css` và hệ thống token thuộc Member C.
- `src/components/ui/index.ts` giữ nguyên vì đã export đủ component cả B và C.
- UI Preview không nằm trong ZIP đầu vào. Có thể giữ trang preview hiện tại và sử dụng để so sánh sau khi thay 7 file.

## 3. Áp dụng trên branch B

Giải nén ZIP ở **root repository**, sao cho các file thay thế đúng `src/components/ui/*.tsx`. Không copy cả thư mục `phase3_test2/` vào `src/`.

```powershell
git status
npx.cmd tsc -p tsconfig.app.json --noEmit
npx.cmd eslint src/components/ui
npm.cmd run build
npm.cmd run dev
```

Xem `/ui-preview.html` (nếu đang giữ trang preview). Kiểm tra primary/secondary/danger, error/disabled, focus, date/time và Dialog qua click/Escape. Đối chiếu palette với màn hình trong Submission #2.

**Chưa xác nhận chạy build/lint trên repository thực tế:** ZIP được kiểm tra về tên token và cú pháp TSX; cần chạy lại các lệnh trên local. Nếu `npm run lint` báo lỗi trong `useAuthStore.ts` của C, tách riêng vấn đề đó khỏi phần B.

## 4. Điểm cần thống nhất với C

- `index.css` khai báo Inter/Jost/Jura nhưng **không tự tải font**; xác nhận font được import/load trong project nếu muốn so sánh đúng font Figma.
- Variant danger dùng `hover:brightness-90` vì palette hiện chưa có token cho `danger-hover`.
- Kiểu `text-white` trong Button là màu tương phản trên nền đậm, không phải màu nhận diện thương hiệu.
- Thống nhất kích thước Button/Input và kích thước font của label sau khi ghép vào màn hình thực tế (không chỉ preview).

## 5. Trạng thái

- [x] Giữ nguyên interface/exports của 7 component B.
- [x] Đổi các class màu cũ sang semantic tokens của C.
- [x] Không sửa các file của C.
- [ ] Chạy TypeScript, ESLint và build trên project đã merge.
- [ ] C/B đối chiếu visual với Figma trong UI Preview.
- [ ] Review và merge PR Phase 3.
