# UC11 – Operational Simulation

## 1. Mục tiêu và phạm vi

UC11 cho phép **System Operator** thiết lập kịch bản giả định, đánh giá tác động lên phương tiện, vị trí đỗ và cổng sạc, sau đó xem các khuyến nghị vận hành.

Đây là chức năng *what-if simulation*. Kết quả chỉ phục vụ phân tích và xem xét; UC11 **không trực tiếp** di chuyển phương tiện, thay đổi đặt chỗ, điều chỉnh lịch sạc hoặc cập nhật trạng thái tài nguyên đang vận hành.

- **Route:** `/operator/simulation`
- **Role:** `system_operator`
- **Layout:** dùng `MainLayout` và Sidebar hiện có qua cấu hình route; page không tạo layout riêng.
- **Feature:** `src/features/simulation/pages/OperationalSimulationPage.tsx`

## 2. Tổng quan màn hình

| Màn hình | Nội dung và hành vi |
|---|---|
| **Simulation Overview** | Giới thiệu mô phỏng vận hành; cho phép mở cấu hình hoặc xem hai ví dụ thay thế. |
| **Configure Simulation** | Chọn Test Hub, nhập Demand change, Unavailable-resource proportion và Battery level; hiển thị lưu ý đây là giả định mô phỏng. |
| **Simulation Results** | Hiển thị assumptions, Simulation-only Reference Snapshot, kết quả minh họa và đánh giá tác động. |
| **Simulation Recommendations** | Hiển thị phương án Vehicle Transfer và Alternative Hub để operator xem xét; không có hành động Apply/Approve/Execute. |
| **No Resource Imbalance** | Kịch bản minh họa riêng cho thấy mạng lưới đáp ứng nhu cầu giả định và không phát sinh khuyến nghị điều phối. |
| **Invalid Simulation Parameters** | Chặn chạy mô phỏng khi tỷ lệ tài nguyên không khả dụng hoặc mức pin nằm ngoài miền hợp lệ; yêu cầu sửa trường lỗi. |

Các màn hình dùng chung route và query parameter:

| URL | Màn hình |
|---|---|
| `/operator/simulation` hoặc `?view=overview` | Overview |
| `?view=configure` | Configure Simulation |
| `?view=results` | Simulation Results |
| `?view=recommendations` | Simulation Recommendations |
| `?view=no-imbalance` | No Resource Imbalance |
| `?view=invalid` | Invalid Simulation Parameters |

## 3. Flow nghiệp vụ theo Sequence Diagram và Activity Diagram

1. Operator truy cập chức năng **Mô phỏng vận hành** (`S007`).
2. System hiển thị giao diện cấu hình với các tham số mặc định (`NFR-M02`).
3. Operator chọn/chỉnh Test Hub, mức thay đổi nhu cầu, tỷ lệ tài nguyên không khả dụng và mức pin, sau đó nhấn **Run Simulation**.
4. System kiểm tra tính hợp lệ của tham số (`NFR-R01`).
5. **Nếu tham số không hợp lệ (Alternative A2):** chặn thực thi, hiển thị lỗi và yêu cầu operator kiểm tra/nhập lại. Không tạo kết quả hoặc khuyến nghị.
6. **Nếu tham số hợp lệ:** lấy trạng thái tài nguyên mạng lưới gồm Hub, phương tiện, vị trí đỗ và cổng sạc; sau đó thực hiện tính toán mô phỏng theo tham số và đánh giá tác động (`NFR-P03`).
7. **Nếu phát sinh mất cân đối tài nguyên:** hiển thị các Hub có nguy cơ thiếu xe/quá tải bãi đỗ (`SON08`) và tạo khuyến nghị như điều phối phương tiện, điều chỉnh lịch sạc hoặc hướng người dùng đến Hub thay thế (`SON09`). Operator xem kết quả và khuyến nghị.
8. **Nếu không phát sinh mất cân đối (Alternative A1):** hiển thị kết quả rằng mạng lưới vẫn đáp ứng nhu cầu giả định; không tạo khuyến nghị điều phối.
9. Operator xem kết quả và tự đưa ra quyết định vận hành bên ngoài UC11.

