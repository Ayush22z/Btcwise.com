let btcPrices = [];
let fxRateINR = 86; // Static INR to USD rate (can be made dynamic later)
const calculateBtn = document.querySelector("button");
calculateBtn.disabled = true; // Disable until BTC prices are fetched

async function fetchBTCPrices() {
  try {
    const from = Math.floor(new Date('2014-01-01').getTime() / 1000);
    const to = Math.floor(Date.now() / 1000);
    const url = `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart/range?vs_currency=usd&from=${from}&to=${to}`;

    const res = await fetch(url, {
      headers: {
        'accept': 'application/json'
      }
    });

    if (!res.ok) {
      throw new Error(`Fetch failed with status: ${res.status}`);
    }

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

    console.log("✅ BTC monthly price data loaded:", btcPrices);
    calculateBtn.disabled = false;
  } catch (error) {
    console.error("❌ Failed to load BTC price data:", error);
    alert("Unable to fetch BTC price data. Please try again later.");
  }
}

async function calculateSIP() {
  if (btcPrices.length === 0) {
    alert("⚠️ BTC data is still loading. Please wait a few seconds.");
    return;
  }

  const inr = parseFloat(document.getElementById('sipAmount').value);
  const years = parseInt(document.getElementById('durationYears').value);
  const months = years * 12;
  const usd = inr / fxRateINR;

  if (btcPrices.length < months) {
    alert("Not enough BTC history. Try a shorter duration.");
    return;
  }

  let btcTotal = 0;
  const dataPoints = [];

  for (let i = 0; i < months; i++) {
    const btcPrice = btcPrices[i].price;
    const btcBought = usd / btcPrice;
    btcTotal += btcBought;

    const valueINR = btcTotal * btcPrices[btcPrices.length - 1].price * fxRateINR;
    dataPoints.push(Math.round(valueINR));
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

// Start fetching BTC prices on load
fetchBTCPrices();
