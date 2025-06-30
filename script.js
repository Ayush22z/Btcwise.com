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
    console.log("🔄 Fetching via CORS proxy...");
    const res = await fetch(proxyURL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const grouped = {};
    data.prices.forEach(([ts, price]) => {
      const d = new Date(ts);
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}`;
      grouped[key] = grouped[key] || [];
      grouped[key].push(price);
    });

    btcPrices = Object.entries(grouped).map(([m, arr]) => ({
      month: m,
      price: arr.reduce((a,b)=>a+b)/arr.length
    }));

    console.log("✅ Loaded", btcPrices.length, "months of data");
    calculateBtn.disabled = false;
  } catch (err) {
    console.error("❌ Fetch error:", err);
    alert("Unable to fetch BTC price data. Please try again later.");
  }
}

function calculateSIP() {
  if (!btcPrices.length) {
    return alert("BTC data is still loading...");
  }

  const inr = parseFloat(document.getElementById('sipAmount').value);
  const years = parseInt(document.getElementById('durationYears').value);
  const months = years * 12;
  const usd = inr / fxRateINR;

  if (btcPrices.length < months) {
    return alert("Not enough historical data. Pick shorter duration.");
  }

  let btcTotal = 0, dataPoints = [];
  for (let i = 0; i < months; i++) {
    btcTotal += usd / btcPrices[i].price;
    dataPoints.push(Math.round(btcTotal * btcPrices[btcPrices.length-1].price * fxRateINR));
  }

  document.getElementById('invested').textContent = (inr * months).toLocaleString();
  document.getElementById('finalValue').textContent = Math.round(btcTotal * btcPrices[btcPrices.length-1].price * fxRateINR).toLocaleString();

  drawChart(dataPoints);
}

let chart;
function drawChart(data) {
  const ctx = document.getElementById('sipChart').getContext('2d');
  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.map((_, i) => `M${i+1}`),
      datasets: [{ label: 'Value (₹)', data, borderColor: '#4f46e5', fill: false, tension: 0.3 }]
    },
    options: {
      scales: {
        y: { ticks: { callback: v => '₹' + v.toLocaleString() } }
      }
    }
  });
}

document.querySelector("button").addEventListener("click", calculateSIP);
fetchBTCPrices();
