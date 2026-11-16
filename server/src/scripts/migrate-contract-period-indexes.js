// Run manually against a verified database after taking a backup.
// This script is intentionally never invoked by application startup or tests.
require("dotenv").config();
const mongoose = require("mongoose");

const COLLECTIONS = [
  { name: "invoices", legacyUniqueKeyPatterns: [{ roomId: 1, month: 1, year: 1 }, { roomId: 1, billingMonth: 1 }], next: "uniq_invoice_room_period_contract", keys: { roomId: 1, month: 1, year: 1, contractId: 1 } },
  { name: "meterreadings", legacyUniqueKeyPatterns: [{ roomId: 1, month: 1, year: 1 }], next: "uniq_meter_room_period_contract", keys: { roomId: 1, month: 1, year: 1, contractId: 1 } },
];

const matchesLegacyUniqueIndex = (index, patterns) => index.unique && patterns.some((keys) => JSON.stringify(index.key) === JSON.stringify(keys));

async function migrate() {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is required; no database was selected.");
  await mongoose.connect(process.env.MONGO_URI, { autoIndex: false });
  try {
    const plans = [];
    for (const definition of COLLECTIONS) {
      const collection = mongoose.connection.collection(definition.name);
      const duplicates = await collection.aggregate([
        { $group: { _id: { roomId: "$roomId", month: "$month", year: "$year", contractId: "$contractId" }, count: { $sum: 1 } } },
        { $match: { count: { $gt: 1 } } },
        { $limit: 1 },
      ]).toArray();
      if (duplicates.length) throw new Error(`Duplicate contract-period records exist in ${definition.name}; migration stopped before index changes.`);
      const existing = await collection.indexes();
      const replacement = existing.find((index) => index.name === definition.next);
      if (replacement && (!replacement.unique || JSON.stringify(replacement.key) !== JSON.stringify(definition.keys))) {
        throw new Error(`An index named ${definition.next} exists with unexpected keys; migration stopped before changes.`);
      }
      const legacyIndexes = existing.filter((index) => matchesLegacyUniqueIndex(index, definition.legacyUniqueKeyPatterns));
      plans.push({ ...definition, collection, existing, legacyIndexes });
    }

    // Preflight both collections and create both new keys before removing either old key.
    for (const plan of plans) {
      if (!plan.existing.some((index) => index.name === plan.next)) {
        await plan.collection.createIndex(plan.keys, { unique: true, name: plan.next });
      }
    }
    for (const plan of plans) {
      for (const legacy of plan.legacyIndexes) await plan.collection.dropIndex(legacy.name);
    }
    for (const plan of plans) {
      const indexes = await plan.collection.indexes();
      if (!indexes.some((index) => index.name === plan.next && index.unique && JSON.stringify(index.key) === JSON.stringify(plan.keys))) {
        throw new Error(`Replacement unique index was not confirmed for ${plan.name}.`);
      }
      if (indexes.some((index) => matchesLegacyUniqueIndex(index, plan.legacyUniqueKeyPatterns))) {
        throw new Error(`Legacy index remains on ${plan.name}; inspect the index state and rerun after resolving it.`);
      }
    }
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  migrate().catch((error) => {
    console.error(`Contract-period index migration stopped: ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = { COLLECTIONS, matchesLegacyUniqueIndex, migrate };
