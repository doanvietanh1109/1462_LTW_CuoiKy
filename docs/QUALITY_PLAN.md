# Quality plan — nhóm 1462

## Trạng thái làm việc

- Nhánh hiện tại: `quality/project-review`, tách từ commit sạch trên `fix/billing-integrity`.
- Commit billing ban đầu: `d946c20`; race fix: `6c70761`.
- Commit đồng bộ workflow hiện tại: `c97cac7` trên local branch; chưa push.
- Không dùng MongoDB thật, không chạy seed; không push/merge. Hợp đồng, sửa chữa và liên hệ được sửa theo phạm vi master task, với tests mock cho quyền và validation.
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
- Bỏ fallback hợp đồng/hóa đơn mẫu phía trình duyệt; đặt/gia hạn/kết thúc hợp đồng chỉ báo thành công khi API xác nhận, còn lỗi thì hiển thị thất bại.
- Hợp đồng: bộ lọc tìm kiếm không thể ghi đè điều kiện tenant/landlord; giới hạn chi tiết, gia hạn, kết thúc theo đúng người liên quan; landlord tạo hợp đồng chỉ với phòng mình; self-book yêu cầu đúng vai trò, phòng hợp lệ/còn trống và không tự kết thúc hợp đồng active khác. Có unit tests cho helper quyền/query.
- Không còn phát hành hóa đơn với chỉ số điện/nước mẫu khi tạo hợp đồng; self-book tạo invoice sau khi người quản lý nhập số đo thực tế.
- Một phòng chỉ có một hợp đồng active theo unique partial index; duplicate-key được đổi thành HTTP 409. Index khai báo trong schema nhưng chưa kiểm chứng được việc tạo trên DB hoặc dữ liệu hiện có.
- Lịch sử thuê: nguyên nhân code-level của 404 là client gọi `/rooms/rental-history/my`, trong khi server mount `/rental-history`; controller cũ còn bắt buộc `landlordId` query. Client nay gọi `/rental-history`, server tự giới hạn theo landlord/tenant, danh sách rỗng trả 200; xóa fallback dựng lịch sử giả từ Room. Trước sửa, effect phụ thuộc `rooms` nên chạy lại sau lần tải rooms; nay chỉ refetch theo bộ lọc. Chưa đo Network thực tế.
- Bảng điện nước hợp nhất phòng status `rented` với phòng có hợp đồng active của chủ trọ, và dùng chỉ số mới nhất trước kỳ đang xem làm chỉ số đầu kỳ. Batch chấp nhận trạng thái Room lệch khi hợp đồng active xác nhận kỳ thuê và chủ trọ vẫn sở hữu phòng.
- Luồng dashboard “gán người thuê” trước gọi `/rooms/:id/rent`, route không tồn tại; nay tạo hợp đồng qua `POST /contracts`. Danh sách hợp đồng có loading/error rõ, không coi lỗi tải là danh sách rỗng.
- Route cũ thêm tenant nay chuyển qua luồng tạo Contract chuẩn; route release được khai báo và không thể đưa phòng về trống khi vẫn có hợp đồng active.
- Liên hệ khách: validate dữ liệu/độ dài, chỉ nhận phòng trống, giới hạn gửi cơ bản theo IP trong một process; chủ trọ chỉ cập nhật liên hệ thuộc mình.
- Sửa chữa: tenant phải có hợp đồng active của chính mình; landlord chỉ cập nhật yêu cầu thuộc mình. Form gửi file thật (tối đa 3 ảnh, 5 MB/ảnh), server kiểm tra chữ ký JPG/PNG/WebP rồi lưu Cloudinary; bỏ URL ảnh và yêu cầu sửa chữa giả ở local state.
- Upload phòng: hai form chủ trọ hỗ trợ nhiều ảnh (tối đa 8, 5 MB/ảnh), preview, chọn ảnh bìa, thêm/bỏ ảnh; server kiểm tra chữ ký file, giữ ảnh cũ khi cập nhật và không xóa asset từ xa khi bỏ ảnh khỏi phòng. Create room mới ép loại `Phòng trọ`; dữ liệu cũ vẫn đọc được.
- Không đổi CSS/theme/navbar/sidebar/layout chính; các UI thay đổi chỉ nằm ở input upload/loại phòng và trạng thái thông báo tối thiểu.
- Nhắc nợ trả 501 rõ rằng email chưa được cấu hình; không ghi nhận gửi thành công.
- Hóa đơn có trạng thái chờ xác nhận, lọc mã/tháng/năm/trạng thái và phân trang server/UI.
- React route splitting giảm entry bundle; giữ component/layout/theme hiện tại.
- Không sửa controller/model hợp đồng (Dương), sửa chữa/liên hệ (Long); những luồng đó cần review riêng.

