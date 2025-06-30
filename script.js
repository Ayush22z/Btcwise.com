// Placeholder CAGR data
const CAGR = {
  btc: 0.72, // 72%
  eth: 0.85  // 85%
};

function calculateSIP() {
  const amount = parseFloat(document.getElementById('sipAmount').value);
  const years = parseInt(document.getElementById('durationYears').value);
  const coin = document.getElementById('coin').value;
  const months = years * 12;
  const rate = CAGR[coin] / 12; // Monthly CAGR estimate

  let futureValue = 0;
  let dataPoints = [];
  for (let i = 1; i <= months; i++) {
    futureValue = (futureValue + amount) * (1 + rate);
    dataPoints.push(Math.round(futureValue));
  }

  const invested = amount * months;

  // Show result
  document.getElementById('invested').textContent = invested.toLocaleString();
  document.getElementById('finalValue').textContent = futureValue.toLocaleString();

  // Draw chart
  drawChart(dataPoints);
}

let chart;
function drawChart(data) {
  const ctx = document.getElementById('sipChart').getContext('2d');
  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.map((_, i) => `Month ${i + 1}`),
      datasets: [{
        label: 'SIP Value',
        data: data,
        borderColor: '#4f46e5',
        fill: false,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          ticks: {
            callback: (value) => '₹' + value.toLocaleString()
          }
        }
      }
    }
  });
}
