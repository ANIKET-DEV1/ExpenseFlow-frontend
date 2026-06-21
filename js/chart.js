// js/chart.js
let myChart = null;

export function renderAnalyticsChart(canvasId, expenses) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  // Process data: group expenses by month for the last 6 months
  const now = new Date();
  const months = [];
  const monthData = {};

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleString("en-US", { month: "short", year: "numeric" });
    months.push(label);
    monthData[label] = 0;
  }

  expenses.forEach(e => {
    const d = new Date(e.expense_date);
    if (!isNaN(d.getTime())) {
      const label = d.toLocaleString("en-US", { month: "short", year: "numeric" });
      if (label in monthData) {
        monthData[label] += Number(e.amount || 0);
      }
    }
  });

  const labels = months;
  const dataValues = months.map(m => monthData[m]);

  const ctx = canvas.getContext("2d");
  if (myChart) {
    myChart.destroy();
  }

  const isLight = document.body.classList.contains("light-mode");
  const textColor = isLight ? "#475569" : "#eae5db";
  const gridColor = isLight ? "rgba(15, 23, 42, 0.06)" : "rgba(255, 255, 255, 0.06)";
  const accentColor = "#d4a24c"; // Gold

  // Gradient fill for area chart
  const gradient = ctx.createLinearGradient(0, 0, 0, 260);
  if (isLight) {
    gradient.addColorStop(0, "rgba(212, 162, 76, 0.22)");
    gradient.addColorStop(1, "rgba(212, 162, 76, 0.00)");
  } else {
    gradient.addColorStop(0, "rgba(212, 162, 76, 0.18)");
    gradient.addColorStop(1, "rgba(212, 162, 76, 0.00)");
  }

  // Create chart instance
  myChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: "Spending",
        data: dataValues,
        borderColor: accentColor,
        borderWidth: 3,
        backgroundColor: gradient,
        fill: true,
        tension: 0.35,
        pointBackgroundColor: accentColor,
        pointBorderColor: isLight ? "#ffffff" : "#0f1420",
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: isLight ? "#ffffff" : "#161c29",
          titleColor: isLight ? "#0f172a" : "#eae5db",
          bodyColor: isLight ? "#475569" : "#eae5db",
          borderColor: "rgba(212, 162, 76, 0.3)",
          borderWidth: 1,
          padding: 10,
          cornerRadius: 6,
          displayColors: false,
          callbacks: {
            label: function(context) {
              const val = context.parsed.y;
              return "Spent: ₹" + val.toLocaleString("en-IN", { minimumFractionDigits: 2 });
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            color: gridColor,
            drawBorder: false
          },
          ticks: {
            color: textColor,
            font: {
              family: "'JetBrains Mono', monospace",
              size: 10
            }
          }
        },
        y: {
          grid: {
            color: gridColor,
            drawBorder: false
          },
          ticks: {
            color: textColor,
            font: {
              family: "'JetBrains Mono', monospace",
              size: 10
            },
            callback: function(value) {
              return "₹" + value.toLocaleString("en-IN", { maximumFractionDigits: 0 });
            }
          }
        }
      }
    }
  });
}
