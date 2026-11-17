# SMART E-MOBILITY HUB – FRONTEND

Frontend của dự án Smart E-Mobility Hub, được phát triển bằng React và TypeScript.

- **GitHub:** https://github.com/itstoan/E-Mobility-Hub
- **Figma UI Design:** https://www.figma.com/design/CLBW0LpfCSaO1cjkJwgjwy/EmobilityHub-v1?node-id=0-1&t=mRDglN1Bqp1GEIT2-1

---

## 1. Công nghệ sử dụng

| Công nghệ | Mục đích |
|---|---|
| React | Xây dựng giao diện |
| TypeScript | Kiểm soát kiểu dữ liệu |
| Vite | Development server và build |
| Tailwind CSS v4 | Styling |
| React Router | Điều hướng giữa các trang |
| Zustand | Quản lý trạng thái dùng chung |
| Mock Data | Dữ liệu giả phục vụ phát triển Frontend |
| npm | Quản lý packages |

Các thành viên sử dụng chung phiên bản dependencies được khai báo trong `package.json` và `package-lock.json`.

## 2. Yêu cầu môi trường

Trước khi làm việc, mỗi thành viên cần cài đặt:

- **Node.js và npm:** https://nodejs.org/en/download
- **Git:** quản lý mã nguồn.

Kiểm tra cài đặt:

```bash
node -v
npm -v
git --version
```

**Lưu ý:**

- npm được cài kèm với Node.js.
- Không cần cài Vite riêng trên máy.
- Không cần cài riêng React, TypeScript, Tailwind CSS, React Router hoặc Zustand. Các package này được quản lý trong project.

## 3. Cài đặt và chạy project

### 3.1. Clone repository

```bash
git clone https://github.com/itstoan/E-Mobility-Hub.git
cd E-Mobility-Hub
```

### 3.2. Cài đặt dependencies

```bash
npm install
```

### 3.3. Chạy ứng dụng

```bash
npm run dev
```

Mở địa chỉ được hiển thị trong terminal, thông thường là:

```text
http://localhost:5173/
```

### 3.4. Kiểm tra build

```bash
npm run build
```

## 4. Cấu trúc thư mục

```text
E-Mobility-Hub/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   │   └── ui/
│   ├── data/
│   │   └── mock/
│   ├── features/
│   │   ├── auth/
│   │   ├── charging/
│   │   ├── incidents/
│   │   ├── mobility-hub/
│   │   ├── monitoring/
│   │   ├── reservations/
│   │   ├── simulation/
│   │   └── vehicle-coordination/
│   ├── layouts/
│   ├── routes/
│   ├── stores/
│   │   └── useAppStore.ts
│   ├── types/
│   ├── utils/
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── .gitignore
├── eslint.config.js
├── index.html
├── package.json
├── package-lock.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
└── README.md
```

### 4.1. Quy định tổ chức mã nguồn

| Thư mục | Nội dung được phép đặt |
|---|---|
| `assets/` | Hình ảnh, icon và tài nguyên tĩnh được sử dụng trong giao diện |
| `components/ui/` | Các UI component dùng chung như Button, Input, Select, Dialog, Badge |
| `data/mock/` | Mock data, dữ liệu mẫu và các tập dữ liệu giả phục vụ Frontend |
| `features/` | Mã nguồn riêng của từng nhóm chức năng |
| `layouts/` | Bố cục dùng chung như Dashboard Layout, Sidebar, Header nếu được tổ chức ở cấp layout |
| `routes/` | Khai báo và tổ chức route, ánh xạ URL với trang tương ứng |
| `stores/` | Zustand stores quản lý trạng thái dùng chung |
| `types/` | TypeScript types/interfaces dùng chung giữa nhiều feature |
| `utils/` | Các hàm tiện ích dùng chung, không gắn với riêng một feature |

### 4.2. Quy định bên trong `features/`

Mỗi feature chứa những thành phần phục vụ riêng cho chức năng đó.

