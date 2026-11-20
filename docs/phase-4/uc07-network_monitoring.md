# UC07 – Giám sát mạng lưới (Network Monitoring)

## 1. Tổng quan

UC07 – Network Monitoring cung cấp cho Operator giao diện theo dõi tình trạng tài nguyên trên toàn bộ mạng lưới Mobility Hub.

Chức năng cho phép Operator:

- Xem trạng thái kết nối của các Mobility Hub.
- Theo dõi số lượng phương tiện khả dụng.
- Theo dõi tình trạng sử dụng và khả dụng của chỗ đỗ xe.
- Theo dõi trạng thái các cổng sạc.
- Nhận biết các Hub có nguy cơ thiếu hụt tài nguyên hoặc quá tải thông qua cảnh báo minh họa.
- Lọc danh sách để chỉ hiển thị các Hub có rủi ro (At-Risk Hubs).
- Xem thông tin tài nguyên chi tiết của một Hub được chọn.
- Xem dữ liệu gần nhất đã ghi nhận khi Hub bị mất kết nối.

**Phạm vi triển khai:** Phiên bản hiện tại là Frontend Prototype sử dụng mock data. Chưa kết nối Backend API, chưa có cơ chế giám sát thời gian thực, phát hiện sự cố kết nối thực tế hoặc tự động tính toán rủi ro tài nguyên.

---

## 2. Cấu trúc Frontend

Các file chính của UC07:

```text
src/
├── components/
│   └── ui/
│       ├── Banner.tsx
│       └── index.ts
│
├── features/
│   └── monitoring/
│       └── pages/
│           ├── MonitorNetworkPage.tsx
│           └── HubResourcesDetail.tsx
│
├── data/
│   └── mock/
│       └── seed.ts
│
└── types/
    └── domain.ts
```

### 2.1. Component Banner dùng chung

**File:** `src/components/ui/Banner.tsx`

Tạo component Banner dùng chung để hiển thị các thông báo, cảnh báo trên các trang Monitoring. Mục đích là thống nhất giao diện và tránh lặp lại JSX cũng như CSS ở từng trang.

Component hỗ trợ ba variant:

| Variant | Giao diện | Mục đích sử dụng |
|---|---|---|
| `success` | Nền xanh lá nhạt, chữ đen | Thông tin tích cực hoặc trạng thái thành công |
| `warning` | Nền vàng nhạt, tiêu đề màu cảnh báo, nội dung chữ đen | Cảnh báo thiếu hụt tài nguyên hoặc nguy cơ quá tải |
| `danger` | Nền đỏ nhạt, tiêu đề màu nguy hiểm, nội dung chữ đen | Trạng thái mất kết nối hoặc tình trạng nghiêm trọng |

Các thuộc tính của component:

- `variant`: Xác định kiểu hiển thị của Banner.
- `title`: Tiêu đề chính.
- `description`: Nội dung mô tả, không bắt buộc.
- `className`: Cho phép bổ sung CSS khi cần thiết.

Component sử dụng các semantic color token đã được định nghĩa trong `index.css`, không tạo thêm bảng màu riêng.

Ví dụ:

```tsx
<Banner
  variant="warning"
  title="Parking-capacity risk"
  description="18 of 20 spaces occupied."
/>
```

Component được export thông qua `src/components/ui/index.ts` để các feature khác có thể tái sử dụng.

### 2.2. Các Shared UI Component được sử dụng

Monitoring tái sử dụng các component UI có sẵn trong dự án:

| Component | Trách nhiệm |
|---|---|
| `Banner` | Hiển thị thông báo và cảnh báo |
| `Button` | Hiển thị nút với giao diện thống nhất |
| `Card` | Nhóm các thông tin tài nguyên |
| `StatusBadge` | Hiển thị trạng thái kết nối và tài nguyên |
| `Table` | Hiển thị danh sách Hub và thông tin tài nguyên |

Không tạo thêm các phiên bản trùng lặp của những component dùng chung này.

---

## 3. Các trang Monitoring

### 3.1. Network Overview – Tổng quan mạng lưới

**File:** `MonitorNetworkPage.tsx`

Đây là trang Monitoring chính, cung cấp cái nhìn tổng quan về trạng thái tài nguyên của tất cả Mobility Hub trong mạng lưới.

#### Thông tin hiển thị

