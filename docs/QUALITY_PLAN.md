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

## UI polish người thuê — hóa đơn, hợp đồng, thông báo, sửa chữa (2026-11-15)

### Đã hoàn thành

- Danh sách hóa đơn chuyển thành card responsive: kỳ, phòng, mã, hạn/đã thu, tổng và số còn phải trả dựa trên trạng thái Backend; lọc Tất cả/Chưa thanh toán/Đã thanh toán; bỏ phần chi tiết bung rộng trùng lặp. Link chi tiết cung cấp thao tác in/lưu PDF.
- Chi tiết hóa đơn trình bày trạng thái và tổng tiền nổi bật, người cho thuê/người thuê, ngày phát hành/hạn, bốn khoản Backend (phòng, điện, nước, phí dịch vụ), chỉ số/tiêu thụ/đơn giá/thành tiền. Không thêm thuế, giảm giá, nợ cũ hay thanh toán một phần không có trong model.
- Bản in có CSS khổ A4, tách nội dung chứng từ khỏi navbar/nút, cột và dòng khoản thu được bố trí lại trên viewport hẹp. Đây mới là triển khai CSS; PDF trình duyệt chưa được xem thực tế.
- Hợp đồng đổi từ bảng phí dài thành nhóm thẻ thời hạn/thuê/cọc/điện/nước/dịch vụ; giữ thông tin hai bên và thao tác in/gia hạn/kết thúc; bỏ thông tin fallback giả về điện thoại/CCCD/chỉ số/tiện nghi/địa chỉ, bỏ tuyên bố ký số. In hợp đồng giữ qua `window.print`, chưa QA bản in.
- Thông báo hiển thị tối đa 50 bản ghi API, lọc theo loại có trong model, phân biệt đọc/chưa đọc, đánh dấu tất cả đã đọc và mở invoice/contract/repair liên quan.
- Yêu cầu sửa chữa có empty state và nút đưa tới form; card hỗ trợ trạng thái, ảnh và nội dung backend, tiến trình cho phép wrap trên mobile.
- Bỏ QR chuyển khoản gắn cứng số tài khoản `MB-0987654321`; hệ thống không lưu tài khoản nhận tiền. Modal giờ nói rõ người thuê thanh toán theo thỏa thuận trước, gửi yêu cầu sau đó, và chủ trọ xác nhận mới đổi trạng thái.
- File thay đổi: `client/src/pages/InvoiceDetailPage.jsx`, `client/src/pages/TenantPortalPage.jsx`, `client/src/styles/tenant.css`, `docs/QUALITY_PLAN.md`. Không sửa Backend hoặc database.

### Kiểm thử, giới hạn và việc còn lại

- `npm --prefix client run build`: PASS; `npm --prefix server test`: 39/39 PASS; `git diff --check`: PASS.
- NOT VERIFIED: layout thực tại 390/768/1024/1440 px, browser Console/Network, print preview/PDF A4, trang chi tiết với hóa đơn thật, contract print. Cố chạy Vite dev server trên `127.0.0.1:5173` nhưng sandbox từ chối listen với `EPERM`; không có browser/database test chạy trong phiên.
- Các test Backend đều dùng mock/unit; không có integration/E2E cho invoice list/detail/print, filter notifications, mark read/route navigation, contract actions, repair form/upload. Không sử dụng MongoDB thật.
- Cần mở app từ đúng thư mục `client/` và backend test riêng, kiểm tra lần lượt 390, 768, 1024 và 1440 px; mở từng invoice, in PDF, xác nhận header/bảng/tổng/footnote không bị cắt; dùng fixture test chứ không ghi vào production.
- Cần review ảnh tham khảo trực tiếp cạnh dashboard, notification, repair; hiện cấu trúc thông tin được hoàn thiện nhưng chưa có bằng chứng visual QA.
- Git cuối: branch `quality/project-review`; UI commit `308e81e` (`feat: polish tenant invoice and contract experience`); commit ghi nhận tiến độ này sẽ theo ngay sau trên cùng nhánh. Working tree sạch sau khi ghi nhận; các commit P0 được giữ nguyên; không push/merge, `main` không đổi.

### Chưa hoàn thành và cách tiếp tục ở phiên sau

- Chạy app trong browser với backend và DB test riêng; kiểm tra Network cho lịch sử thuê, invoices, old bookings URL và console. Không dùng MongoDB production.
- Thêm integration test thực cho các route hợp lệ, 404 route không tồn tại, invoice empty-vs-forbidden và authorization trên MongoDB test.
- Các luồng còn thiếu integration/E2E: hợp đồng → meter → invoice → payment; tenant xem invoice/repair/notification; guest contact; upload Cloudinary; responsive và print/PDF.
- UI còn cần nâng theo ảnh tham khảo: tenant dashboard/quick access đầy đủ và responsive; danh sách/chi tiết hóa đơn nâng cấp; notification center cho landlord và tenant; sửa chữa, empty/loading/error states. Không redesign trong P0 pass này.
- Phiên kế tiếp bắt đầu bằng `git status --short --branch` và `git log -3 --oneline`, đọc mục này, giữ nguyên các commit local; ưu tiên browser/DB-test verification trước khi thêm tính năng.

## VietQR hóa đơn theo từng chủ trọ — 2026-11-16

### Công việc đã hoàn thành

