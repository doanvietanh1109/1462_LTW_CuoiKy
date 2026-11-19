import test from "node:test";
import assert from "node:assert/strict";
import { formatRevenueAxisVnd, formatRevenueVnd, getRevenueChartData } from "../src/utils/revenueChart.js";

test("revenue chart uses only real provided records and formats full VND", () => {
  assert.deepEqual(getRevenueChartData([{ label: "11/2026", totalRevenue: 4_100_000 }]), {
    labels: ["11/2026"], values: [4_100_000],
  });
  assert.equal(formatRevenueVnd(4_100_000), "4.100.000 ₫");
});

test("empty or invalid revenue records do not generate placeholder months", () => {
  assert.deepEqual(getRevenueChartData([]), { labels: [], values: [] });
  assert.deepEqual(getRevenueChartData([{ label: "T1", totalRevenue: "invalid" }]), { labels: [], values: [] });
  assert.deepEqual(getRevenueChartData([{ label: "T1", totalRevenue: null }]), { labels: [], values: [] });
});

test("axis formatter keeps large VND ticks readable", () => {
  assert.equal(formatRevenueAxisVnd(4_000_000_000), "4 tỷ");
  assert.equal(formatRevenueAxisVnd(1_500_000), "2 tr");
});
