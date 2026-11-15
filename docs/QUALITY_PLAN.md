# Quality plan — nhóm 1462

## Trạng thái làm việc

- Nhánh hiện tại: `quality/project-review`, tách từ commit sạch trên `fix/billing-integrity`.
- Commit billing ban đầu: `d946c20`; race fix: `6c70761`.
- Không dùng MongoDB thật, không chạy seed, không sửa hợp đồng/sửa chữa/liên hệ.
- Không đổi stylesheet/theme/layout chính.

## Giai đoạn A — Billing integrity

### Đã làm

- Xác minh quyền sở hữu phòng khi ghi batch và tạo hóa đơn.
- Validation kỳ, chỉ số, đơn giá/phí; chặn room ID lặp; chỉ số của kỳ có invoice đã phát hành không được thay đổi.
- Hóa đơn đơn lẻ/lô được tạo trước khi upsert chỉ số để request thua unique-index race không ghi đè dữ liệu thắng.
- Chủ trọ chỉ thao tác hóa đơn mình; người thuê chỉ truy cập hóa đơn gắn phòng/hợp đồng của mình.
- Người thuê gửi yêu cầu thanh toán ở trạng thái chờ xác nhận; chủ trọ mới xác nhận `paid`.
- Phí bằng 0 được giữ nguyên; kỳ khác kỳ hiện tại không ghi đè counter hiện tại.
- Unique key trả 409; lỗi batch sau khi có ghi trả phản hồi partial với số lượng để tải lại và đối soát.

## Giai đoạn B–F — tiến độ

- API danh sách/chi tiết phòng công khai chỉ cho thấy phòng trống; không trả tenant, ownerId hoặc counter điện nước. Chủ trọ chỉ thấy/sửa tài nguyên của mình.
- Room CRUD kiểm tra số hợp lệ, dãy trọ thuộc chủ, trạng thái phòng hợp lệ; counter chỉ cập nhật qua luồng điện nước; không xóa phòng đang thuê.
- Bỏ login offline giả, luôn xác minh JWT cache với `/auth/me`; production yêu cầu JWT secret cấu hình tối thiểu 32 ký tự.
- Bỏ fallback danh sách phòng demo khi API rỗng/lỗi; hóa đơn local giả không còn thay kết quả API.
- Nhắc nợ trả 501 rõ rằng email chưa được cấu hình; không ghi nhận gửi thành công.
- Hóa đơn có trạng thái chờ xác nhận, lọc mã/tháng/năm/trạng thái và phân trang server/UI.
- React route splitting giảm entry bundle; giữ component/layout/theme hiện tại.
- Không sửa controller/model hợp đồng (Dương), sửa chữa/liên hệ (Long); những luồng đó cần review riêng.

## Bằng chứng đã có

- `npm --prefix server test`: 19/19 mock unit tests pass; không kết nối DB.
- `node --check` các file backend/test đã sửa và `git diff --check`: đạt ở lần kiểm tra gần nhất.
- `npm --prefix client run build`: đạt.
- Bundle trước splitting: entry 633.62 KB / 190.84 KB gzip. Sau: entry 226.51 KB / 73.76 KB gzip, giảm lần lượt 64.3% và 61.3%. Dashboard landlord riêng 233.27 KB. Chưa đo Lighthouse/Web Vitals.
- Video hero có dung lượng 47 MB; chưa transcode vì máy không có `ffmpeg`.

## Giới hạn/rủi ro

- MongoDB transaction nhiều document cần replica set; topology hiện tại chưa được xác minh và không đổi hạ tầng. Batch tiền kiểm, ghi theo từng phòng, và báo rõ partial nếu lỗi hạ tầng giữa chừng; không đảm bảo rollback toàn batch.
- Chưa có MongoDB test độc lập, HTTP integration/browser E2E hoặc console QA. HTTP test thử nghiệm không chạy được vì sandbox chặn `listen()` với `EPERM`, kể cả trên loopback.
- Luồng hợp đồng hiện có tự tạo invoice mẫu khi tạo hợp đồng và có local fallback; chưa sửa vì thuộc phân công thành viên khác, cần nhóm review trước.
- Repair/contact controllers chưa rà sâu vì thuộc phân công Long; contract controller chưa rà sâu vì thuộc phân công Dương.
- Chưa đo hiệu năng runtime/LCP/CLS/INP trên browser.

## Việc còn lại

- Rà nốt CRUD dãy trọ và auth route/error status.
- Bổ sung integration test trên MongoDB test riêng khi có URI test an toàn.
- Rà toàn bộ trang React và thao tác modal/responsive bằng browser nếu có môi trường chạy.
- Xem xét nén video bằng công cụ phù hợp và đo trước/sau.
- Cập nhật tài liệu khởi chạy/seed và ma trận đề số 4 khi có rubric chính thức.
- Chạy toàn bộ test/build cuối, kiểm secrets/status, cập nhật file này rồi commit các nhóm đã kiểm chứng.

## Lịch sử xác minh

- 2026-11-15: billing ban đầu 9/9 unit tests đạt; commit `d946c20`.
- 2026-11-15: tạo hóa đơn trước khi ghi chỉ số để giảm rủi ro race; commit `6c70761`.
- 2026-11-15: bộ kiểm thử tăng lên 19/19, frontend production build đạt; route splitting đã đo được mức giảm bundle như trên.