**NFR trong sơ đồ:** `NFR-M02` là tham số mặc định; `NFR-R01` là kiểm tra tính hợp lệ; `NFR-P03` là thời gian xử lý mô phỏng. Submission không đưa ra con số cụ thể cho NFR-P03, vì vậy cần đối chiếu đặc tả NFR đầy đủ trước khi Backend đặt SLO.

**Nguyên tắc ranh giới Use Case:** khuyến nghị điều phối thực tế phải đi qua UC09; thay đổi lịch sạc thực tế phải đi qua UC08. UC11 không thực thi thay các Use Case đó.

## 4. Tham số và dữ liệu minh họa

### 4.1. Tham số cấu hình

| Trường | Ý nghĩa | Giá trị mẫu |
|---|---|---:|
| Test Hub | Hub được chọn để thử nghiệm kịch bản | Campus Mobility Hub B (`HUB-B`) |
| Demand change | Mức thay đổi nhu cầu so với reference snapshot | `+20%` |
| Unavailable-resource proportion | Tỷ lệ tài nguyên giả định không khả dụng | `20%` |
| Battery level | Mức pin giả định | `60%` |

Frontend hiện kiểm tra `Unavailable-resource proportion` và `Battery level` trong miền 0–100%. Đây là miền phần trăm, **không phải ngưỡng rủi ro vận hành**. Submission không quy định miền min/max cụ thể cho Demand change; không tự đặt ngưỡng nghiệp vụ khi chưa được thống nhất.

Danh sách Test Hub lấy từ `database.hubs` và chỉ hiển thị Hub có `connectionStatus === "online"`. Với seed hiện tại, HUB-C đang disconnected nên không được chọn.

### 4.2. Kịch bản mất cân đối – `SIM-2026-001`

| Hub | Reference vehicles | Simulated vehicles | Parking reference → simulated | Charging reference → simulated |
|---|---:|---:|---:|---:|
| HUB-A | 8 available | 3 available | 12/20 → 19/20 | 2/4 → 2/4 available |
| HUB-B | 6 available | 1 available | 10/20 → 14/20 | 1/4 → 1/4 available |

Các nhãn rủi ro minh họa:
- HUB-A: `Parking-capacity risk`.
- HUB-B: `Vehicle-shortage risk`.

Khuyến nghị hiển thị:
- **Vehicle Transfer – Review Option:** xem xét điều phối phương tiện từ Hub A sang Hub B. Việc thực hiện thật cần được đánh giá/duyệt theo UC09.
- **Alternative Hub – Review Option:** xem xét Hub B làm lựa chọn thay thế cho nhu cầu có thể làm Hub A đạt 19/20 chỗ đỗ bị chiếm.
- Không đưa ra khuyến nghị điều chỉnh sạc trong ví dụ hiện tại vì dữ liệu minh họa không thể hiện nhu cầu đó.

Risk label và kết quả này là fixture phục vụ UI; không phải kết quả của thuật toán dự báo đang chạy.

### 4.3. Kịch bản không mất cân đối – `SIM-2026-002`

Input riêng: Test Hub `HUB-B`, Demand change `0%`, Unavailable-resource proportion `0%`, Battery level `80%`.

| Hub | Reference vehicles | Simulated vehicles | Parking | Charging |
|---|---:|---:|---:|---:|
| HUB-A | 8 | 8 | 12/20 → 12/20 | 2/4 → 2/4 |
| HUB-B | 6 | 6 | 10/20 → 10/20 | 1/4 → 1/4 |

Kết quả: mạng lưới đáp ứng nhu cầu giả định, không tạo khuyến nghị điều phối.

### 4.4. Kịch bản tham số không hợp lệ

Trang preview tạo input không hợp lệ bằng cách đặt `unavailableResourcePercent = 120`. System chặn chạy, đánh dấu trường lỗi và yêu cầu sửa. Không tạo kết quả/khuyến nghị và không thay đổi operational data.

## 5. Domain và Mock Data – phiên bản mới nhất