## Bằng chứng đã có

- `npm --prefix server test`: 34/34 mock unit tests pass; không kết nối DB.
- `node --check` các file backend/test đã sửa và `git diff --check`: đạt ở lần kiểm tra gần nhất.
- `npm --prefix client run build`: đạt.
- Bundle trước splitting: entry 633.62 KB / 190.84 KB gzip. Sau: entry 226.51 KB / 73.76 KB gzip, giảm lần lượt 64.3% và 61.3%. Dashboard landlord riêng 233.27 KB. Chưa đo Lighthouse/Web Vitals.
- Video hero có dung lượng 47 MB; chưa transcode vì máy không có `ffmpeg`.

## Giới hạn/rủi ro

- MongoDB transaction nhiều document cần replica set; topology hiện tại chưa được xác minh và không đổi hạ tầng. Batch tiền kiểm, ghi theo từng phòng, và báo rõ partial nếu lỗi hạ tầng giữa chừng; không đảm bảo rollback toàn batch.
- Chưa có MongoDB test độc lập, HTTP integration/browser E2E hoặc console QA. HTTP test thử nghiệm không chạy được vì sandbox chặn `listen()` với `EPERM`, kể cả trên loopback. Do đó trạng thái cụ thể của P.107 và số request thật trên Network là NOT VERIFIED.
- Unique partial index hợp đồng chưa được tạo/xác minh trong DB; nếu dữ liệu cũ có nhiều hợp đồng active cùng phòng, việc tạo index có thể thất bại. Không tự dọn dữ liệu để né lỗi.
- Tạo hợp đồng ghi nhiều collection mà chưa có transaction/rollback; MongoDB topology chưa xác minh replica set. Race về cùng phòng được bảo vệ bởi index sau khi index được tạo.
- Cloudinary upload thật chưa chạy vì không gọi dịch vụ ngoài; khi thiếu cấu hình lưu trữ, thao tác trả lỗi. Upload asset phòng có thể còn asset mồ côi nếu lưu MongoDB lỗi sau khi upload; luồng dọn bù chưa hoàn thiện. Xóa ảnh khỏi phòng chỉ bỏ URL khỏi tài liệu, không xóa asset Cloudinary.
- Contact rate limit là bộ đếm trong process, không thay thế rate limiting ở reverse proxy/API gateway và reset khi restart.
- React Router là `6.30.6`. Hai future warning chưa bật flags vì chưa có browser smoke test để kiểm tra điều hướng; đây là warning tương thích tương lai, chưa phải lỗi chức năng đã xác nhận.
- Chưa đo hiệu năng runtime/LCP/CLS/INP trên browser.

## Việc còn lại

- Chuẩn bị DB test độc lập, xác minh duplicate active cũ rồi tạo unique partial index và chạy integration test.
- Kiểm tra app trên browser: lịch sử thuê + request count, tạo hợp đồng, điện nước P.107, contact, repair, upload, responsive/console.
- Hoàn thiện compensation/dọn Cloudinary asset khi ghi MongoDB thất bại.
- Rà nốt CRUD dãy trọ và auth route/error status.
- Xem xét nén video bằng công cụ phù hợp và đo trước/sau.
- Cập nhật tài liệu khởi chạy/seed và ma trận đề số 4 khi có rubric chính thức.
- Chạy toàn bộ test/build cuối, kiểm secrets/status, cập nhật file này rồi commit các nhóm đã kiểm chứng.

## Lịch sử xác minh

- 2026-11-15: billing ban đầu 9/9 unit tests đạt; commit `d946c20`.
- 2026-11-15: tạo hóa đơn trước khi ghi chỉ số để giảm rủi ro race; commit `6c70761`.
- 2026-11-15: bộ kiểm thử tăng lên 19/19, frontend production build đạt; route splitting đã đo được mức giảm bundle như trên.
- 2026-11-15: lịch sử thuê, meter sheet, contract, contact, repair, room upload/category được nối và siết validation; 34/34 mock tests và production build pass. Không dùng DB thật; browser/Cloudinary/HTTP integration vẫn NOT VERIFIED.
- 2026-11-15: commit local `c97cac7` tạo sau khi test/build pass; chưa push/PR/merge.

