const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { connectDatabase } = require("../config/database");
const { User } = require("../models/user.model");
const { Room } = require("../models/room.model");
const { Review } = require("../models/review.model");
const { Coupon } = require("../models/coupon.model");
const { Order } = require("../models/order.model");
const { MotelBlock } = require("../models/motelBlock.model");
const { Contract } = require("../models/contract.model");
const { MeterReading } = require("../models/meterReading.model");
const { Invoice } = require("../models/invoice.model");
const { RepairRequest } = require("../models/repairRequest.model");
const { ContactInquiry } = require("../models/contactInquiry.model");
const { RentalHistory } = require("../models/rentalHistory.model");

const seedData = async () => {
  try {
    console.log("Connecting to database...");
    await connectDatabase();

    console.log("Ensuring demo users...");
    const adminPassword = await bcrypt.hash("admin123", 10);
    const landlordPassword = await bcrypt.hash("landlord123", 10);
    const userPassword = await bcrypt.hash("user123", 10);

    const admin = await User.findOneAndUpdate(
      { email: "Vu69@gmail.com" },
      {
        name: "Vu Admin",
        email: "Vu69@gmail.com",
        password: adminPassword,
        role: "admin",
        phone: "0901112222",
        status: "active",
      },
      { upsert: true, new: true }
    );

    const landlord = await User.findOneAndUpdate(
      { email: "landlord@example.com" },
      {
        name: "Minh Landlord",
        email: "landlord@example.com",
        password: landlordPassword,
        role: "landlord",
        phone: "0987654321",
        status: "active",
      },
      { upsert: true, new: true }
    );

    const tenant1 = await User.findOneAndUpdate(
      { email: "user@example.com" },
      {
        name: "Nguyễn Văn An (Người thuê 1)",
        email: "user@example.com",
        password: userPassword,
        role: "user",
        phone: "0912345678",
        status: "active",
      },
      { upsert: true, new: true }
    );

    const tenant2 = await User.findOneAndUpdate(
      { email: "sinhvien2@example.com" },
      {
        name: "Trần Thị Bình (Người thuê 2)",
        email: "sinhvien2@example.com",
        password: userPassword,
        role: "user",
        phone: "0933445566",
        status: "active",
      },
      { upsert: true, new: true }
    );

    // Seed Dãy trọ (MotelBlock)
    let blocks = await MotelBlock.find({ ownerId: landlord._id });
    if (blocks.length === 0) {
      console.log("Seeding motel blocks (Dãy trọ)...");
      blocks = await MotelBlock.insertMany([
        {
          name: "Dãy A - Cơ sở Thủ Đức",
          address: "Số 12 Võ Văn Ngân, P. Linh Chiểu, TP. Thủ Đức",
          description: "Dãy trọ cao cấp gần ĐH Sư Phạm Kỹ Thuật, có hầm để xe rộng và camera 24/7.",
          ownerId: landlord._id,
          ownerName: landlord.name,
          defaultElectricityPrice: 3500,
          defaultWaterPrice: 15000,
          defaultServiceFee: 100000,
        },
        {
          name: "Dãy B - Cơ sở Bình Thạnh",
          address: "Số 85 Điện Biên Phủ, P. 15, Q. Bình Thạnh",
          description: "Khu căn hộ dịch vụ sinh viên gần HUTECH & Ngoại Thương.",
          ownerId: landlord._id,
          ownerName: landlord.name,
          defaultElectricityPrice: 3800,
          defaultWaterPrice: 18000,
          defaultServiceFee: 120000,
        },
        {
          name: "Dãy C - Cơ sở Quận 7",
          address: "Số 40 Nguyễn Thị Thập, P. Tân Hưng, Quận 7",
          description: "Phòng trọ mới xây thoáng mát gần ĐH Tôn Đức Thắng.",
          ownerId: landlord._id,
          ownerName: landlord.name,
          defaultElectricityPrice: 3500,
          defaultWaterPrice: 15000,
          defaultServiceFee: 100000,
        },
      ]);
    }

    const roomCount = await Room.countDocuments();
    let sampleRoomIds = [];

    if (roomCount === 0) {
      console.log("Seeding rooms...");
      const categories = ["KTX", "Phòng trọ", "Chung cư mini", "Nhà nguyên căn"];
      const districts = ["Quận 1", "Quận 3", "Quận 7", "Bình Thạnh", "Gò Vấp", "Thủ Đức"];
      const amenitiesList = ["Wifi", "Máy lạnh", "Tủ lạnh", "Máy giặt", "Chỗ để xe", "Bảo vệ 24/7"];
      const roomsToInsert = [];

      for (let i = 1; i <= 24; i++) {
        const category = categories[i % categories.length];
        const district = districts[i % districts.length];
        const block = blocks[i % blocks.length];
        const randomAmenities = [...amenitiesList].sort(() => 0.5 - Math.random()).slice(0, 4);
        const area = 18 + (i % 6) * 4;

        roomsToInsert.push({
          title: `Phòng ${ 100 + i } - ${category} tại ${district}`,
          roomNumber: `P.${100 + i}`,
          blockId: block._id,
          category,
          price: (Math.floor(Math.random() * 25) + 18) * 100000,
          area,
          district,
          image: `https://picsum.photos/seed/room${i}/800/600`,
          images: [
            `https://picsum.photos/seed/room${i}/800/600`,
            `https://picsum.photos/seed/room${i}b/800/600`,
          ],
          description: `Phòng ${category} thoáng mát tại ${district}, diện tích ${area}m², đầy đủ tiện nghi cơ bản.`,
          amenities: randomAmenities,
          electricityPrice: block.defaultElectricityPrice,
          waterPrice: block.defaultWaterPrice,
          serviceFee: block.defaultServiceFee,
          currentElectricity: 120,
          currentWater: 25,
          ownerId: landlord._id,
          ownerName: landlord.name,
          status: i === 3 ? "maintenance" : "available",
        });
      }

      const insertedRooms = await Room.insertMany(roomsToInsert);
      sampleRoomIds = insertedRooms.map((room) => room._id);
    } else {
      const existingRooms = await Room.find().limit(25);
      sampleRoomIds = existingRooms.map((room) => room._id);

      // Bổ sung thông tin blockId, area, roomNumber cho các phòng cũ chưa có
      for (let i = 0; i < existingRooms.length; i++) {
        const r = existingRooms[i];
        const block = blocks[i % blocks.length];
        let changed = false;
        if (!r.blockId && block) {
          r.blockId = block._id;
          changed = true;
        }
        if (!r.roomNumber) {
          r.roomNumber = `P.${101 + i}`;
          changed = true;
        }
        if (!r.area) {
          r.area = 20 + (i % 5) * 4;
          changed = true;
        }
        if (!r.ownerId) {
          r.ownerId = landlord._id;
          r.ownerName = landlord.name;
          changed = true;
        }
        if (changed) await r.save();
      }
    }

    // Seed Hợp đồng mẫu (Contracts) & gán người thuê vào 2 phòng đầu tiên
    if ((await Contract.countDocuments()) === 0 && sampleRoomIds.length >= 3) {
      console.log("Seeding contracts, meter readings, invoices, repairs & contacts...");
      const room1 = await Room.findById(sampleRoomIds[0]);
      const room2 = await Room.findById(sampleRoomIds[1]);
      const room3 = await Room.findById(sampleRoomIds[2]);

      if (room3) {
        room3.status = "maintenance";
        await room3.save();
      }

      const contract1 = await Contract.create({
        contractCode: "HD-202601-101",
        roomId: room1._id,
        blockId: room1.blockId,
        landlordId: landlord._id,
        tenantId: tenant1._id,
        tenantName: tenant1.name,
        tenantEmail: tenant1.email,
        tenantPhone: tenant1.phone,
        identityCard: "079203001234",
        startDate: new Date("2026-01-01"),
        endDate: new Date("2026-12-31"),
        rentPrice: room1.price,
        deposit: room1.price,
        electricityPrice: 3500,
        waterPrice: 15000,
        serviceFee: 100000,
        initialElectricity: 100,
        initialWater: 20,
        status: "active",
      });

      room1.status = "rented";
      room1.currentElectricity = 240;
      room1.currentWater = 36;
      room1.tenant = {
        userId: tenant1._id,
        name: tenant1.name,
        email: tenant1.email,
        phone: tenant1.phone,
        startDate: new Date("2026-01-01"),
        endDate: new Date("2026-12-31"),
      };
      await room1.save();

      const contract2 = await Contract.create({
        contractCode: "HD-202602-102",
        roomId: room2._id,
        blockId: room2.blockId,
        landlordId: landlord._id,
        tenantId: tenant2._id,
        tenantName: tenant2.name,
        tenantEmail: tenant2.email,
        tenantPhone: tenant2.phone,
        identityCard: "079203005678",
        startDate: new Date("2026-02-01"),
        endDate: new Date("2026-12-31"),
        rentPrice: room2.price,
        deposit: room2.price,
        electricityPrice: 3500,
        waterPrice: 15000,
        serviceFee: 100000,
        initialElectricity: 80,
        initialWater: 15,
        status: "active",
      });

      room2.status = "rented";
      room2.currentElectricity = 190;
      room2.currentWater = 29;
      room2.tenant = {
        userId: tenant2._id,
        name: tenant2.name,
        email: tenant2.email,
        phone: tenant2.phone,
        startDate: new Date("2026-02-01"),
        endDate: new Date("2026-12-31"),
      };
      await room2.save();

      await RentalHistory.insertMany([
        {
          roomId: room1._id,
          roomTitle: room1.title,
          landlordId: landlord._id,
          tenantId: tenant1._id,
          tenantName: tenant1.name,
          tenantEmail: tenant1.email,
          tenantPhone: tenant1.phone,
          startDate: new Date("2026-01-01"),
          endDate: new Date("2026-12-31"),
          price: room1.price,
          status: "active",
        },
        {
          roomId: room2._id,
          roomTitle: room2.title,
          landlordId: landlord._id,
          tenantId: tenant2._id,
          tenantName: tenant2.name,
          tenantEmail: tenant2.email,
          tenantPhone: tenant2.phone,
          startDate: new Date("2026-02-01"),
          endDate: new Date("2026-12-31"),
          price: room2.price,
          status: "active",
        },
      ]);

      // Seed hóa đơn 10 tháng trong năm 2026 để biểu đồ 12 tháng & danh sách nợ tiền hiển thị đẹp
      for (let m = 1; m <= 10; m++) {
        const oldE1 = 100 + (m - 1) * 45;
        const newE1 = oldE1 + 45;
        const oldW1 = 20 + (m - 1) * 4;
        const newW1 = oldW1 + 4;
        const elecCost1 = (newE1 - oldE1) * 3500;
        const waterCost1 = (newW1 - oldW1) * 15000;
        const total1 = room1.price + elecCost1 + waterCost1 + 100000;

        const reading1 = await MeterReading.create({
          roomId: room1._id,
          contractId: contract1._id,
          landlordId: landlord._id,
          month: m,
          year: 2026,
          oldElectricity: oldE1,
          newElectricity: newE1,
          oldWater: oldW1,
          newWater: newW1,
        });

        await Invoice.create({
          invoiceCode: `INV-2026${String(m).padStart(2, "0")}-R1`,
          roomId: room1._id,
          contractId: contract1._id,
          tenantId: tenant1._id,
          landlordId: landlord._id,
          meterReadingId: reading1._id,
          month: m,
          year: 2026,
          roomPrice: room1.price,
          oldElectricity: oldE1,
          newElectricity: newE1,
          electricityUsage: newE1 - oldE1,
          electricityPrice: 3500,
          electricityCost: elecCost1,
          oldWater: oldW1,
          newWater: newW1,
          waterUsage: newW1 - oldW1,
          waterPrice: 15000,
          waterCost: waterCost1,
          serviceFee: 100000,
          totalAmount: total1,
          status: m === 10 ? "unpaid" : "paid",
          paidAt: m === 10 ? null : new Date(2026, m - 1, 5),
          dueDate: new Date(2026, m - 1, 10),
        });

        // Hóa đơn phòng 2 (của tenant 2)
        const oldE2 = 80 + (m - 1) * 38;
        const newE2 = oldE2 + 38;
        const oldW2 = 15 + (m - 1) * 3;
        const newW2 = oldW2 + 3;
        const elecCost2 = (newE2 - oldE2) * 3500;
        const waterCost2 = (newW2 - oldW2) * 15000;
        const total2 = room2.price + elecCost2 + waterCost2 + 100000;

        const reading2 = await MeterReading.create({
          roomId: room2._id,
          contractId: contract2._id,
          landlordId: landlord._id,
          month: m,
          year: 2026,
          oldElectricity: oldE2,
          newElectricity: newE2,
          oldWater: oldW2,
          newWater: newW2,
        });

        await Invoice.create({
          invoiceCode: `INV-2026${String(m).padStart(2, "0")}-R2`,
          roomId: room2._id,
          contractId: contract2._id,
          tenantId: tenant2._id,
          landlordId: landlord._id,
          meterReadingId: reading2._id,
          month: m,
          year: 2026,
          roomPrice: room2.price,
          oldElectricity: oldE2,
          newElectricity: newE2,
          electricityUsage: newE2 - oldE2,
          electricityPrice: 3500,
          electricityCost: elecCost2,
          oldWater: oldW2,
          newWater: newW2,
          waterUsage: newW2 - oldW2,
          waterPrice: 15000,
          waterCost: waterCost2,
          serviceFee: 100000,
          totalAmount: total2,
          status: m >= 9 ? "unpaid" : "paid",
          paidAt: m >= 9 ? null : new Date(2026, m - 1, 6),
          dueDate: new Date(2026, m - 1, 10),
        });
      }

      // Seed Yêu cầu sửa chữa (RepairRequest)
      await RepairRequest.insertMany([
        {
          roomId: room1._id,
          contractId: contract1._id,
          tenantId: tenant1._id,
          landlordId: landlord._id,
          title: "Máy lạnh không mát và bị chảy nước",
          description: "Máy lạnh bật 18 độ nhưng chỉ ra gió thường, có nhỏ nước ở dàn lạnh.",
          images: ["https://picsum.photos/seed/repair1/600/400"],
          priority: "high",
          status: "in_progress",
          landlordNote: "Đã gọi thợ điện lạnh hẹn chiều mai qua vệ sinh và bơm gas.",
        },
        {
          roomId: room1._id,
          contractId: contract1._id,
          tenantId: tenant1._id,
          landlordId: landlord._id,
          title: "Bóng đèn hành lang bị nhấp nháy",
          description: "Đèn LED ngoài ban công bị chập chờn vào buổi tối.",
          images: ["https://picsum.photos/seed/repair2/600/400"],
          priority: "low",
          status: "resolved",
          landlordNote: "Chủ trọ đã thay bóng LED mới.",
          resolvedAt: new Date(),
        },
        {
          roomId: room2._id,
          contractId: contract2._id,
          tenantId: tenant2._id,
          landlordId: landlord._id,
          title: "Vòi nước bồn rửa mặt bị rò rỉ",
          description: "Khóa van nước nhưng vẫn nhỏ giọt liên tục.",
          images: ["https://picsum.photos/seed/repair3/600/400"],
          priority: "medium",
          status: "new",
        },
      ]);

      // Seed Liên hệ từ khách (ContactInquiry)
      if (sampleRoomIds[3]) {
        await ContactInquiry.insertMany([
          {
            roomId: sampleRoomIds[3],
            landlordId: landlord._id,
            name: "Lê Hoàng Nam",
            phone: "0977889900",
            email: "hoangnam@gmail.com",
            message: "Chào anh/chị, mình muốn hẹn xem phòng vào 15h chiều thứ 7 tuần này ạ.",
            status: "new",
          },
          {
            roomId: sampleRoomIds[4] || sampleRoomIds[3],
            landlordId: landlord._id,
            name: "Phạm Minh Thư",
            phone: "0966554433",
            email: "minhthu@gmail.com",
            message: "Phòng này còn trống không ạ? Có cho nuôi mèo nhỏ không?",
            status: "contacted",
          },
        ]);
      }
    }

    if ((await Coupon.countDocuments()) === 0) {
      console.log("Seeding coupons...");
      await Coupon.insertMany([
        { code: "DIS500", value: 500000, active: true, usageLimit: 100 },
        { code: "HELLO2026", value: 200000, active: true, usageLimit: 500 },
        { code: "HOLARENTAL", value: 1000000, active: true, usageLimit: 50 },
      ]);
    }

    if ((await Review.countDocuments()) === 0 && sampleRoomIds.length > 0) {
      console.log("Seeding reviews...");
      const reviewsToInsert = sampleRoomIds.slice(0, 10).map((roomId) => ({
        roomId,
        userId: admin._id,
        userName: "Demo User",
        stars: 5,
        content: "Phòng sạch sẽ, vị trí tốt và chủ nhà thân thiện.",
      }));
      await Review.insertMany(reviewsToInsert);
    }

    if ((await Order.countDocuments()) === 0 && sampleRoomIds.length > 0) {
      console.log("Seeding orders...");
      const ordersToInsert = [];

      for (const roomId of sampleRoomIds.slice(0, 5)) {
        const room = await Room.findById(roomId);
        if (!room) continue;

        ordersToInsert.push({
          userId: admin._id,
          userName: admin.name,
          roomId: room._id,
          roomName: room.title,
          landlordId: landlord._id,
          originalPrice: room.price,
          discount: 0,
          pricePaid: room.price,
          paymentMethod: "cash",
          status: "success",
        });
      }

      await Order.insertMany(ordersToInsert);
    }

    console.log("Seeding completed successfully.");
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

seedData();
