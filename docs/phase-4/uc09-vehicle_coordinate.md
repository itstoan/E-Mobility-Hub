# UC09 – Vehicle Coordination Between Mobility Hubs

## 1. Mục tiêu và phạm vi

UC09 cho phép **System Operator** xem các Hub có nguy cơ thiếu/dư phương tiện, xem phương án điều phối được đề xuất, kiểm tra điều kiện và ghi nhận quyết định **Approve** hoặc **Reject**.

UC09 chỉ ghi nhận quyết định đối với phương án. Việc di chuyển phương tiện thực tế do đơn vị vận hành thực hiện bên ngoài hệ thống; Approve không tự thay đổi vị trí xe, số lượng xe, chỗ đỗ hoặc cổng sạc.

- Route Overview: `/operator/coordination`
- Route Review: `/operator/coordination/:planId`
- Feature: `src/features/vehicle-coordination/`
- Role: `system_operator`

## 2. Tổng quan các màn hình

| Màn hình | Nội dung / hành vi |
|---|---|
| **Coordination Overview** | Hiển thị cảnh báo thiếu xe và rủi ro sức chứa; bảng Hub Availability; danh sách Proposed Coordination Plan; mở màn hình review. |
| **Review Coordination Proposal** | Hiển thị Hub nguồn/đích, số xe, trạng thái proposal, kết quả kiểm tra điều kiện và Expected Impact; operator chọn Approve hoặc Reject. |
| **Proposal No Longer Suitable** | Proposal không còn phù hợp vì snapshot mới cho thấy Hub đích không còn đủ chỗ. Không cho Approve proposal cũ; quay lại Overview để xem phương án khác. |
| **Transfer Conditions Not Met** | Điều kiện không đạt vì Hub nguồn không đủ xe cho số lượng yêu cầu. Giữ nguyên resource state; cho phép chọn proposal khác hoặc hủy review. |
| **Proposal Approved** | Ghi nhận quyết định Approved và người duyệt; hiển thị resource state vẫn giữ nguyên; không xác nhận xe đã được di chuyển. |
| **Proposal Rejected** | Ghi nhận quyết định Rejected; hiển thị availability ban đầu được bảo toàn; không có di chuyển hoặc cập nhật tài nguyên. |

Mockup **Collapsed Sidebar** là trạng thái thu gọn của `MainLayout` dùng chung, không phải một trang UC09 riêng.

## 3. Luồng nghiệp vụ

1. Operator mở **Coordinate Vehicles Between Hubs**.
2. Hệ thống lấy trạng thái kết nối và snapshot hiện tại của các Hub, các chỉ số xe/bãi đỗ/cổng sạc, cảnh báo thiếu/dư tài nguyên và danh sách proposal.
3. Operator chọn một proposal để xem xét.
4. Hệ thống kiểm tra lại:
   - Hub nguồn và Hub đích có kết nối/đang hoạt động hay không.
   - Số xe khả dụng tại Hub nguồn có đủ `vehicleCount` hay không.
   - Hub đích có đủ chỗ tiếp nhận số xe được đề xuất hay không.
   - Thông tin xe minh họa như battery level và charging capability để operator tham khảo.
5. Nếu điều kiện không đạt hoặc trạng thái Hub đã thay đổi, hệ thống thông báo proposal không còn phù hợp/điều kiện không đạt, cập nhật phương án thay thế nếu có; operator có thể chọn proposal khác hoặc hủy review.
6. Nếu điều kiện đạt, hệ thống hiển thị proposal detail và **Expected Impact – Only If Carried Out**.
7. Operator chọn một trong hai quyết định:
   - **Approve:** ghi nhận proposal ở trạng thái `approved`, kèm người duyệt và thời điểm duyệt.
   - **Reject:** ghi nhận proposal ở trạng thái `rejected`, kèm người duyệt và thời điểm duyệt.
8. Hệ thống hiển thị màn hình kết quả. Cả hai quyết định đều không tự thực hiện việc chuyển xe và không cập nhật resource counts.

### Quy tắc kiểm tra

- Chỉ dùng `monitoring.currentSnapshots` để đánh giá trạng thái hiện tại.
- Hub mất kết nối (ví dụ HUB-C) phải hiển thị `Current: unknown`; không dùng `lastKnownSnapshots` thay cho dữ liệu hiện tại để duyệt proposal.
- Không giả định một ngưỡng xe dư tối thiểu nếu nghiệp vụ chưa định nghĩa. Với mẫu hiện tại, điều kiện số xe là `source.available >= proposal.vehicleCount`.
- Điều kiện sức chứa đích là `destination.parking.available >= proposal.vehicleCount`.
- Battery level và số cổng sạc là thông tin tham khảo trong mockup; tài liệu UC không quy định ngưỡng battery bắt buộc hoặc yêu cầu tạo charging allocation.
- Trước khi lưu quyết định, Backend phải kiểm tra lại điều kiện trên dữ liệu mới nhất, không tin kết quả kiểm tra từ Frontend.

