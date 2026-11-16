// Run manually against a verified database after taking a backup.
// This script is intentionally never invoked by application startup or tests.
require("dotenv").config();
const mongoose = require("mongoose");

const COLLECTIONS = [
  { name: "invoices", old: "roomId_1_month_1_year", next: "uniq_invoice_room_period_contract", keys: { roomId: 1, month: 1, year: 1, contractId: 1 } },
  { name: "meterreadings", old: "roomId_1_month_1_year", next: "uniq_meter_room_period_contract", keys: { roomId: 1, month: 1, year: 1, contractId: 1 } },
];

async function migrate() {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is required; no database was selected.");
  await mongoose.connect(process.env.MONGO_URI, { autoIndex: false });
  try {
    for (const definition of COLLECTIONS) {
      const collection = mongoose.connection.collection(definition.name);
      const duplicates = await collection.aggregate([
        { $group: { _id: { roomId: "$roomId", month: "$month", year: "$year", contractId: "$contractId" }, count: { $sum: 1 } } },
        { $match: { count: { $gt: 1 } } },
        { $limit: 1 },
      ]).toArray();
      if (duplicates.length) throw new Error(`Duplicate contract-period records exist in ${definition.name}; migration stopped before index changes.`);
      const existing = await collection.indexes();
      if (!existing.some((index) => index.name === definition.next)) {
        await collection.createIndex(definition.keys, { unique: true, name: definition.next });
      }
      if (existing.some((index) => index.name === definition.old)) await collection.dropIndex(definition.old);
    }
  } finally {
    await mongoose.disconnect();
  }
}

migrate().catch((error) => {
  console.error(`Contract-period index migration stopped: ${error.message}`);
  process.exitCode = 1;
});