| Thông tin | Mô tả |
|---|---|
| Hub / Connection | Tên Hub, Hub ID và trạng thái kết nối |
| Vehicles | Số phương tiện khả dụng, đang sử dụng và không khả dụng |
| Parking spaces | Số chỗ đỗ đã sử dụng, còn khả dụng và không khả dụng |
| Charging ports | Số cổng sạc khả dụng, đang sử dụng và không khả dụng |
| View | Mở trang chi tiết của Hub được chọn |

#### Các Banner cảnh báo tài nguyên

Trang hiển thị các Banner cảnh báo dựa trên thông tin `risks` trong các Monitoring snapshot hiện tại.

Các loại cảnh báo minh họa đang được hỗ trợ:

- `Vehicle shortage`: Thiếu hụt phương tiện.
- `Parking-capacity risk`: Nguy cơ quá tải chỗ đỗ xe.

Mỗi Banner hiển thị loại rủi ro, tên Hub và thông tin mô tả ngắn về tình trạng tài nguyên tương ứng.

Các cảnh báo này được định nghĩa sẵn trong mock data. Frontend không tự tính toán ngưỡng cảnh báo và không tự phát hiện rủi ro.

#### Bộ lọc At-Risk Hubs

Trang cung cấp nút `Overload/Resource Shortage Alerts`.

Khi Operator bật bộ lọc:

1. Frontend đặt `showAtRiskOnly` thành `true`.
2. Danh sách Hub được lọc dựa trên mảng `riskLabels`.
3. Chỉ những Hub có ít nhất một nhãn rủi ro mới được hiển thị.
4. Tiêu đề khu vực danh sách chuyển thành `At-Risk Hubs`.
5. Nút `Clear Filter` xuất hiện để xóa bộ lọc.

Khi Operator xóa bộ lọc, toàn bộ danh sách Hub được hiển thị trở lại.

Bộ lọc không thay đổi mock data và không cập nhật trạng thái tài nguyên.

#### Điều hướng

Khi chọn một Hub, hệ thống điều hướng đến trang chi tiết:

```text
/operator/monitoring/{hubId}
```

Nội dung nút điều hướng phụ thuộc vào trạng thái kết nối:

- Hub Online: `View Details`.
- Hub Disconnected: `View Disconnection`.

---

### 3.2. Hub Resource Details – Chi tiết tài nguyên Hub

**File:** `HubResourcesDetail.tsx`

Trang này hiển thị thông tin tài nguyên chi tiết của một Mobility Hub được chọn.

Đây là trang giám sát chỉ đọc (Read-only).

Trang không cung cấp chức năng phân bổ tài nguyên, đặt chỗ, quản lý phiên sạc hoặc ghi nhận sự cố.

#### Trường hợp Hub Online

Với Hub đang kết nối, trang hiển thị ba nhóm tài nguyên.

**Vehicles – Phương tiện**

- Số phương tiện khả dụng.
- Số phương tiện đang được sử dụng.
- Số phương tiện không khả dụng.
- Tổng số phương tiện.

**Parking – Chỗ đỗ xe**

- Số chỗ đỗ đang được sử dụng.
- Tổng số chỗ đỗ.
- Số chỗ đỗ còn khả dụng.
- Số chỗ đỗ không khả dụng.

Mức sử dụng chỗ đỗ được hiển thị theo dạng:

```text
Occupied / Total
```

**Charging – Cổng sạc**

- Số cổng sạc khả dụng.
- Số cổng sạc đang được sử dụng.
- Số cổng sạc không khả dụng.
- Tổng số cổng sạc.

Nếu có bản ghi cổng sạc, trang sẽ hiển thị thêm bảng chi tiết.

Bảng Charging Resource Detail gồm:

| Trường | Mô tả |
|---|---|
| Port | Mã định danh cổng sạc |
| Resource status | Available, Occupied hoặc Unavailable |
| Monitoring context | Thông tin giải thích trạng thái |

Frontend ánh xạ `physicalState` trong mock domain sang trạng thái hiển thị:

| `physicalState` trong mock data | Trạng thái hiển thị |
|---|---|
| `idle` | Available |
| `charging` | Occupied |
| `out_of_service` | Unavailable |

Bảng chỉ cung cấp thông tin giám sát, không thay đổi trạng thái cổng sạc và không thực hiện phân bổ tài nguyên.

Ngoài ra, trang hiển thị Banner `Parking-capacity risk` nếu snapshot của Hub chứa nhãn rủi ro tương ứng.

Banner thể hiện số chỗ đỗ đang được sử dụng và giải thích rằng đây là điều kiện mẫu cần Operator chú ý, không phải yêu cầu can thiệp tự động.