Có thể tổ chức theo cấu trúc sau khi cần:

```text
features/
└── reservations/
    ├── components/
    ├── pages/
    ├── hooks/
    ├── types.ts
    └── index.ts
```

| Thành phần | Nội dung |
|---|---|
| `components/` | Component chỉ được sử dụng trong feature |
| `pages/` | Các trang/màn hình của feature |
| `hooks/` | Custom hooks riêng của feature |
| `types.ts` | Kiểu dữ liệu chỉ sử dụng trong feature |
| `index.ts` | Export các thành phần cần cung cấp ra bên ngoài, nếu cần |

Không bắt buộc tạo tất cả các thư mục/file trên ngay từ đầu. Chỉ tạo khi feature thực sự cần sử dụng.

### 4.3. Phân nhóm Use Case theo feature

| Feature | Use Case |
|---|---|
| `auth/` | UC00 – Đăng nhập |
| `mobility-hub/` | UC01 – Tra cứu Mobility Hub và tài nguyên |
| `reservations/` | UC02, UC03, UC04, UC05 – Đặt trước, nhận xe, trả xe và đặt chỗ đỗ |
| `charging/` | UC06, UC08 – Gửi yêu cầu sạc, quản lý và lập lịch sạc |
| `monitoring/` | UC07 – Giám sát mạng lưới Mobility Hub |
| `vehicle-coordination/` | UC09 – Điều phối phương tiện |
| `incidents/` | UC10 – Quản lý sự cố |
| `simulation/` | UC11 – Mô phỏng và phân tích kịch bản |

**Nguyên tắc:** Không chia mỗi Use Case thành một feature riêng nếu chúng thuộc cùng một nhóm nghiệp vụ. Những UC có liên quan được tổ chức trong cùng feature để dễ tái sử dụng và quản lý.

## 5. Quy định thiết kế giao diện – Figma

Figma là nguồn tham chiếu chính thức cho giao diện Frontend. Tất cả thành viên phải tuân thủ các quy định sau.

### 5.1. Màu sắc và giao diện

1. Sử dụng màu sắc theo thiết kế Figma đã thống nhất.
2. Không tự ý thêm màu chủ đạo, thay đổi bảng màu hoặc tạo một phong cách giao diện khác.
3. Các trạng thái như thành công, cảnh báo, lỗi và trạng thái không khả dụng phải sử dụng cách thể hiện nhất quán với thiết kế.
4. Không tự ý thay đổi font, kích thước chữ, khoảng cách, kích thước component và bố cục nếu chưa có sự thống nhất.
5. Khi triển khai các giá trị màu dùng chung, ưu tiên tập trung chúng thành design tokens/theme dùng chung thay vì khai báo màu tùy ý ở nhiều nơi.

### 5.2. Component

1. Ưu tiên tái sử dụng component và variant đã có trong Figma.
2. Không tự tạo một component mới nếu component tương ứng đã tồn tại và có thể tái sử dụng.
3. Các component dùng chung phải được triển khai trong `components/ui/`.
4. Component chỉ phục vụ một feature phải đặt trong thư mục `components/` của feature đó.
5. Khi cần thay đổi hoặc bổ sung variant cho component dùng chung, phải thống nhất với các thành viên trước khi thay đổi.

### 5.3. Tính nhất quán giữa các màn hình

1. Các màn hình phải tuân thủ bố cục, màu sắc và phong cách thiết kế đã thống nhất.
2. Sidebar, Header và các thành phần điều hướng dùng chung phải có cách hiển thị và hành vi nhất quán.
3. Trạng thái Sidebar mở rộng và thu gọn phải được xử lý thống nhất giữa các trang.
4. Các biểu mẫu, nút thao tác, thông báo và trạng thái phản hồi phải có hành vi nhất quán.
5. Nội dung hiển thị trên giao diện sử dụng tiếng Anh theo thiết kế Figma.

### 5.4. Đối chiếu Use Case và UI Mockup