**Không tạo file `simulationScenarios.ts`.** UC11 dùng chung kiến trúc `MockDatabase` như UC07: khai báo domain type tại `src/types/domain.ts`, khởi tạo dữ liệu trong `src/data/mock/seed.ts`, sau đó page đọc dữ liệu từ `createMockSeed()`.

### 5.1. Tái sử dụng dữ liệu hiện có

| Dữ liệu trong `MockDatabase` | Cách UC11 sử dụng |
|---|---|
| `hubs` | Tái sử dụng `id`, `name`, `connectionStatus` để hiển thị tên Hub và lọc Test Hub online. |
| `monitoring.currentSnapshots` | Không dùng làm reference/result của UC11 vì đây là operational snapshot của UC07. |
| `monitoring.lastKnownSnapshots` | Không dùng làm dữ liệu hiện tại cho Hub disconnected. |
| `vehicles` | Không dùng để tính fixture kết quả mô phỏng; đây là bản ghi phương tiện vận hành. |
| `parkingSpaces` | Không dùng để suy ra tổng sức chứa minh họa; seed hiện chỉ có một số bản ghi mẫu, không đại diện toàn bộ capacity. |
| `chargingPorts` | Không dùng trạng thái vật lý trực tiếp để tạo kết quả mô phỏng; trạng thái port vận hành khác với giả định simulation. |

Do đó, UC11 **tái sử dụng Hub identity/status**, nhưng giữ reference snapshot và simulated outcomes độc lập với UC07 và các bản ghi tài nguyên vận hành.

### 5.2. Bổ sung domain vào `domain.ts`

Bổ sung các interface:
- `SimulationInputs`: `testHubId`, `demandChangePercent`, `unavailableResourcePercent`, `batteryLevelPercent`.
- `SimulationHubRow`: reference/simulated vehicle counts, parking occupancy/capacity, charging availability/capacity và risk label.
- `SimulationScenario`: `id`, `title`, `inputs`, `rows`, `outcome`.
- `SimulationData`: `defaultInputs`, `imbalanceScenario`, `noImbalanceScenario`.

Mở rộng `MockDatabase` bằng thuộc tính:

```ts
simulation: SimulationData;
```

Dùng `Id` hiện có cho các trường ID; không khai báo lại Hub hoặc resource domain types.

### 5.3. Đặt dữ liệu trong `seed.ts`

Trong `createMockSeed()`, bổ sung hai scenario vào thuộc tính `simulation`, đặt cạnh `monitoring`. Cấu trúc dự kiến:

```text
MockDatabase
├── hubs                         # dùng chung
├── vehicles                     # operational records
├── parkingSpaces                # operational records
├── chargingPorts                # operational records
├── monitoring                   # UC07 operational snapshots
└── simulation                   # UC11 simulation-only reference fixtures
    ├── defaultInputs
    ├── imbalanceScenario        # SIM-2026-001
    └── noImbalanceScenario      # SIM-2026-002
```

Giá trị `120%` dùng để preview nhánh lỗi được tạo tại page, không cần lưu thành scenario thứ ba trong seed.

### 5.4. Page đọc MockDatabase

`OperationalSimulationPage.tsx` gọi `createMockSeed()` một lần bằng `useMemo`, sau đó đọc:

```ts
const database = useMemo(() => createMockSeed(), []);
const simulation = database.simulation;
const sharedHubs = database.hubs;
```

- `ScenarioInputs` nhận `hubs` qua props; không tự gọi `createMockSeed()` trong component con.
- `AssumptionsCard` nhận `hubNames` để hiển thị tên Hub từ seed, không hardcode HUB-A/HUB-B.
- Các bảng kết quả đọc `simulation.imbalanceScenario` hoặc `simulation.noImbalanceScenario`.
- Không import dữ liệu từ `simulationScenarios.ts`.

### 5.5. Các file liên quan