## 4. Domain và Mock Data

UC09 tái sử dụng kiểu dữ liệu trong `src/types/domain.ts`; không cần tạo domain type hoặc bộ mock data riêng.

| Domain | Vai trò trong UC09 |
|---|---|
| `MobilityHub` | Hub nguồn/đích và `connectionStatus`. |
| `Vehicle` | Xe thực tế, `currentHubId`, `status`, `batteryPercent`. |
| `VehicleTransferProposal` | Proposal: `id`, `sourceHubId`, `destinationHubId`, `vehicleCount`, `status`, `createdAt`, `reviewedByUserId`, `reviewedAt`. |
| `MonitoringData` / `MonitoringHubSnapshot` | Snapshot hiện tại của xe, chỗ đỗ, cổng sạc và các risk labels dùng chung với UC07. |

Dữ liệu UC09 được bổ sung trong `src/data/mock/seed.ts` hiện tại:

- Proposal chính: `TP-2026-001`, chuyển **2 xe** từ `HUB-A` sang `HUB-B`, trạng thái `proposed`.
- Xe minh họa: `EV-A-01` (72%) và `EV-A-02` (68%) nằm tại HUB-A và đang `available`.
- Snapshot HUB-A: 3 xe available; parking 18/20 occupied (2 chỗ trống); 2 charging ports available.
- Snapshot HUB-B: 0 xe available; parking 10/20 occupied (10 chỗ trống); 0 charging ports available.
- HUB-C disconnected: chỉ có last-known snapshot, vì vậy không được xem là trạng thái hiện tại hoặc dùng làm nguồn/đích cho proposal.
- Các proposal mẫu đã xử lý (`TP-02`, `TP-03`) được giữ trong seed để đại diện trạng thái `rejected`/`approved`; Overview tập trung hiển thị proposal `TP-2026-001` đang chờ review.

Các số liệu `monitoring` là snapshot tổng hợp phục vụ dashboard, không phải danh sách từng `ParkingSpace`. Bảng Expected Impact là dự báo minh họa theo mockup, không phải thao tác cập nhật resource thực tế.

## 5. Frontend hiện tại

Các file UC09:

- `src/features/vehicle-coordination/pages/CoordinateVehiclesPage.tsx` – Overview và hai màn hình alternative preview.
- `src/features/vehicle-coordination/pages/ReviewCoordinationProposalPage.tsx` – Review, Expected Impact, Approved và Rejected.
- `src/data/mock/seed.ts` – bổ sung proposal và xe mẫu trên dữ liệu chung.
- `src/routes/AppRouter.tsx` – kết nối hai route UC09 trong nhóm route được bảo vệ cho `system_operator`.

Frontend dùng lại `Card`, `Table`, `Banner`, `Button`, `StatusBadge`, `MainLayout`, `ROUTES` và `createMockSeed()`.

Các alternative preview được mở từ Overview bằng query `scenario=no-longer-suitable` hoặc `scenario=conditions-not-met`. Màn hình kết quả decision hiện dùng query `decision=approved|rejected` để preview trạng thái. Đây là mô phỏng UI: query parameter **không phải** nơi lưu trạng thái nghiệp vụ và không thay thế việc cập nhật proposal trên Backend.

## 6. Tích hợp Backend

Các endpoint dưới đây là **API contract đề xuất**, không khẳng định Backend hiện đã triển khai.

### 6.1. Lấy Overview

`GET /api/operator/coordination/overview`

Backend trả về:

- Danh sách Hub và `connectionStatus`.
- Current monitoring snapshots: số xe available/in-use/unavailable, parking available/occupied/total, charging available/occupied/unavailable.
- Risk labels như `Vehicle shortage` và `Parking-capacity risk`.
- Các proposal đang `proposed` để hiển thị trong Proposed Coordination Plan.

Frontend thay `createMockSeed()` bằng response từ API; các chỉ số monitoring vẫn lấy từ nguồn dữ liệu UC07 dùng chung, không tạo một nguồn snapshot riêng cho UC09.

### 6.2. Lấy chi tiết và kiểm tra proposal

`GET /api/operator/coordination/proposals/{proposalId}`