- Giữ nguyên branch `feat/invoice-vietqr`, bắt đầu từ `main` sạch tại `1987476`; không sửa `main`, không push/merge, không dùng MongoDB thật.
- Thêm cấu hình bank account theo User, mặc định rỗng và `select: false`. Cấu hình chỉ qua endpoint self-service có role landlord; ngân hàng được chọn từ VietQR bank list (transfer supported), không lấy thông tin tài khoản từ ảnh tham khảo. `/users/:id`, danh sách user và `req.user` không tự lộ trường này.
- Thêm `GET /api/users/bank-options`, `GET/PATCH /api/users/me/bank-account`; danh sách ngân hàng VietQR cache trong process 24h, timeout 5 giây. Không có API key hay dữ liệu tài khoản hardcode.
- Thêm `GET /api/invoices/:id/payment-instructions`: kiểm tra tenant/invoice ownership, trạng thái chưa thanh toán, lấy amount từ DB và tài khoản từ đúng landlord. Trả `configured:false` nếu chưa có tài khoản. QR Quick Link VietQR dùng amount, account name và mã đối soát `RIPT` + ObjectId invoice; client không thể truyền amount/landlord/account.
- Tenant modal hiển thị QR và thông tin chuyển thủ công/copy; nếu ảnh QR lỗi, thông tin chuyển khoản vẫn dùng được. Gửi yêu cầu không tự đổi thành paid; thao tác gửi và landlord xác nhận/từ chối dùng update có điều kiện theo status. Lưu audit events trong invoice, thông báo landlord/tenant được tái sử dụng.
- Landlord invoice page có form tự cấu hình nhận tiền và nút xác nhận/từ chối cho yêu cầu chờ. Nút thu tiền thủ công hiện có vẫn dùng được cho khoản offline.
- Thêm regression tests cho quyền xem instructions, amount/transfer content, bank account thiếu, và tenant request pending thay vì paid.

### Lỗi đã sửa và bằng chứng

- Trước đây tenant chỉ thấy hướng dẫn giả chung vì hệ thống không có tài khoản nhận tiền; nay tạo QR theo account của landlord gắn invoice, hoặc hiện rõ chưa cấu hình.
- Trước đây nút tenant submit dùng read-then-save, có thể gửi đua; nay atomic update lọc `status: unpaid`, request lặp nhận 409 và không đánh dấu đã thu.
- Xác nhận thanh toán được lọc status chưa paid và ghi `paymentConfirmedBy`, tránh cập nhật trùng. Chỉ landlord sở hữu invoice mới được approve/reject.
- Regression tests kiểm tra amount 3.147.500 được encode đúng từ invoice và tham chiếu phân biệt invoice; unauthorized tenant nhận 403; thiếu bank không trả QR.

### Chưa hoàn thành / lỗi còn tồn tại

- VietQR Quick Link trả ảnh QR từ dịch vụ bên ngoài; không kiểm tra scan thật với ứng dụng ngân hàng. Không có callback/webhook, đối soát giao dịch hoặc xác thực tài khoản ngân hàng. Chủ trọ phải kiểm tra giao dịch thật trước khi xác nhận.
- Bank list lấy từ VietQR khi cấu hình/lần hết cache; mạng ngoài chưa được kiểm tra trong phiên. Khi dịch vụ lỗi, form cấu hình không lưu và có thể thử tải lại.
- Chưa có nhắc tenant gửi ảnh biên lai (không phải bằng chứng xác thực); không hỗ trợ thanh toán một phần.
- Các test approve/reject và cập nhật DB sau refresh chưa có integration test; test hiện tại là unit/mock.

### Test đã chạy

- `npm --prefix server test`: **42/42 PASS**, không kết nối MongoDB.
- `npm --prefix client run build`: **PASS**.
- `node --check` controller/routes được chạy trước lần cập nhật UI nhỏ; cần chạy lại cùng `git diff --check` ngay trước commit.

### Integration/E2E còn thiếu

- Chưa xác minh luồng bank profile save/reload, route auth thật, database persistence, payment instructions, approve/reject và cập nhật dashboard/công nợ trên MongoDB test.
- Chưa có browser E2E cho tenant QR/modal/copy, ảnh QR lỗi, responsive, duplicate click, notification hay PDF/invoice detail.
- Chưa dùng MongoDB production hoặc thực hiện chuyển khoản ngân hàng; các luồng trên **NOT VERIFIED** ngoài unit tests và production build.

### Màn hình UI cần tiếp tục theo ảnh tham khảo

- Home tenant với quick access, card hợp đồng và danh sách thông báo.
- Notification center tenant/landlord, lọc loại và trạng thái đã đọc.
- Feedback/repair empty state, form tạo và theo dõi yêu cầu.
- Hóa đơn/payment modal cần browser visual QA trên mobile/desktop; giữ nguyên theme RIPT Rental.

### Tiếp tục ở phiên Codex sau

- Bắt đầu bằng `git status --short --branch`, `git log -3 --oneline`, và đọc mục này. Giữ các commit local.
- Tạo DB test độc lập, cấu hình một landlord/tenant/invoice fixture; chạy integration test quyền, persist bank config, tạo QR instructions, submit, reject/approve và dashboard.
- Mở app trong browser để quét/kiểm tra hiển thị QR (không chuyển tiền), copy fields, kiểm tra trạng thái và notification; thử responsive. Không dùng production DB.
- Chạy lại tests/build, cập nhật mục Git cuối, rồi mới commit nếu sạch.

### Git cuối lượt

- Branch: `feat/invoice-vietqr`.
- Base commit: `1987476`; commit feature sẽ được ghi sau khi hoàn tất kiểm thử cuối.
- Working tree: đang có thay đổi chưa commit; chưa push/merge; `main` không đổi.