| File | Trạng thái theo kiến trúc mới |
|---|---|
| `src/types/domain.ts` | **MODIFIED** – thêm Simulation interfaces và `MockDatabase.simulation`. |
| `src/data/mock/seed.ts` | **MODIFIED** – thêm `simulation` fixture vào `createMockSeed()`. |
| `src/features/simulation/pages/OperationalSimulationPage.tsx` | **NEW / UPDATED** – dùng domain types và `database.simulation`; không import file scenario riêng. |
| `src/routes/AppRouter.tsx` | **MODIFIED** – import page và thay `RouteStub` tại `ROUTES.OPERATOR.SIMULATION`. |
| `src/data/mock/simulationScenarios.ts` | **Không sử dụng; xóa nếu đã tạo ở bản trước.** |
| `src/data/mock/mockDataSource.ts` | Không cần sửa cho thay đổi này. |

## 6. Nguyên tắc UI và kiến trúc

- Dùng `MainLayout` và Sidebar hiện có thông qua route lồng bên trong `ProtectedRoute` cho `system_operator`.
- Không import hoặc render `MainLayout` trực tiếp trong `OperationalSimulationPage`.
- Tái sử dụng shared components: `Card`, `Table`, `Banner`, `Button`, `FormField`, `Input`, `Select`, `StatusBadge`.
- Giữ design tokens, màu sắc, typography, spacing và cách hiển thị trạng thái đã thống nhất; không tạo component/layout hoặc màu chủ đạo riêng cho UC11.
- UI dùng tiếng Anh theo mockup.
- Không thêm nút Apply/Approve/Execute cho recommendation.
- Các màn hình phụ được điều hướng bằng query `view`, không tạo route/layout riêng cho từng state.

## 7. Đề xuất tích hợp Backend

Các endpoint dưới đây là **đề xuất contract**, chưa phải API đã tồn tại trong source hiện tại.

| Method | Endpoint đề xuất | Mục đích |
|---|---|---|
| `GET` | `/api/operator/simulations/configuration` | Lấy tham số mặc định, danh sách Hub đủ điều kiện và metadata validation. |
| `POST` | `/api/operator/simulations` | Validate input, lấy reference snapshot nhất quán, chạy mô phỏng và lưu kết quả. |
| `GET` | `/api/operator/simulations/{simulationId}` | Lấy lại input, snapshot tham chiếu, kết quả và recommendations của lần chạy. |

### 7.1. Request mẫu

```json
{
  "testHubId": "HUB-B",
  "demandChangePercent": 20,
  "unavailableResourcePercent": 20,
  "batteryLevelPercent": 60
}
```

### 7.2. Response đề xuất

Backend nên trả về tối thiểu:
- `simulationId`, `createdAt`, `status`;
- `inputs` sau validation;
- `referenceSnapshotId`, `referenceSnapshotAt`;
- `hubOutcomes`: vehicle availability, parking occupied/total, charging-port availability/total;
- `risks` kèm reason/evidence;
- `recommendations` nếu scenario tạo mất cân đối.

### 7.3. Trách nhiệm Backend

1. **Validate input:** kiểm tra Test Hub tồn tại và đủ điều kiện; `unavailableResourcePercent` và `batteryLevelPercent` trong 0–100. Miền hợp lệ của `demandChangePercent` cần được thống nhất vì Submission không nêu min/max cụ thể.
2. **Validate authoritative:** frontend validation chỉ hỗ trợ UX; Backend phải kiểm tra lại toàn bộ input và role `system_operator`.
3. **Capture consistent snapshot:** lấy trạng thái Hub, vehicles, parking và charging ports tại cùng một mốc/version để tránh trộn dữ liệu khác thời điểm.
4. **Disconnected Hub:** không dùng `lastKnownSnapshots` làm trạng thái hiện tại. Backend phải loại Hub khỏi phạm vi tính toán hoặc trả trạng thái không đủ dữ liệu theo policy được thống nhất.
5. **Calculate and assess:** chạy thuật toán mô phỏng theo tham số, xác định mất cân đối và sinh lý do/risk evidence. UI hiện tại không định nghĩa công thức, trọng số hoặc threshold; các quy tắc này phải được thống nhất riêng với nghiệp vụ.
6. **Persist traceability:** lưu input, snapshot ID/version/timestamp, model/rule version và kết quả để có thể giải thích và tái hiện lần chạy.
7. **Read-only against operations:** UC11 chỉ lưu simulation run/result. Không cập nhật `Vehicle.currentHubId`, `ParkingSpace.occupancy`, `ChargingPort.physicalState`, reservations, trips hoặc charging allocations.

