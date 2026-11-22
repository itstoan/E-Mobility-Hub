# Hướng dẫn cài đặt và chạy tests

## Cài đặt

| Thành phần | Mục đích | Cài đặt |
| --- | --- | --- |
| **Node.js** và **npm** | Chạy Vite, TS và công cụ test (ưu tiên Node 22.12+ phù hợp Vite 8) | Cài Node.js rồi kiểm tra phiên bản |
| **Dependencies của project** | React, Zustand, Vite và những thư viện trong `package.json` | `npm.cmd install` |
| **Vitest** | Unit/store và integration-state test trong `tests/unit/` | Đã có `vitest: 4.1` trong ZIP; nếu thiếu, cài `npm.cmd install -D vitest@^4.1` |
| **Playwright Test** | UI và E2E trong `tests/e2e/` | Đã có `@playwright/test` trong ZIP; nếu thiếu, cài `npm.cmd install -D @playwright/test` |
| **Playwright Chromium** | Trình duyệt dành cho E2E | `npx.cmd playwright install chromium` |
| **Excel/compatible viewer** | Mở workbook và cập nhật manual/blocked/execution results | Không cần cài thêm cho việc chạy test tự động |

Mở **PowerShell** tại thư mục gốc `E-Mobility-Hub` — nơi có `package.json`, `vitest.config.ts`, `playwright.config.ts`, `src/` và `tests/`.

```powershell
node --version
npm.cmd --version
npm.cmd install
npx.cmd playwright install chromium
```

Nếu clone mới và chưa có Vitest/Playwright trong `package.json`, bổ sung qua:

```powershell
npm.cmd install -D vitest@^4.1 @playwright/test
npx.cmd playwright install chromium
```

Không cần cài Python, backend/database, Jest hay JUnit runtime: `JUnit XML` ở đây chỉ là định dạng báo cáo do Vitest và Playwright xuất ra.

## Cấu trúc file

```text
E-Mobility-Hub/
├── package.json
├── vitest.config.ts
├── playwright.config.ts
├── src/                         # App + useMobilityDataStore
├── tests/
│   ├── unit/                    # 26 Vitest cases, có setup/fixtures
│   └── e2e/ui-workflows.spec.ts # 27 Playwright cases
├── docs/test/
│   ├── README.md                # File hướng dẫn test
│   ├── MVP_Test_Cases_Hybrid_68_Updated_Results.xlsx
│   └── evidence/                # Snapshot bằng chứng từ lần chạy thử 
│       ├── playwright-results.xml
│       └── vitest-terminal.txt
├── test-results/                # Sinh ra khi chạy test, thường bỏ khỏi Git
└── playwright-report/          # HTML report của Playwright, thường bỏ khỏi Git
```

## Chạy test

### Vitest — Unit/Store (26 tests)

```powershell
npx.cmd vitest run --config vitest.config.ts
```

Lệnh trên chạy Zustand actions, không mở trình duyệt. Trong `tests/unit/setup.ts`, dữ liệu được reset giữa các test, không cần khởi động `npm run dev`.

```powershell
New-Item -ItemType Directory -Force test-results | Out-Null
npx.cmd vitest run --config vitest.config.ts --reporter=default --reporter=junit --outputFile.junit=./test-results/vitest-results.xml
Test-Path .\test-results\vitest-results.xml
```

### Playwright — UI/E2E (27 tests)

```powershell
npx.cmd playwright test --config playwright.config.ts
```

Theo `playwright.config.ts`, runner sẽ tự khởi động Vite trên `http://127.0.0.1:5173` nếu chưa có server đang chạy. Tránh để một dev server cũ sử dụng port này với source khác.

Ví dụ chạy riêng use case:

```powershell
npx.cmd playwright test --grep "TC-UC06-00[123]"
```

```powershell
npx.cmd playwright test --grep "UC04|UC06|UC10"
```

Mở báo cáo HTML:

```powershell
npx.cmd playwright show-report
```

Đầu ra:

- `test-results/results.xml`: Playwright JUnit (các ID, Pass/Fail, stack trace).
- `playwright-report/index.html`: báo cáo HTML.
- `test-results/<test-name>/`: screenshot và trace nếu lỗi.
- `test-results/vitest-results.xml`: Vitest JUnit nếu chạy với reporter/outputFile.


### Khó khăn
Hiện đang có 3 Playwright failures là:
- **`TC-UC06-001`**: timeout ở bước chọn `Campus Mobility Hub A`.
- **`TC-UC06-002`**: locator không tìm thấy nút `Select Hub` của Hub C để kiểm tra disabled.
- **`TC-UC06-003`**: timeout ở bước chọn Hub A, chưa đến được kiểm thử ngày quá khứ.

Có 2 integration test bị `Blocked`. Tại `ManageChargingPage.tsx` UC08 tạo `database` cục bộ từ `createMockSeed()` và cập nhật bằng `setDatabase`. Yêu cầu sạc UC06 và quản lý sự cố UC10 sử dụng Zustand store chung, vì thế `IT-UC06-UC08-001` và `IT-UC08-UC10-001` chưa chứng minh được luồng đồng bộ dữ liệu thực tế.
