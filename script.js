let btcPrices = [];
let fxRateINR = 83;
const calculateBtn = document.querySelector("button");
calculateBtn.disabled = true;

async function fetchBTCPrices() {
  const from = Math.floor(new Date('2014-01-01').getTime() / 1000);
  const to = Math.floor(Date.now() / 1000);
  const targetURL = `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart/range?vs_currency=usd&from=${from}&to=${to}`;
  const proxyURL = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetURL)}`;

  try {
    console.log("🔄 Fetching BTC data from CoinGecko via proxy...");
    const res = await fetch(proxyURL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    const dailyPrices = data.prices;

    const grouped = {};
    dailyPrices.forEach(([ts, price]) => {
      const date = new Date(ts);
      const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(price);
    });

    btcPrices = Object.entries(grouped).map(([month, prices]) => ({
      month,
      price: prices.reduce((a, b) => a + b) / prices.length
    }));

    console.log("✅ BTC monthly prices loaded:", btcPrices.length, "months");
    calculateBtn.disabled = false;
  } catch (err) {
    console.error("❌ Failed to fetch BTC prices:", err);
    alert("Unable to fetch BTC price data. Please try again later.");
  }
}

async function calculateSIP() {
  if (btcPrices.length === 0) {
    alert("BTC price data not ready. Please wait.");
    return;
  }

  const inr = parseFloat(document.getElementById('sipAmount').value);
  const years = parseInt(document.getElementById('durationYears').value);
  const months = years * 12;
  const usd = inr / fxRateINR;

  if (btcPrices.length < months) {
    alert("Insufficient BTC data for the selected duration.");
    return;
  }

  let btcTotal = 0;
  const dataPoints = [];

  for (let i = 0; i < months; i++) {
    const btcPrice = btcPrices[i].price;
    const btcBought = usd / btcPrice;
    btcTotal += btcBought;

    const currentValueINR = btcTotal * btcPrices[btcPrices.length - 1].price * fxRateINR;
    dataPoints.push(Math.round(currentValueINR));
  }

  const invested = inr * months;
  const finalValue = btcTotal * btcPrices[btcPrices.length - 1].price * fxRateINR;

  document.getElementById('invested').textContent = invested.toLocaleString();
  document.getElementById('finalValue').textContent = Math.round(finalValue).toLocaleString();

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
        label: 'SIP Portfolio Value (₹)',
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

fetchBTCPrices();