#### Trường hợp Hub Disconnected

Khi Hub bị mất kết nối, trang sử dụng luồng hiển thị riêng.

Trạng thái tài nguyên hiện tại được hiển thị là `Unknown` vì không có dữ liệu cập nhật mới.

Trang hiển thị:

- Trạng thái Disconnected.
- Banner màu đỏ `No updated status received`.
- Bảng Current resource state.
- Bảng Last known sample resources.

Thông tin trạng thái hiện tại:

| Tài nguyên | Trạng thái hiện tại | Current risk |
|---|---|---|
| Vehicles | Unknown | Cannot assess from stale data |
| Parking | Unknown | Cannot assess from stale data |
| Charging | Unknown | Cannot assess from stale data |

Thông tin gần nhất đã ghi nhận được hiển thị riêng để Operator tham khảo.

**Lưu ý:** Dữ liệu Last-known không được xem là trạng thái khả dụng hiện tại của tài nguyên.

Trang cũng giải thích rằng việc ghi nhận sự cố phải thực hiện thông qua quy trình Incident Management hiện có và nằm ngoài phạm vi của màn hình Monitoring.

---

## 4. Các luồng hoạt động (User Flows)

### 4.1. Luồng giám sát mạng lưới

```text
Operator
   |
   v
Truy cập Network Monitoring
   |
   v
Hệ thống lấy thông tin các Mobility Hub
   |
   v
Hiển thị Network Overview
   |
   +-----------------------------+
   |                             |
   v                             v
Xem toàn bộ Hub          Xem các cảnh báo tài nguyên
   |                             |
   |                             v
   |                     Bật bộ lọc At-Risk
   |                             |
   |                             v
   |                     Hiển thị Hub có rủi ro
   |                             |
   +-------------+---------------+
                 |
                 v
          Chọn một Hub
                 |
                 v
       Kiểm tra trạng thái kết nối
                 |
          +------+------+
          |             |
          v             v
        Online     Disconnected
          |             |
          v             v
  Hub Resource       Hub Disconnected
     Details             View
          |             |
          v             v
 Hiển thị trạng thái  Hiển thị trạng thái
 tài nguyên hiện tại  hiện tại Unknown
          |             |
          |             v
          |       Hiển thị dữ liệu
          |       Last-known
          |             |
          +------+------+
                 |
                 v
       Quay lại Network Overview
```

### 4.2. Luồng lọc At-Risk Hubs

1. Operator truy cập Network Overview.
2. Hệ thống hiển thị danh sách tất cả Hub.
3. Operator chọn `Overload/Resource Shortage Alerts`.
4. Frontend lọc các Hub có mảng `riskLabels` không rỗng.
5. Trang chỉ hiển thị những Hub phù hợp với bộ lọc.
6. Operator có thể chọn một Hub để xem thông tin chi tiết.
7. Operator chọn `Clear Filter` để khôi phục danh sách đầy đủ.

### 4.3. Luồng xem chi tiết Hub Online

1. Operator chọn một Hub đang Online.
2. Hệ thống lấy Monitoring snapshot tương ứng.
3. Trang hiển thị thông tin Vehicles, Parking và Charging.
4. Nếu có bản ghi charging-port, trang hiển thị bảng chi tiết cổng sạc.
5. Nếu snapshot chứa `Parking-capacity risk`, trang hiển thị Banner cảnh báo tương ứng.
6. Operator có thể quay lại Network Overview.

### 4.4. Luồng xem Hub Disconnected

1. Operator chọn một Hub đang Disconnected.
2. Hệ thống xác định Hub không còn kết nối.
3. Thông tin tài nguyên hiện tại được hiển thị là Unknown.
4. Trang hiển thị Banner `No updated status received`.
5. Hệ thống tìm Last-known snapshot nếu có.
6. Các giá trị Last-known được hiển thị riêng biệt với thông tin hiện tại.
7. Operator có thể quay lại Network Overview.

---

## 5. Cấu trúc Mock Data

### 5.1. Nguồn dữ liệu

Các trang Monitoring hiện sử dụng:

```ts
import { createMockSeed } from '../../../data/mock/seed';
```

Hàm `createMockSeed()` cung cấp mock database cho Frontend.

Network Overview sử dụng `useMemo` để khởi tạo mock database một lần trong vòng đời của trang.

Hub Resource Details lấy mock database và sử dụng `hubId` để tìm các bản ghi tương ứng.

Monitoring sử dụng các nhóm dữ liệu sau:

