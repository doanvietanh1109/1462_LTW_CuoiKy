import { apiRequest } from "../api/apiClient";

const getContractStorageKey = (email) =>
  `TENANT_ACTIVE_CONTRACT_${(email || "guest").toLowerCase()}`;

const getInvoicesStorageKey = (email) =>
  `TENANT_INVOICES_${(email || "guest").toLowerCase()}`;

export const getLocalTenantContract = (email) => {
  try {
    const raw = localStorage.getItem(getContractStorageKey(email));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const saveLocalTenantContract = (email, contract) => {
  try {
    if (!contract) {
      localStorage.removeItem(getContractStorageKey(email));
    } else {
      localStorage.setItem(
        getContractStorageKey(email),
        JSON.stringify(contract)
      );
    }
  } catch {
    // ignore
  }
};

export const getLocalTenantInvoices = (email) => {
  try {
    const raw = localStorage.getItem(getInvoicesStorageKey(email));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveLocalTenantInvoices = (email, invoices) => {
  try {
    localStorage.setItem(
      getInvoicesStorageKey(email),
      JSON.stringify(invoices || [])
    );
  } catch {
    // ignore
  }
};

export const getLocalInvoiceById = (invoiceId, email) => {
  const list = getLocalTenantInvoices(email);
  return list.find((inv) => String(inv._id || inv.id) === String(invoiceId)) || null;
};

export const buildContractAndInvoicesBundle = ({
  room,
  user,
  tenantPhone = "0987.654.321",
  identityCard = "001202034567",
  startDate,
  durationMonths = 6,
  finalPrice,
}) => {
  const now = new Date();
  const start = startDate ? new Date(startDate) : now;
  const end = new Date(start);
  end.setMonth(end.getMonth() + (Number(durationMonths) || 6));

  const roomObj = room || {
    _id: "room-demo-107",
    roomNumber: "107",
    title: "Phòng ban công thoáng sáng A107",
    district: "Hà Đông, Hà Nội",
    area: 32,
    price: 3400000,
    electricityPrice: 3500,
    waterPrice: 15000,
    serviceFee: 150000,
    image: "/images/room1.jpg",
    amenities: ["Wifi", "Điều hòa", "Nóng lạnh", "Chỗ để xe", "An ninh"],
  };

  const rentPrice =
    finalPrice !== undefined && Number(finalPrice) > 0
      ? Number(finalPrice)
      : Number(roomObj.price) || 3400000;
  const electricityPrice = Number(roomObj.electricityPrice) || 3500;
  const waterPrice = Number(roomObj.waterPrice) || 15000;
  const serviceFee = Number(roomObj.serviceFee) || 150000;

  const contractId = `local-contract-${Date.now()}`;
  const contractCode = `HD-${now.getFullYear()}-${String(
    roomObj.roomNumber || "107"
  ).replace(/\D/g, "")}-${Math.floor(100 + Math.random() * 900)}`;

  const contract = {
    _id: contractId,
    contractCode,
    status: "active",
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    rentPrice,
    deposit: rentPrice,
    electricityPrice,
    waterPrice,
    serviceFee,
    initialElectricity: 120,
    initialWater: 12,
    tenantName: user?.name || "Người thuê",
    tenantEmail: user?.email || "user@example.com",
    tenantPhone: tenantPhone || user?.phone || "0987.654.321",
    identityCard: identityCard || "001202034567",
    notes:
      "Hợp đồng thuê phòng trọ điện tử (Cam kết giữ giá thuê trong suốt thời hạn hợp đồng, thanh toán từ ngày 01 - 10 hàng tháng).",
    roomId: {
      _id: roomObj._id || roomObj.id || "room-demo-107",
      roomNumber: roomObj.roomNumber || "107",
      title: roomObj.title || "Phòng ban công thoáng sáng A107",
      district: roomObj.district || "Hà Đông, Hà Nội",
      area: roomObj.area || 32,
      price: rentPrice,
      status: "rented",
      image: roomObj.image || roomObj.img || "/images/room1.jpg",
      amenities: roomObj.amenities || ["Wifi", "Chỗ để xe", "An ninh"],
      currentElectricity: 165,
      currentWater: 18,
    },
    blockId: {
      name: roomObj.blockId?.name || "Dãy A - Cơ sở Hà Đông",
      address: roomObj.district || "Hà Đông, Hà Nội",
    },
    landlordId: {
      name: roomObj.ownerName || "Chủ trọ Demo (Anh Minh)",
      phone: roomObj.ownerPhone || "0987.654.321",
      email: "landlord@example.com",
    },
  };

  const curMonth = now.getMonth() + 1;
  const curYear = now.getFullYear();
  const prevMonth = curMonth === 1 ? 12 : curMonth - 1;
  const prevYear = curMonth === 1 ? curYear - 1 : curYear;

  const curElecUsage = 45;
  const curWaterUsage = 6;
  const curElecCost = curElecUsage * electricityPrice;
  const curWaterCost = curWaterUsage * waterPrice;
  const curTotal = rentPrice + curElecCost + curWaterCost + serviceFee;

  const prevElecUsage = 38;
  const prevWaterUsage = 5;
  const prevElecCost = prevElecUsage * electricityPrice;
  const prevWaterCost = prevWaterUsage * waterPrice;
  const prevTotal = rentPrice + prevElecCost + prevWaterCost + serviceFee;

  const invoices = [
    {
      _id: `inv-local-${curYear}${String(curMonth).padStart(2, "0")}`,
      invoiceCode: `INV-${curYear}${String(curMonth).padStart(2, "0")}-${
        roomObj.roomNumber || "107"
      }`,
      month: curMonth,
      year: curYear,
      roomPrice: rentPrice,
      oldElectricity: 120,
      newElectricity: 165,
      electricityUsage: curElecUsage,
      electricityPrice,
      electricityCost: curElecCost,
      oldWater: 12,
      newWater: 18,
      waterUsage: curWaterUsage,
      waterPrice,
      waterCost: curWaterCost,
      serviceFee,
      totalAmount: curTotal,
      status: "unpaid",
      dueDate: new Date(curYear, curMonth - 1, 10).toISOString(),
      roomId: contract.roomId,
      tenantId: {
        name: contract.tenantName,
        email: contract.tenantEmail,
        phone: contract.tenantPhone,
      },
      contractId: {
        contractCode: contract.contractCode,
        tenantName: contract.tenantName,
        tenantEmail: contract.tenantEmail,
        tenantPhone: contract.tenantPhone,
      },
    },
    {
      _id: `inv-local-${prevYear}${String(prevMonth).padStart(2, "0")}`,
      invoiceCode: `INV-${prevYear}${String(prevMonth).padStart(2, "0")}-${
        roomObj.roomNumber || "107"
      }`,
      month: prevMonth,
      year: prevYear,
      roomPrice: rentPrice,
      oldElectricity: 82,
      newElectricity: 120,
      electricityUsage: prevElecUsage,
      electricityPrice,
      electricityCost: prevElecCost,
      oldWater: 7,
      newWater: 12,
      waterUsage: prevWaterUsage,
      waterPrice,
      waterCost: prevWaterCost,
      serviceFee,
      totalAmount: prevTotal,
      status: "paid",
      paidAt: new Date(prevYear, prevMonth - 1, 8).toISOString(),
      dueDate: new Date(prevYear, prevMonth - 1, 10).toISOString(),
      roomId: contract.roomId,
      tenantId: {
        name: contract.tenantName,
        email: contract.tenantEmail,
        phone: contract.tenantPhone,
      },
      contractId: {
        contractCode: contract.contractCode,
        tenantName: contract.tenantName,
        tenantEmail: contract.tenantEmail,
        tenantPhone: contract.tenantPhone,
      },
    },
  ];

  return { contract, invoices };
};

export const createContractFromBooking = async ({
  room,
  user,
  tenantPhone,
  identityCard,
  startDate,
  durationMonths = 6,
  finalPrice,
  couponCode,
}) => {
  const localBundle = buildContractAndInvoicesBundle({
    room,
    user,
    tenantPhone,
    identityCard,
    startDate,
    durationMonths,
    finalPrice,
  });

  // Lưu ngay local fallback để đảm bảo 100% có dữ liệu tức thì
  if (user?.email) {
    saveLocalTenantContract(user.email, localBundle.contract);
    saveLocalTenantInvoices(user.email, localBundle.invoices);
  }

  // Đồng thời gọi API Backend (nếu server hỗ trợ)
  try {
    const res = await apiRequest("/contracts/self-book", {
      method: "POST",
      body: JSON.stringify({
        roomId: room?._id || room?.id,
        tenantPhone: tenantPhone || user?.phone || "0987654321",
        identityCard: identityCard || "001202034567",
        startDate: startDate || new Date().toISOString().slice(0, 10),
        durationMonths: Number(durationMonths) || 6,
        finalPrice,
        couponCode,
      }),
    });
    if (res?.data?.contract && user?.email) {
      saveLocalTenantContract(user.email, res.data.contract);
    }
    return {
      contract: res?.data?.contract || localBundle.contract,
      fromApi: true,
    };
  } catch {
    return {
      contract: localBundle.contract,
      invoices: localBundle.invoices,
      fromApi: false,
    };
  }
};
