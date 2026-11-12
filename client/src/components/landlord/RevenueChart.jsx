import React, { useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

// Biểu đồ doanh thu 12 tháng từ Aggregation Pipeline (sử dụng useRef + useEffect có cleanup)
export const RevenueChart = ({ monthlyRevenue = [] }) => {
  const canvasRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return undefined;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const labels =
      monthlyRevenue.length > 0
        ? monthlyRevenue.map((item) => item.label)
        : ["T1", "T2", "T3", "T4", "T5", "T6"];

    const values =
      monthlyRevenue.length > 0
        ? monthlyRevenue.map((item) => item.totalRevenue)
        : [0, 0, 0, 0, 0, 0];

    const ctx = canvasRef.current.getContext("2d");
    chartInstanceRef.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Doanh thu đã thu (VNĐ)",
            data: values,
            backgroundColor: "rgba(37, 99, 235, 0.75)",
            borderColor: "#1d4ed8",
            borderWidth: 1,
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "top" },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (val) => `${Number(val).toLocaleString("vi-VN")} đ`,
            },
          },
        },
      },
    });

    // Cleanup hủy instance Chart khi unmount hoặc dữ liệu thay đổi
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [monthlyRevenue]);

  return (
    <div style={{ height: "300px", width: "100%" }}>
      <canvas ref={canvasRef} />
    </div>
  );
};