### 7.4. Validation và lỗi API

| Tình huống | Phản hồi đề xuất |
|---|---|
| Input sai kiểu/ngoài miền hợp lệ | `422 Unprocessable Entity` kèm lỗi theo field. |
| Test Hub không tồn tại hoặc không còn online | `409 Conflict` hoặc lỗi domain tương ứng; yêu cầu tải lại cấu hình. |
| Snapshot không đủ mới/không thể lấy nhất quán | Trả lỗi domain rõ ràng; không giả lập bằng last-known telemetry. |
| Simulation đang chạy lâu | Có thể trả `202 Accepted` cùng `simulationId`, sau đó client gọi GET để polling; chỉ dùng nếu Backend thực sự xử lý bất đồng bộ. |

Không tự đặt SLO cho NFR-P03 khi chưa có con số trong tài liệu yêu cầu.

### 7.5. Phân tách recommendation với hành động thật

- Vehicle transfer recommendation: operator muốn thực hiện thì chuyển sang UC09 để tạo/xem xét transfer proposal.
- Charging recommendation: nếu có trong kết quả, operator chuyển sang UC08 để xem xét điều chỉnh lịch.
- Alternative Hub: chỉ là phương án tham khảo trong UC11; thao tác đặt chỗ/đổi Hub thực tế thuộc flow nghiệp vụ tương ứng.

Không bổ sung endpoint `apply` hoặc `execute recommendation` vào UC11 nếu chưa có Use Case riêng phê duyệt thao tác này.

## 8. Kiểm thử và nghiệm thu

- [ ] Overview mở được Configure và hai alternative examples.
- [ ] Configure hiển thị đủ bốn tham số và giá trị mặc định.
- [ ] Test Hub chỉ liệt kê Hub online; HUB-C disconnected không được chọn.
- [ ] `unavailableResourcePercent` ngoài 0–100 bị chặn và hiển thị lỗi.
- [ ] `batteryLevelPercent` ngoài 0–100 bị chặn và hiển thị lỗi.
- [ ] Khi input hợp lệ, UI hiện `SIM-2026-001` với đúng số liệu Hub A/B.
- [ ] Recommendations hiển thị Vehicle Transfer và Alternative Hub ở chế độ review-only.
- [ ] `SIM-2026-002` hiển thị network đáp ứng nhu cầu, không có coordination recommendation.
- [ ] Không có thao tác Apply/Approve/Execute.
- [ ] UC11 không sửa operational data của UC07/UC08/UC09 hoặc các record xe, bãi đỗ, cổng sạc.
- [ ] Route được bảo vệ bởi `system_operator` và render bên trong `MainLayout`.
- [ ] Chạy `npm run build` và regression test các UC đã tích hợp trước đó.

## 9. Trạng thái triển khai và giới hạn hiện tại

Frontend hiện là **prototype dùng mock data**:
- `Run Simulation` kiểm tra input và chuyển sang màn hình kết quả minh họa.
- Thay đổi tham số không tự tính lại snapshot/kết quả; `SIM-2026-001` và `SIM-2026-002` là fixture dựng sẵn.
- Scenario 120% chỉ dùng để minh họa nhánh validation error.
- Recommendation chỉ để review; không tạo transfer proposal UC09 hay charging schedule UC08.
- API, thuật toán dự báo, risk threshold, lưu lịch sử simulation và SLO chưa được triển khai; cần Backend/nhóm nghiệp vụ thống nhất.

---

**Tóm tắt kiến trúc:** UC11 dùng Hub identity/status từ `MockDatabase.hubs`, nhưng giữ simulation snapshots độc lập trong `MockDatabase.simulation`. Domain khai báo tại `types/domain.ts`, seed tạo dữ liệu tại `data/mock/seed.ts`, page chỉ đọc một MockDatabase instance và không tạo file scenario riêng.
