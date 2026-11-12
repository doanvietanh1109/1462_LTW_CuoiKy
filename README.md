# NHÓM 1462 - BÀI TẬP LỚN LẬP TRÌNH WEB

## 1. Giới thiệu

- Môn học: Lập trình Web
- Đề tài 4: Hệ thống quản lý nhà trọ
- Mã nhóm: 1462

Repository:
https://github.com/doanvietanh1109/1462_LTW_CuoiKy

Hệ thống hỗ trợ quản lý phòng trọ, hợp đồng thuê, điện nước, hóa đơn, yêu cầu sửa chữa và các chức năng liên quan.

## 2. Công nghệ sử dụng

- Frontend: ReactJS, Vite
- Backend: Node.js, Express.js
- Cơ sở dữ liệu: MongoDB, Mongoose
- Xác thực: JWT, bcrypt

## 3. Cấu trúc dự án

```text
1462_LTW_CuoiKy/
├── client/          # Frontend ReactJS
├── server/          # Backend Node.js / Express
│   ├── src/
│   ├── .env.example
│   ├── package.json
│   └── API_DOCS.md
├── .gitignore
└── README.md
```

## 4. Yêu cầu môi trường

Máy cần cài đặt:

- Node.js và npm
- Git
- MongoDB local hoặc MongoDB Atlas

## 5. Hướng dẫn cài đặt

### Bước 1. Clone repository

```bash
git clone https://github.com/doanvietanh1109/1462_LTW_CuoiKy.git
cd 1462_LTW_CuoiKy
```

Lưu ý: Repository đang ở chế độ Private, cần được cấp quyền truy cập.

### Bước 2. Cài đặt Backend

```bash
npm --prefix server ci
```

### Bước 3. Cài đặt Frontend

```bash
npm --prefix client ci
```

## 6. Cấu hình môi trường

Tạo file cấu hình Backend:

```bash
cp server/.env.example server/.env
```

Mở `server/.env` và cấu hình các biến phù hợp.

Ví dụ chạy local:

```env
PORT=4000
MONGO_URI=mongodb://127.0.0.1:27017/thuephongsv_test_1462
JWT_SECRET=replace_with_a_strong_random_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

Các dịch vụ ngoài sử dụng biến môi trường riêng, tùy theo chức năng được bật.

Lưu ý:
- Không commit file `.env` lên GitHub.
- Không sử dụng mật khẩu hoặc khóa bí mật thật trong README.
- Chỉ sử dụng database thử nghiệm khi chạy seed.

## 7. Hướng dẫn chạy dự án

### Chạy Backend

Mở Terminal thứ nhất tại thư mục gốc:

```bash
npm --prefix server run dev
```

Backend sử dụng cổng được cấu hình trong `PORT`.

### Chạy Frontend

Mở Terminal thứ hai:

```bash
npm --prefix client run dev
```

Truy cập trình duyệt:

http://localhost:5173

Khi chạy trên máy mới, cần kiểm tra cấu hình kết nối API giữa Frontend và Backend.

## 8. Tạo dữ liệu mẫu bằng Seed

Script seed:

`server/src/utils/seed.js`

Trước khi chạy, kiểm tra `MONGO_URI` trong `server/.env` đang trỏ đến database thử nghiệm.

Chạy:

```bash
npm --prefix server run seed
```

Lệnh seed tạo hoặc cập nhật tài khoản demo và dữ liệu mẫu.

Không chạy seed trên cơ sở dữ liệu đang chứa dữ liệu thật.

## 9. Tài khoản demo

Các tài khoản dưới đây được khai báo trong script seed.

| Vai trò | Email | Mật khẩu |
|---|---|---|
| Admin | Vu69@gmail.com | admin123 |
| Chủ trọ | landlord@example.com | landlord123 |
| Người thuê | user@example.com | user123 |
| Người thuê | sinhvien2@example.com | user123 |

Chỉ dùng các tài khoản này trong môi trường demo sau khi seed thành công.

Không sử dụng các mật khẩu này khi triển khai công khai.

## 10. Kiểm tra dự án

Kiểm tra build Frontend:

```bash
npm --prefix client run build
```

Kiểm tra cú pháp các file khởi động Backend:

```bash
node --check server/src/app.js
node --check server/src/server.js
```

Build thành công không đồng nghĩa toàn bộ chức năng đã được kiểm thử tích hợp.

## 11. Tài liệu API

Xem tại:

`server/API_DOCS.md`

## 12. Phân công thành viên

### Đoàn Việt Anh - Trưởng nhóm

- Kiến trúc và tích hợp hệ thống
- Xác thực và phân quyền
- Quản lý dãy trọ và phòng trọ
- Quản lý điện nước và hóa đơn
- Doanh thu, thống kê và dashboard
- Quản lý repository và review Pull Request

### Lê Minh Dương

- Kiểm thử và hoàn thiện quản lý hợp đồng thuê
- Phát hiện và sửa lỗi liên quan đến hợp đồng
- Kiểm tra quyền truy cập và dữ liệu hợp đồng

### Nguyễn Long

- Kiểm thử và hoàn thiện yêu cầu sửa chữa
- Kiểm thử và hoàn thiện chức năng liên hệ
- Kiểm tra quyền truy cập và trạng thái yêu cầu

## 13. Quy trình làm việc GitHub

- Nhánh `main`: phiên bản tích hợp của nhóm.
- Mỗi thành viên tạo nhánh riêng khi lập trình.
- Các thay đổi phải có commit với nội dung rõ ràng.
- Tạo Pull Request trước khi đưa code vào `main`.
- Trưởng nhóm kiểm tra và merge Pull Request.

Nhánh công việc:
- Dương: `feature/contracts`
- Long: `feature/repairs-contacts`

## 14. Tình trạng dự án

- Đã thiết lập Backend và Frontend.
- Đã kiểm tra build Frontend bằng Vite.
- Đang tiếp tục kiểm thử tích hợp và hoàn thiện chức năng.
- Các cảnh báo bảo mật dependency cần được đánh giá và xử lý.