Backend trả về proposal, Hub nguồn/đích, current snapshot, danh sách xe candidate và kết quả kiểm tra điều kiện. Có thể trả thêm `snapshotVersion`/`checkedAt` để Frontend biết phiên bản dữ liệu đã dùng khi tính Expected Impact.

Candidate vehicles nên được trả về trực tiếp từ Backend (ID, label, battery, status). Không nên phụ thuộc quy tắc lọc ID như tiền tố `EV-A-` đang dùng để minh họa trong mock data.

### 6.3. Ghi nhận Approve / Reject

`POST /api/operator/coordination/proposals/{proposalId}/decision`

Request body đề xuất:

```json
{
  "decision": "approved",
  "snapshotVersion": "version-returned-by-overview-or-detail"
}
```

`decision` nhận `approved` hoặc `rejected`. Backend lấy danh tính operator từ session/token; không tin `reviewedByUserId` do client tự gửi.

Nếu thành công, trả về proposal đã cập nhật:

```json
{
  "id": "TP-2026-001",
  "status": "approved",
  "reviewedByUserId": "OP-01",
  "reviewedAt": "2026-10-30T09:15:00+07:00"
}
```

Ví dụ response trên chỉ minh họa cấu trúc; thời gian và operator thực tế do Backend tạo.

### 6.4. Backend validation và concurrency

Khi nhận decision, Backend nên xử lý trong một transaction:

1. Đọc và khóa proposal; chỉ cho quyết định khi trạng thái hiện tại còn `proposed`.
2. Đọc lại trạng thái kết nối của hai Hub và snapshot tài nguyên mới nhất.
3. Kiểm tra số xe nguồn, sức chứa bãi đỗ Hub đích và điều kiện hoạt động của hai Hub.
4. So sánh `snapshotVersion` (nếu sử dụng) để phát hiện dữ liệu đã thay đổi trong lúc operator review.
5. Nếu đạt điều kiện, cập nhật `status`, `reviewedByUserId`, `reviewedAt`; nếu không đạt, từ chối ghi decision và trả thông tin mới nhất.
6. Commit và trả kết quả cho Frontend.

Các lỗi nên được phân biệt bằng HTTP `409 Conflict`, ví dụ `PROPOSAL_ALREADY_REVIEWED`, `PROPOSAL_OUTDATED`, `SOURCE_VEHICLE_SHORTAGE`, `DESTINATION_CAPACITY_CHANGED`, `HUB_DISCONNECTED`. Frontend dùng mã lỗi để hiển thị đúng nhánh alternative và tải lại Overview/proposal.

**Không cập nhật** `Vehicle.currentHubId`, số xe trong monitoring snapshot, parking occupancy hay charging-port state khi Approve/Reject. UC09 không thực hiện lệnh vận chuyển vật lý.

## 7. Checklist kiểm thử

- Overview hiển thị đúng hai risk banners, Hub Availability, proposal `TP-2026-001` và trạng thái HUB-C `Current: unknown`.
- Review hiển thị A: 3 xe available, B: 0 xe available, B: 10 chỗ trống; battery candidate 72%/68%; charging ports A: 2, B: 0.
- Expected Impact hiển thị như dự kiến: A 3 → 1 xe available, parking 18/20 → 16/20; B 0 → 2 xe available, parking 10/20 → 12/20. Đây chỉ là kết quả giả định nếu được thực hiện.
- Proposal No Longer Suitable hiển thị later snapshot của Hub B còn 1 chỗ trống (19/20 occupied).
- Transfer Conditions Not Met hiển thị Hub A chỉ còn 1 xe available cho proposal cần 2 xe.
- Approved và Rejected hiển thị đúng quyết định; resource state vẫn giữ nguyên.
- Người không có role `system_operator` không được truy cập các route UC09.
- Backend phải kiểm tra lại điều kiện tại thời điểm lưu decision và ngăn duyệt trùng.

## 8. Kết luận và điểm cần lưu ý

Sau khi đối chiếu với sáu mockup UC09 và sequence/activity diagram trong `submission2.docx`, cấu trúc màn hình và các nhánh nghiệp vụ chính đã được thể hiện. Hai chi tiết giao diện đã được hiệu chỉnh để sát mockup hơn: kích thước heading và thông tin charging-port availability của cả Hub A/Hub B.

Các giới hạn còn lại thuộc phạm vi mock frontend: alternative scenarios là preview dữ liệu thay thế; decision hiện được biểu diễn bằng query string và chưa lưu bền vào MockDatabase. Khi tích hợp, cần thay bằng API ở mục 6 và để Backend chịu trách nhiệm lưu decision, kiểm tra snapshot mới nhất và chống quyết định trùng.