## Bổ sung 2026-11-15 — thông báo, tenant portal, hóa đơn

- Vấn đề: tenant portal còn nút kiểm thử 403 dành cho bài tập và CTA tạo “hóa đơn mẫu”; chưa có nơi xem/đánh dấu thông báo đã đọc. Hóa đơn chi tiết có bảng rộng, chưa có CSS in riêng.
- Giải pháp: bỏ nút test bảo mật và CTA mẫu; thêm lời chào theo tài khoản, điều hướng đến tìm phòng, tab thông báo đọc dữ liệu API. Tạo model/API thông báo MongoDB, phân trang giới hạn, lọc theo user đăng nhập, cập nhật một/tất cả đã đọc và bảo vệ quyền sở hữu.
- Sự kiện hiện được lưu cho phát hành hóa đơn, xác nhận thu tiền, tạo/gia hạn/kết thúc hợp đồng, gửi yêu cầu sửa chữa và thay đổi trạng thái sửa chữa. Thông báo mang loại và resource ID; tenant có thể mở hóa đơn hoặc chuyển đến yêu cầu sửa chữa.
- Hóa đơn chi tiết được trình bày như chứng từ; thêm thông tin hạn thanh toán/chủ trọ và CSS responsive/in A4 để bảng không bị cắt khi in.
- File thay đổi: `server/src/models/notification.model.js`, `server/src/controllers/notification.controller.js`, `server/src/routes/notification.routes.js`, `server/src/utils/createNotification.js`, `server/src/app.js`, controller invoice/contract/repair, `server/test/notification-access.test.js`, `client/src/pages/TenantPortalPage.jsx`, `client/src/pages/InvoiceDetailPage.jsx`, `client/src/styles/tenant.css`.
- Test: `npm --prefix server test` 37/37 PASS (mock/unit, không kết nối MongoDB); `npm --prefix client run build` PASS; `node --check` controller và `git diff --check` PASS.
- NOT VERIFIED: luồng ghi/đọc notification trên MongoDB thật, browser/console/network, PDF qua trình duyệt. Không có DB test hoặc browser E2E được chạy trong phiên này.
- Hạn chế còn lại: chưa có notification bell/danh sách riêng trong landlord layout; chưa có công việc nền sinh nhắc hóa đơn đến hạn/quá hạn; lưu notification là best-effort để không làm thất bại nghiệp vụ chính khi bảng notification lỗi. Contract event khi người thuê đăng ký tạo thông báo cho chủ trọ, còn tenant events tới portal người thuê.
- Commit local tương ứng: `feat: add tenant notifications and invoice print layout` (xem `git log`); chưa push.

## P0 final pass — API 404/403 và request lặp (2026-11-15)

### Công việc hoàn thành

- Git trước khi sửa: `quality/project-review`, HEAD `3e819cd`, working tree sạch. Không checkout/reset/xóa dữ liệu.
- Truy vết các URL trong frontend và router/controller hiện tại. Không tìm thấy caller `/rooms/rental-history/my`, `/bookings` hoặc `POST /api/bookings` trong `client/src`/`server/src`.
- Lịch sử thuê hiện được mount tại `GET /api/rental-history` và landlord dashboard gọi `apiRequest('/rental-history…')`. Controller giới hạn query theo landlord/tenant và trả 200 với `history: []` khi không có bản ghi. URL cũ `/api/rooms/rental-history/my` không được mount; nếu một client cũ còn gọi thì 404 là route không tồn tại, khác với danh sách hợp lệ rỗng.
- Không có route `/api/bookings` hay caller hiện hành. Luồng thuê phòng hiện gọi `POST /api/contracts/self-book`; liên hệ khách dùng module contacts. Do đó 404 từ `/api/bookings` chỉ xảy ra với client cũ/bên ngoài đang gọi endpoint không còn được hỗ trợ; không dựng booking giả hoặc thêm route alias không có contract nghiệp vụ.
- Sửa quyền xem hóa đơn để chấp nhận liên kết trực tiếp `invoice.tenantId` khi danh sách/chi tiết invoice hợp lệ nhưng liên kết legacy `Room.tenant`/`Contract.tenantEmail` không đầy đủ. List query người thuê cũng lấy hóa đơn theo `tenantId` hoặc các phòng/hợp đồng đã liên kết. Quyền 403 với invoice thuộc người khác vẫn giữ nguyên.
- Bổ sung regression tests: người thuê đọc invoice theo `tenantId` trực tiếp; danh sách lấy được invoice link trực tiếp; invoice của tenant khác vẫn bị 403.
- Rà `setInterval`, retry và các effect liên quan: không thấy polling/retry liên tục. Tenant data load theo thay đổi email đăng nhập; rental history theo bộ lọc; dashboard rooms/stats theo mount. `React.StrictMode` vẫn bật, nên môi trường development có thể chạy effect hai lần khi mount, nhưng không có vòng lặp state phụ thuộc khiến gọi vô hạn.

