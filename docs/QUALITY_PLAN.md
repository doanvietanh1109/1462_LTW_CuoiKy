# Quality plan — nhóm 1462

## Trạng thái làm việc

- Nhánh: `fix/billing-integrity` (tạo từ `main` đã fast-forward đến `origin/main`).
- Không dùng MongoDB thật, không chạy seed, không chỉnh sửa hợp đồng/sửa chữa/liên hệ.
- UI/stylesheet chưa bị thay đổi.

## Giai đoạn A — Billing integrity

### Đã làm

- Thêm kiểm tra sở hữu phòng khi ghi điện nước theo lô và khi lập hóa đơn.
- Thêm kiểm tra kỳ, chỉ số, phí/đơn giá; từ chối phòng trùng trong batch.
- Bảo vệ hóa đơn theo chủ trọ; giới hạn hóa đơn người thuê theo quan hệ phòng/hợp đồng.
- Không cập nhật bộ đếm hiện tại khi ghi kỳ khác kỳ hiện tại.
- Chuyển lỗi unique index lúc tạo hóa đơn thành HTTP 409.
- Tạo hóa đơn đơn lẻ trước khi ghi chỉ số, để request thua unique-index race không ghi đè dữ liệu của request thắng.
- Thêm test Node.js độc lập với database.

### Bằng chứng

- `npm --prefix server test`: 9/9 test đạt (mock các model; chưa phải integration test MongoDB).
- `node --check` trên hai controller và file test: đạt.
- `git diff --check`: đạt.

### Giới hạn cần theo dõi

- Batch được tiền kiểm đầy đủ trước lần ghi đầu, nhưng không nguyên tử nếu lỗi hạ tầng xảy ra giữa các thao tác ghi. MongoDB transaction đa tài liệu yêu cầu replica set; chưa xác minh topology đang dùng. Không thay đổi hạ tầng.
- Chưa có integration/E2E test và chưa kết nối database test độc lập.

## Ma trận rà soát tiếp theo

| Khu vực | Trạng thái | Ghi chú |
|---|---|---|
| Billing backend | Đang xử lý | Cần tiếp tục kiểm tra consistency và thêm kiểm thử |
| Phòng/dãy trọ | Chưa rà toàn diện | Kiểm tra ownership và validation API |
| Hợp đồng | Chưa rà | Chỉ review tương thích; tránh sửa module của Dương |
| Sửa chữa/liên hệ | Chưa rà | Chỉ review tương thích; tránh sửa module của Long |
| Auth/role | Chưa rà toàn diện | Kiểm tra JWT và quyền ở API |
| Frontend luồng chính | Chưa rà toàn diện | Chỉ sửa lỗi đã chứng minh; giữ nhận diện giao diện |
| Hiệu năng | Chưa đo baseline | Chưa có số liệu; cần build và đo bundle trước tối ưu |
| Tích hợp/E2E | Chưa kiểm chứng | Chưa có cấu hình MongoDB test/browser automation |

## Lịch sử xác minh

- 2026-11-15: billing unit tests 9/9 đạt; cú pháp backend và `git diff --check` đạt. Race test xác nhận request duplicate không ghi chỉ số.