```text
MockDatabase
├── hubs
├── monitoring
│   ├── currentSnapshots
│   └── lastKnownSnapshots
└── chargingPorts
```

Các định nghĩa kiểu dữ liệu tương ứng được quản lý trong `src/types/domain.ts`.

### 5.2. Thông tin Hub

Collection `hubs` cung cấp thông tin cơ bản của từng Hub.

Monitoring sử dụng:

| Field | Mục đích |
|---|---|
| `id` | Định danh Hub |
| `name` | Hiển thị tên Hub |
| `connectionStatus` | Xác định Hub đang Online hay Disconnected |

Các trạng thái kết nối liên quan:

```ts
'online'
'disconnected'
```

`Hub ID` được sử dụng để liên kết Hub với Monitoring snapshot và các bản ghi charging-port tương ứng.

### 5.3. Monitoring Snapshots

Monitoring sử dụng hai collection snapshot:

- `currentSnapshots`
- `lastKnownSnapshots`

Cả hai đều cung cấp thông tin tài nguyên gắn với một Hub.

Frontend truy cập các nhóm dữ liệu sau:

```text
MonitoringHubSnapshot
├── hubId
├── vehicle
│   ├── available
│   ├── inUse
│   ├── unavailable
│   └── total
├── parking
│   ├── occupied
│   ├── available
│   ├── unavailable
│   └── total
├── charging
│   ├── available
│   ├── occupied
│   ├── unavailable
│   └── total
└── risks
```

Các giá trị `inUse` và `occupied` có thể không được cung cấp; Frontend hiện sử dụng giá trị mặc định bằng 0 khi không có dữ liệu.

Mảng `risks` chứa các nhãn rủi ro được định nghĩa sẵn trong snapshot.

Các nhãn hiện đang được sử dụng:

```text
Vehicle shortage
Parking-capacity risk
```

Frontend sử dụng các nhãn này để:

- Hiển thị Banner cảnh báo.
- Xác định Hub có thuộc danh sách At-Risk hay không.

Frontend không tự tính toán các nhãn rủi ro này.

### 5.4. Current Snapshots

`currentSnapshots` đại diện cho thông tin tài nguyên mẫu mới nhất hiện có của các Hub Online.

Frontend sử dụng dữ liệu này để:

- Hiển thị số liệu tài nguyên trong Network Overview.
- Tạo các cảnh báo tài nguyên minh họa.
- Hiển thị thông tin tài nguyên chi tiết.
- Xác định có cần hiển thị Banner Parking-capacity risk hay không.

Nếu không tìm thấy current snapshot, Frontend không xem số lượng tài nguyên là 0.

Thay vào đó, thông tin tài nguyên hiện tại được hiển thị là Unknown.

### 5.5. Last-Known Snapshots

`lastKnownSnapshots` cung cấp thông tin tài nguyên mẫu đã được ghi nhận trước đó.

Dữ liệu này được sử dụng khi Hub bị Disconnected và không có current snapshot.

Frontend hiển thị các giá trị này với nhãn `Last known` hoặc `not current`.

Dữ liệu Last-known phải được phân biệt với dữ liệu hiện tại để tránh hiển thị nhầm thông tin cũ thành trạng thái khả dụng mới nhất.

### 5.6. Charging Ports

Collection `chargingPorts` cung cấp thông tin từng cổng sạc.

Monitoring sử dụng các trường:

| Field | Mục đích |
|---|---|
| `id` | Định danh bản ghi cổng sạc |
| `hubId` | Liên kết cổng sạc với Hub |
| `code` | Hiển thị mã cổng sạc |
| `physicalState` | Xác định trạng thái hiển thị của cổng sạc |

Frontend lọc các bản ghi charging-port theo `hubId` của Hub đang được chọn.

Các trạng thái được ánh xạ trong Monitoring:

```text
idle           -> Available
charging       -> Occupied
out_of_service -> Unavailable
```

Bảng Charging Resource Detail chỉ cung cấp thông tin. Không thay đổi trạng thái cổng sạc và không thực hiện phân bổ tài nguyên.

---

## 6. Các kịch bản Mock Data minh họa

Seed data hiện tại mô phỏng ba Hub.

Các giá trị dưới đây mô tả những kịch bản mà giao diện Monitoring cần thể hiện.

### HUB-A – Campus Mobility Hub A

**Connection:** Online

