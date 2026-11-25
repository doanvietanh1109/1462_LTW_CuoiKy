# Tích hợp thư viện ảnh phòng demo

## Phạm vi

- Project: RIPT Rental, nhánh `feat/public-pages`.
- Chỉ sửa Frontend và thêm tài liệu/test. Không sửa Backend, MongoDB hoặc `database/demo/rooms.json`.
- 43 ảnh trong `client/public/images/demo-rooms/` đã có sẵn trước khi bắt đầu; không ảnh gốc nào bị sửa hoặc xóa.

## Kiểm kê ảnh

- Tìm thấy **43 JPEG**; cả 43 file đều đọc và xác minh được.
- Trùng SHA-256 chính xác: **0**.
- Perceptual hash DCT (so sánh 64 bit, khoảng cách Hamming ≤5) phát hiện một cặp gần như cùng khung hình, khoảng cách 0: `20260423211751-bb7e_wm.jpg` và `20260423211755-a8b9_wm.jpg`. Cả hai vẫn có trong manifest; ảnh thứ hai không được dùng để phân bổ nhằm tránh lặp cùng khung hình.
- **40 ảnh** có cạnh dài dưới 400 px (đa số 200×150); 3 ảnh còn lại là 538×717 px. Đây là ảnh có độ phân giải khiêm tốn, không được upscale/chỉnh sửa để tạo cảm giác chất lượng cao. Ảnh nhỏ có thể mềm khi hiển thị lớn ở gallery chi tiết.
- Tổng dung lượng: **1.019.278 byte (~0,97 MiB)**.
- Manifest lưu tên file, public URL, kích thước, dung lượng, tiền tố thời gian và cờ phân bổ. Không suy diễn các ảnh cùng tên gần nhau thành gallery của một phòng.

## Hệ thống cũ và cách phân bổ

`database/demo/rooms.json` có 300 phòng; trường ảnh dùng lại 8 placeholder (`/images/room1.jpg` đến `/images/room8.jpg`), lần lượt 40, 40, 40, 40, 40, 40, 40 và 20 phòng. `RoomCard`, trang chi tiết, so sánh, dashboard chủ trọ và Tenant Portal trước đây tự chọn `image`/`images` và thường fallback về `room1.jpg`; vì vậy nhiều phòng nhìn giống nhau và cách fallback không thống nhất.

`client/src/data/demoRoomImageMap.js` chứa ánh xạ tĩnh theo 300 ID đọc chỉ-đọc từ JSON demo. ID được sắp xếp ổn định rồi gán vòng lặp theo stride 17 trên 42 ảnh phân bổ được. Mỗi ảnh được gán cho 7 hoặc 8 phòng. Ánh xạ không phụ thuộc thứ tự danh sách, bộ lọc, trang hiện tại hoặc `Math.random()`.

`client/src/utils/roomImages.js` ưu tiên URL/ảnh thật, loại placeholder cũ khỏi gallery nếu có ảnh thật, chỉ dùng ảnh thư viện cho ID demo đã biết và giữ fallback cũ cho phòng không có trong mapping. Nếu phòng demo chỉ có ảnh placeholder, chỉ trả về một ảnh bìa; không tạo gallery giả. `RoomImage` xử lý lỗi một lần, dùng ảnh fallback ổn định và ghi alt là ảnh minh họa.

## Màn hình đã nối

- Trang chủ, tìm kiếm và phòng đã lưu thông qua `RoomCard`.
- So sánh phòng và danh sách chọn phòng trong màn so sánh.
- Chi tiết phòng.
- Dashboard chủ trọ (`/landlord/dashboard`). Ảnh ở modal xem trước upload vẫn giữ nguyên.
- Tenant Portal (`/tenant/my-room`) cho ảnh phòng thuê và phòng gợi ý.

`/landlord/rooms` hiện là bảng quản lý không render ảnh. Admin dashboard cũng không có chỗ hiển thị ảnh phòng trong source hiện tại. Không thêm UI mới ở các màn hình đó.

## Kiểm tra

- Frontend tests: **39/39 đạt** (bao gồm 7 test ảnh mới).
- `npm run build`: **đạt**.
- Build đã chép đủ **43 ảnh** vào `client/dist/images/demo-rooms/`, tổng dung lượng trùng khớp **1.019.278 byte**.
- `git diff --check`: đạt.
- `package.json` không có script lint.
- Không đọc/ghi MongoDB và không thay JSON demo.
- Thử `npm run preview -- --host 127.0.0.1` nhưng môi trường chặn mở cổng (`listen EPERM`); vì vậy chưa kiểm tra HTTP preview/404 qua trình duyệt. Kiểm tra file public và bản build trên đĩa đều đạt.

## Mở kiểm tra

Từ thư mục `client`, chạy `npm run dev`, sau đó mở:

- `http://localhost:5173/` — trang chủ
- `http://localhost:5173/search` — tìm kiếm/lọc
- `http://localhost:5173/compare` — so sánh phòng
- `http://localhost:5173/rooms/<roomId>` — chi tiết một phòng demo
- `http://localhost:5173/landlord/dashboard` — dashboard chủ trọ (cần đăng nhập)
- `http://localhost:5173/tenant/my-room` — phòng người thuê (cần đăng nhập)

Lọc, sắp xếp hoặc đổi trang rồi kiểm tra cùng một ID phòng vẫn giữ cùng ảnh. Ảnh do người dùng tải lên phải tiếp tục được ưu tiên. Ảnh thư viện là ảnh minh họa; 40 ảnh độ phân giải thấp có thể mềm trên màn hình chi tiết lớn.
