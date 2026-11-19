import React, { useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";
import { formatRevenueVnd, getRevenueChartData, formatRevenueAxisVnd } from "../../utils/revenueChart";

Chart.register(...registerables);

export const RevenueChart = ({ monthlyRevenue = [] }) => {
  const canvasRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const chartData = getRevenueChartData(monthlyRevenue);

  useEffect(() => {
    if (!canvasRef.current || chartData.labels.length === 0) return undefined;

    chartInstanceRef.current?.destroy();
    chartInstanceRef.current = new Chart(canvasRef.current.getContext("2d"), {
      type: "line",
      data: {
        labels: chartData.labels,
        datasets: [{
          label: "Doanh thu đã thu",
          data: chartData.values,
          borderColor: "#15803D",
          backgroundColor: "rgba(21, 128, 61, 0.12)",
          pointBackgroundColor: "#15803D",
          pointBorderColor: "#ffffff",
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          borderWidth: 3,
          tension: 0.28,
          fill: true,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: (items) => items[0]?.label || "",
              label: (item) => `Doanh thu: ${formatRevenueVnd(item.parsed.y)}`,
            },
          },
        },
        scales: {
          x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: true } },
          y: {
            beginAtZero: true,
            grid: { color: "rgba(15, 23, 42, 0.08)" },
            ticks: { callback: (value) => formatRevenueAxisVnd(value) },
          },
        },
      },
    });

    return () => {
      chartInstanceRef.current?.destroy();
      chartInstanceRef.current = null;
    };
  }, [chartData.labels, chartData.values]);

  if (!chartData.labels.length) {
    return <div className="revenue-chart-state" role="status">Chưa có dữ liệu doanh thu đã thanh toán.</div>;
  }

  return (
    <div>
      <div className="revenue-chart-wrap">
        <canvas ref={canvasRef} role="img" aria-label="Biểu đồ đường doanh thu đã thu theo tháng" />
      </div>
      {chartData.labels.length === 1 && (
        <p className="text-muted small mb-0 mt-2">Hiện chỉ có một tháng dữ liệu, chưa đủ để xác định xu hướng.</p>
      )}
    </div>
  );
};