### Bằng chứng, lỗi còn tồn tại và giới hạn

- Không có browser DevTools/Network log trong phiên này, nên không thể xác nhận những request cũ có còn phát sinh tại runtime hay không. Client hiện tại không gọi hai endpoint cũ nêu trên; nếu Console vẫn báo thì cần xác nhận server/client đang chạy đúng workspace/build hiện tại, không chỉ thêm route để che lệch phiên bản.
- Trước sửa, kiểm tra chi tiết invoice bỏ qua `invoice.tenantId`, trong khi list đã coi `Contract.tenantId` là liên kết hợp lệ. Regression mock trước tiên lộ fixture cũ tự mâu thuẫn (fixture gán tenantId của chính user nhưng mong 403); sửa fixture thành tenant khác/null. Kết quả sau cùng: 39/39 tests PASS, bao gồm 403 của tenant khác và 200 của direct tenant link.
- `POST /api/bookings` và `/api/rooms/rental-history/my` vẫn trả 404 nếu gọi trực tiếp vì không phải endpoint được ứng dụng hiện tại hỗ trợ. Đây là route cũ/không tồn tại, không phải phản hồi “không có dữ liệu”.
- API hóa đơn đọc danh sách bình thường không trả 403 chỉ vì người thuê chưa có invoice; query giới hạn về phòng/tài khoản của họ và có thể trả danh sách rỗng. 403 còn đúng với truy cập invoice/phòng của tài khoản khác. Không chạy browser để xác minh request thực tế.
- Chưa chạy integration/E2E, không kết nối MongoDB, không kiểm tra dữ liệu P.107 hoặc các bản ghi legacy thật. Các unit test controller dùng mock.

### Test và Git sau sửa

- `npm --prefix server test`: 39/39 PASS.
- `npm --prefix client run build`: PASS (frontend không đổi trong phần P0).
- `node --check server/src/controllers/invoice.controller.js`, `git diff --check`: PASS.
- Không thêm retry, không tắt StrictMode.
- Git cuối: branch `quality/project-review`; P0 code/tests commit `3fdcba1` (`fix: honor direct tenant invoice ownership`) và commit cập nhật tài liệu local trên cùng nhánh. Working tree sạch; chưa push/merge, `main` không đổi.

### Chưa hoàn thành và cách tiếp tục ở phiên sau

- Chạy app trong browser với backend và DB test riêng; kiểm tra Network cho lịch sử thuê, invoices, old bookings URL và console. Không dùng MongoDB production.
- Thêm integration test thực cho các route hợp lệ, 404 route không tồn tại, invoice empty-vs-forbidden và authorization trên MongoDB test.
- Các luồng còn thiếu integration/E2E: hợp đồng → meter → invoice → payment; tenant xem invoice/repair/notification; guest contact; upload Cloudinary; responsive và print/PDF.
- UI còn cần nâng theo ảnh tham khảo: tenant dashboard/quick access đầy đủ và responsive; danh sách/chi tiết hóa đơn nâng cấp; notification center cho landlord và tenant; sửa chữa, empty/loading/error states. Không redesign trong P0 pass này.
- Phiên kế tiếp bắt đầu bằng `git status --short --branch` và `git log -3 --oneline`, đọc mục này, giữ nguyên các commit local; ưu tiên browser/DB-test verification trước khi thêm tính năng.