| Tài nguyên | Available | In use / Occupied | Unavailable | Total |
|---|---:|---:|---:|---:|
| Vehicles | 3 | 5 | 2 | 10 |
| Parking | 0 | 18 | 0 | 20 |
| Charging | 2 | 0 | 2 | 4 |

Rủi ro minh họa:

```text
Parking-capacity risk
```

Hành vi mong đợi trên Frontend:

- Hiển thị HUB-A đang Online.
- Hiển thị số liệu tài nguyên hiện tại.
- Hiển thị Banner Parking-capacity risk.
- Đưa HUB-A vào danh sách At-Risk.

### HUB-B – Campus Mobility Hub B

**Connection:** Online

| Tài nguyên | Available | In use / Occupied | Unavailable | Total |
|---|---:|---:|---:|---:|
| Vehicles | 0 | 6 | 2 | 8 |
| Parking | 10 | 10 | 0 | 20 |
| Charging | 0 | 3 | 1 | 4 |

Rủi ro minh họa:

```text
Vehicle shortage
```

Hành vi mong đợi trên Frontend:

- Hiển thị HUB-B đang Online.
- Hiển thị số liệu tài nguyên hiện tại.
- Hiển thị cảnh báo Vehicle shortage.
- Đưa HUB-B vào danh sách At-Risk.

### HUB-C – Campus Mobility Hub C

**Connection:** Disconnected

Trạng thái tài nguyên hiện tại:

| Tài nguyên | Trạng thái hiện tại |
|---|---|
| Vehicles | Unknown |
| Parking | Unknown |
| Charging | Unknown |

Các giá trị Last-known:

| Tài nguyên | Available | In use / Occupied | Unavailable | Total |
|---|---:|---:|---:|---:|
| Vehicles | 4 | 3 | 1 | 8 |
| Parking | 8 | 8 | 0 | 16 |
| Charging | 1 | 0 | 1 | 2 |

Hành vi mong đợi trên Frontend:

- Hiển thị HUB-C đang Disconnected.
- Hiển thị trạng thái tài nguyên hiện tại là Unknown.
- Hiển thị Banner `No updated status received`.
- Hiển thị các giá trị Last-known riêng biệt.
- Không đưa HUB-C vào bộ lọc At-Risk chỉ vì Hub bị mất kết nối.

**Lưu ý:** Đây là dữ liệu mẫu để minh họa giao diện Monitoring, không phải dữ liệu vận hành thực tế.

---

## 7. Định hướng tích hợp Backend

Frontend hiện đang sử dụng mock data. Phần này mô tả những thông tin và hành vi mà Backend cần cung cấp hoặc duy trì để có thể tích hợp trong tương lai.

### 7.1. Trách nhiệm dữ liệu đề xuất

| Nhóm dữ liệu | Trách nhiệm Backend |
|---|---|
| Hub information | Cung cấp Hub ID, tên Hub và trạng thái kết nối |
| Current Monitoring snapshot | Cung cấp trạng thái tài nguyên mới nhất hiện có |
| Last-known snapshot | Cung cấp trạng thái tài nguyên gần nhất đã ghi nhận khi không có dữ liệu hiện tại |
| Charging ports | Cung cấp trạng thái từng cổng sạc và Hub tương ứng |
| Risk information | Cung cấp nhãn rủi ro hoặc thông tin cần thiết để đánh giá rủi ro |

Backend nên sử dụng Hub ID ổn định để liên kết các bản ghi tài nguyên với đúng Hub.

### 7.2. Phân biệt Current và Last-known Data

Backend cần phân biệt rõ dữ liệu hiện tại và dữ liệu cũ.

Khi Hub bị mất kết nối, Backend không nên trả dữ liệu cũ dưới dạng dữ liệu hiện tại.

Response cần cho phép Frontend phân biệt:

- Có dữ liệu trạng thái hiện tại.
- Không có dữ liệu trạng thái hiện tại.
- Có dữ liệu Last-known.
- Không có dữ liệu Last-known.

Last-known snapshot chỉ nên được hiển thị dưới dạng dữ liệu tham khảo/lịch sử, không phải trạng thái khả dụng hiện tại.

### 7.3. Risk Labels

Frontend hiện đang sử dụng các nhãn rủi ro:

```text
Vehicle shortage
Parking-capacity risk
```

Mock implementation hiện tại chưa định nghĩa ngưỡng nghiệp vụ hoặc thuật toán phát hiện rủi ro thực tế.

Trước khi triển khai Backend, nhóm cần thống nhất:

- Điều kiện nào được xem là thiếu hụt phương tiện.
- Điều kiện nào được xem là quá tải chỗ đỗ xe.
- Việc đánh giá rủi ro do Backend hay một dịch vụ Monitoring khác thực hiện.
- Cách cập nhật và xóa trạng thái rủi ro.
- Cách Frontend nhận thông tin rủi ro.

Không nên xem các nhãn rủi ro hiện tại trong mock data là quy tắc nghiệp vụ đã được chốt.

### 7.4. Read-only Behavior

UC07 là chức năng giám sát.

Backend integration của UC07 cần cung cấp thông tin tài nguyên theo hướng chỉ đọc.

Các trang Monitoring không thực hiện:

- Phân bổ phương tiện.
- Đặt chỗ đỗ xe.
- Phân bổ cổng sạc.
- Điều khiển phiên sạc.
- Tạo hoặc quản lý Incident.

Việc ghi nhận sự cố thuộc quy trình Incident Management hiện có, nằm ngoài phạm vi màn hình Monitoring.

### 7.5. Ví dụ cấu trúc dữ liệu đề xuất cho API

Đây là cấu trúc minh họa để Frontend và Backend thảo luận, **không phải API contract đã được triển khai hoặc thống nhất**.

Ví dụ Hub Online:

```json
{
  "hubId": "HUB-A",
  "connectionStatus": "online",
  "currentSnapshot": {
    "vehicle": {
      "available": 3,
      "inUse": 5,
      "unavailable": 2,
      "total": 10
    },
    "parking": {
      "occupied": 18,
      "available": 2,
      "unavailable": 0,
      "total": 20
    },
    "charging": {
      "available": 2,
      "occupied": 0,
      "unavailable": 2,
      "total": 4
    },
    "risks": [
      "Parking-capacity risk"
    ]
  },
  "lastKnownSnapshot": null
}
```

Ví dụ Hub Disconnected:

```json
{
  "hubId": "HUB-C",
  "connectionStatus": "disconnected",
  "currentSnapshot": null,
  "lastKnownSnapshot": {
    "vehicle": {
      "available": 4,
      "inUse": 3,
      "unavailable": 1,
      "total": 8
    },
    "parking": {
      "occupied": 8,
      "available": 8,
      "unavailable": 0,
      "total": 16
    },
    "charging": {
      "available": 1,
      "occupied": 0,
      "unavailable": 1,
      "total": 2
    },
    "risks": []
  }
}
```

Các ví dụ trên mô tả thông tin cần thiết cho Frontend. Tính bắt buộc của từng trường, timestamp, thời điểm cập nhật cuối cùng, cấu trúc lỗi và API contract chính thức cần được Frontend và Backend thống nhất trước khi tích hợp.

---

## 8. Các giới hạn hiện tại

UC07 hiện có những giới hạn sau:

1. Toàn bộ thông tin tài nguyên được lấy từ mock seed data.
2. Chưa kết nối Backend API hoặc đồng bộ dữ liệu thời gian thực.
3. Trạng thái Hub Disconnected được định nghĩa sẵn trong mock data, không phải kết quả phát hiện mất kết nối thực tế.
4. Các nhãn rủi ro được định nghĩa sẵn trong snapshot.
5. Chưa triển khai ngưỡng hoặc thuật toán tính toán rủi ro tự động.
6. Last-known snapshot là dữ liệu mẫu để tham khảo.
7. Monitoring chỉ đọc và không thay đổi trạng thái phân bổ tài nguyên hoặc hoạt động vận hành.
8. Frontend không tạo Incident và không thực hiện quản lý Incident.

Đây là những giới hạn có chủ đích trong giai đoạn triển khai Frontend Prototype.

---

## 9. Tổng kết

UC07 – Network Monitoring gồm hai giao diện chính:

- **Network Overview:** Hiển thị trạng thái kết nối và tài nguyên trên toàn mạng lưới Hub, các Banner cảnh báo và chức năng lọc At-Risk.
- **Hub Resource Details:** Hiển thị thông tin tài nguyên chi tiết của Hub Online hoặc trạng thái hiện tại Unknown cùng dữ liệu Last-known đối với Hub Disconnected.

Feature sử dụng các Shared UI Component, Banner có khả năng tái sử dụng và cấu trúc mock data thống nhất.

Cấu trúc dữ liệu hiện tại giúp Backend hiểu được những thông tin mà Frontend cần trong quá trình tích hợp sau này, đồng thời phân biệt rõ dữ liệu hiện tại, dữ liệu tham khảo cũ và các nhãn rủi ro minh họa.