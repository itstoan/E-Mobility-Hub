# Phase 3 – Member C: Shared UI Foundation

## 1. Phạm vi thực hiện

Hoàn thiện nhóm Shared UI Components dùng chung:

- `Card.tsx`
- `MetricCard.tsx`
- `StatusBadge.tsx`
- `Table.tsx`

Cập nhật màu sắc các component theo palette mới được định nghĩa trong `src/index.css`.

## 2. Cơ chế hoạt động

### Semantic Color Tokens

Palette được khai báo trong `@theme` của Tailwind CSS v4 thông qua các biến `--color-*`.

Ví dụ:

```css
@theme {
  --color-brand-primary: #087F65;
  --color-text-primary: #071A1A;
  --color-surface-page: #FFFFFF;
  --color-border-default: #D5DFDB;
}
```

Tailwind tự tạo các utility classes tương ứng:

| Token | Cách sử dụng |
|---|---|
| `--color-brand-primary` | `bg-brand-primary`, `text-brand-primary` |
| `--color-text-primary` | `text-text-primary` |
| `--color-surface-page` | `bg-surface-page` |
| `--color-border-default` | `border-border-default` |

Thay vì gắn trực tiếp mã HEX hoặc sử dụng màu mặc định như `slate-500`, các component sử dụng semantic token để đảm bảo tính nhất quán và dễ thay đổi giao diện.

### Cơ chế tái sử dụng

- `Card`: Cung cấp khung hiển thị nội dung dùng chung.
- `MetricCard`: Sử dụng `Card` để hiển thị tiêu đề, giá trị và mô tả.
- `StatusBadge`: Hiển thị trạng thái thông qua các variant `success`, `warning`, `danger`, `info`, `neutral`.
- `Table`: Hiển thị dữ liệu tổng quát thông qua `columns`, `data` và `render` tùy chọn.

Các component nhận dữ liệu và tùy chỉnh giao diện thông qua props, không phụ thuộc vào dữ liệu nghiệp vụ cụ thể.

## 3. Cách sử dụng

Import component từ thư mục dùng chung:

```tsx
import {
  Card,
  MetricCard,
  StatusBadge,
  Table,
} from '@/components/ui';
```

Ví dụ:

```tsx
<MetricCard
  title="Available Vehicles"
  value={24}
  description="Currently available"
/>

<StatusBadge variant="success">
  Available
</StatusBadge>

<Card>
  Shared content
</Card>
```

Đối với `Table`, truyền danh sách cột và dữ liệu:

```tsx
<Table
  columns={[
    { key: 'name', header: 'Name' },
    { key: 'status', header: 'Status' },
  ]}
  data={[
    { name: 'Hub A', status: 'Available' },
    { name: 'Hub B', status: 'Occupied' },
  ]}
/>
```

Khi cần thay đổi màu sắc, ưu tiên sử dụng token đã định nghĩa trong `index.css`, không tự ý thêm mã HEX hoặc màu tùy chỉnh nếu chưa có yêu cầu thiết kế.

## 4. Kiểm thử

### 4.1. Kiểm tra TypeScript

Chạy tại thư mục gốc dự án:

```bash
npx tsc --noEmit
```

Mục đích:
- Kiểm tra lỗi kiểu dữ liệu TypeScript.
- Kiểm tra props và cách sử dụng component.
- Đảm bảo không phát sinh lỗi biên dịch kiểu dữ liệu.

### 4.2. Kiểm tra Build

```bash
npm run build
```

Mục đích:
- Kiểm tra quá trình build production.
- Phát hiện lỗi import/export, JSX và Tailwind.
- Đảm bảo các thay đổi không làm hỏng quá trình đóng gói ứng dụng.

**Trạng thái:** Build đã được thực hiện.

### 4.3. Kiểm tra giao diện thủ công

Chạy ứng dụng:

```bash
npm run dev
```

Kiểm tra trên UI Preview hoặc màn hình đang sử dụng các component:

1. `Card`: Kiểm tra nền, border, padding và nội dung.
2. `MetricCard`: Kiểm tra tiêu đề, giá trị và mô tả.
3. `StatusBadge`: Kiểm tra đủ năm variant trạng thái.
4. `Table`: Kiểm tra header, dữ liệu, trạng thái hover và trường hợp không có dữ liệu.
5. Kiểm tra màu sắc có đồng nhất với palette mới và không còn màu cũ ngoài chủ đích thiết kế.

## 5. Kết quả

- Hoàn thiện nhóm Shared UI Components.
- Áp dụng semantic color tokens theo palette mới.
- Duy trì khả năng tái sử dụng thông qua props.
- Đã thực hiện kiểm tra Build.

Các Dashboard/UC components thuộc phạm vi Phase 4 không nằm trong phạm vi triển khai của tài liệu này.