1. Mỗi màn hình phải được đối chiếu với Use Case và UI Mockup tương ứng.
2. Không chỉ triển khai luồng chính; phải xem xét các màn hình luồng thay thế và trạng thái lỗi đã được mô tả trong UI Mockup.
3. Không tự ý bỏ qua các trạng thái quan trọng như dữ liệu không hợp lệ, không có kết quả, tài nguyên không khả dụng, thao tác thất bại hoặc trạng thái cần xác nhận.
4. Không tự thêm nghiệp vụ hoặc màn hình làm thay đổi phạm vi Use Case khi chưa được nhóm thống nhất.

## 6. Phân công công việc

Nhóm Frontend gồm 3 thành viên: A, B và C.

### 6.1. Phase 2 – Architecture Design

Mục tiêu: thống nhất kiến trúc Frontend, cách tổ chức mã nguồn, dữ liệu và quản lý trạng thái trước khi phát triển các chức năng.

| Thành viên | Nhiệm vụ |
|---|---|
| A | Thiết kế cấu trúc điều hướng; xác định route cho các trang; thống nhất quy ước tổ chức feature và cách kết nối các trang với route |
| B | Thiết kế TypeScript domain types/interfaces; xác định các entity và quan hệ dữ liệu cần dùng; tổ chức cấu trúc Mock Data và nguyên tắc truy cập dữ liệu mẫu |
| C | Thiết kế Zustand stores; xác định trạng thái dùng chung; thống nhất cách quản lý session, thông tin người dùng, role và các quy tắc cập nhật state |

**Kết quả cần có:**

- Cấu trúc thư mục và quy ước tổ chức mã nguồn.
- Danh sách route và quy tắc điều hướng.
- Các domain types/interfaces dùng chung.
- Cấu trúc Mock Data.
- Thiết kế Zustand stores và nguyên tắc quản lý state.

### 6.2. Phase 3 – Shared UI Foundation

Mục tiêu: xây dựng nền tảng giao diện dùng chung để các thành viên có thể phát triển các feature mà không phải tạo lại những thành phần giống nhau.

| Thành viên | Nhiệm vụ |
|---|---|
| A | Xây dựng Application Layout; Sidebar; Header; điều hướng; xử lý Sidebar mở rộng/thu gọn và bố cục trang dùng chung |
| B | Xây dựng các component biểu mẫu dùng chung như Button, Input, Select, Date/Time Input, Dialog và các thành phần nhập liệu cần thiết |
| C | Xây dựng các component hiển thị dùng chung như Card, Table, Status Badge, Metric/Statistic Card và các thành phần Dashboard |

**Nguyên tắc phối hợp:**

- Tất cả component phải đối chiếu với Figma.
- Component có thể tái sử dụng phải được thống nhất API/props trước khi các feature sử dụng.
- Không tạo các component trùng chức năng ở nhiều feature nếu có thể sử dụng component chung.
- Các thay đổi ảnh hưởng đến component dùng chung phải được thông báo cho cả nhóm.

### 6.3. Phase 4 – Feature Development

Mục tiêu: hiện thực các chức năng theo Use Case, bao gồm luồng chính và các luồng thay thế quan trọng.

| Thành viên | Use Case | Nhiệm vụ chính |
|---|---|---|
| A | UC00, UC01, UC02, UC03, UC05 | Đăng nhập; tra cứu Mobility Hub và tài nguyên; đặt trước và nhận xe điện; đặt trước vị trí đỗ |
| B | UC04, UC06, UC10 | Trả xe điện; gửi yêu cầu sạc; quản lý và xử lý sự cố |
| C | UC07, UC08, UC09, UC11 | Giám sát mạng lưới; quản lý và lập lịch sạc; điều phối phương tiện; mô phỏng và phân tích kịch bản |

Mỗi thành viên chịu trách nhiệm:

- Triển khai các màn hình thuộc Use Case được phân công.
- Xử lý luồng chính và các trạng thái thay thế quan trọng theo UI Mockup.
- Tái sử dụng shared components.
- Kiểm tra giao diện với Figma.
- Kiểm tra chức năng và báo cáo lỗi trước khi tạo Pull Request.

Lưu ý: Số lượng Use Case không đồng nghĩa với khối lượng công việc bằng nhau. Các chức năng như UC08 và UC11 có phạm vi xử lý phức tạp hơn, vì vậy các thành viên cần hỗ trợ và phối hợp khi cần thiết.

## 7. Quy tắc phát triển và quản lý Git

### 7.1. Quy tắc đặt tên branch

Tên branch phải mô tả tính năng hoặc công việc, không sử dụng tên thành viên.

| Prefix | Mục đích | Ví dụ |
|---|---|---|
| `feature/` | Phát triển chức năng mới | `feature/ev-reservation` |
| `fix/` | Sửa lỗi | `fix/login-validation` |
| `refactor/` | Tái cấu trúc mã nguồn | `refactor/route-configuration` |
| `style/` | Điều chỉnh giao diện và CSS | `style/dashboard-layout` |
| `docs/` | Cập nhật tài liệu | `docs/update-readme` |
| `chore/` | Cấu hình hoặc công việc bảo trì | `chore/update-dependencies` |

### 7.2. Bắt đầu một công việc mới

Trước mỗi công việc mới, thành viên phải cập nhật `main`:

```bash
git switch main
git pull origin main
```

Tạo branch mới theo tính năng:

```bash
git switch -c feature/your-feature-name
```

Ví dụ:

```bash
git switch -c feature/ev-reservation
```

Nếu branch đã tồn tại:

```bash
git switch feature/ev-reservation
```

Trước khi chuyển branch, phải commit hoặc stash các thay đổi chưa hoàn thành để tránh mất dữ liệu.

### 7.3. Commit và push

Kiểm tra thay đổi:

```bash
git status
```

Commit:

```bash
git add .
git commit -m "feat: implement EV reservation"
```

Push branch lần đầu:

```bash
git push -u origin feature/ev-reservation
```

Những lần push tiếp theo:

```bash
git push
```

Quy ước commit message:

| Prefix | Mục đích |
|---|---|
| `feat:` | Thêm chức năng |
| `fix:` | Sửa lỗi |
| `style:` | Điều chỉnh giao diện |
| `refactor:` | Tái cấu trúc |
| `docs:` | Cập nhật tài liệu |
| `chore:` | Cấu hình và bảo trì |

### 7.4. Pull Request và đồng bộ

Sau khi hoàn thành một chức năng:

1. Push branch lên GitHub.
2. Tạo Pull Request từ branch cá nhân vào `main`.
3. Kiểm tra thay đổi và giải quyết conflict nếu có.
4. Chờ review trước khi merge.
5. Sau khi merge, cập nhật `main` ở máy cá nhân trước khi bắt đầu công việc tiếp theo.

Không phát triển feature trực tiếp trên `main` sau khi hoàn tất commit khởi tạo ban đầu.

## 8. Phạm vi triển khai Frontend

- Sử dụng Mock Data đối với các chức năng chưa có Backend/API.
- Dữ liệu mô phỏng phải được phân biệt rõ với dữ liệu thực tế.
- Không tuyên bố dữ liệu giám sát, IoT hoặc kết quả mô phỏng là dữ liệu thực tế nếu chưa có hệ thống tương ứng.
- Việc phân quyền điều hướng trên Frontend không thay thế cơ chế xác thực và phân quyền ở Backend.
- Các thao tác cần Backend có thể được mô phỏng ở phạm vi Frontend, nhưng phải giữ đúng ý nghĩa nghiệp vụ của Use Case.

---

**Lưu ý:** Khi thêm hoặc gỡ package, phải cập nhật và commit cả `package.json` và `package-lock.json` để bảo đảm các thành viên sử dụng cùng cấu hình dependencies.