// (async function () {
  const data = [
    { date: '04/22/2024', volume: 1000, profitLoss: 209.84 },
    { date: '04/23/2024', volume: 0, profitLoss: 0 },
    { date: '04/24/2024', volume: 1500, profitLoss: 246.44 },
    { date: '04/25/2024', volume: 2500, profitLoss: 56.02 },
    { date: '04/26/2024', volume: 2200, profitLoss: -1152.59 },
  ];

  let winCount = 0;
  let lossCount = 0;
  let scratchCount = 0;
  let totalProfit = 0;
  let totalLoss = 0;
  let largestGain = 0;
  let largestLoss = 0;
  
  data.forEach(row => {
    if (row.profitLoss > 0) {
      winCount++;
      totalProfit += row.profitLoss;
      largestGain = Math.max(largestGain, row.profitLoss);
    } else if (row.profitLoss < 0) {
      lossCount++;
      totalLoss += row.profitLoss;
      largestLoss = Math.min(largestLoss, row.profitLoss);
    }
    else { 
      scratchCount++;
    }
  });
  
  let winRate = (winCount / (winCount + lossCount + scratchCount)) * 100;
  let winLossRatio = winCount / lossCount;
  let averageGainPerTrade = totalProfit / winCount;
  let averageLossPerTrade = totalLoss / lossCount;
  
  // populate the table
  document.getElementById('homeWinRate').innerText = winRate.toFixed(2) + '%';
  document.getElementById('homeWinLoss').innerText = winLossRatio.toFixed(2);
  if ((averageGainPerTrade / averageLossPerTrade) >= 0) {
    document.getElementById('homeAverageWinLoss').innerText = '$' + (averageGainPerTrade / averageLossPerTrade).toFixed(2);
  }
  else {
    document.getElementById('homeAverageWinLoss').innerHTML = '-$' + Math.abs((averageGainPerTrade / averageLossPerTrade)).toFixed(2);
  }
  document.getElementById('homeLargestGain').innerText = '$' + largestGain.toFixed(2);
  document.getElementById('homeLargestLoss').innerText = '-$' + Math.abs(largestLoss).toFixed(2);

  const volumeChart = new Chart(
    document.getElementById('volumeChart'),
    {
      type: 'bar',
      options: {
        animation: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            enabled: true,
            position: 'nearest'
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Date'
            }
          },
          y: {
            title: {
              display: true,
              text: 'Volume'
            }
          }
        }
      },
      data: {
        labels: data.map(row => row.date),
        datasets: [
          {
            label: 'Volume by day',
            data: data.map(row => row.volume)
          }
        ]
      }
    }
  );
// })();

// (async function () {
    let profitLossData = data;
  
    // calculate the cumulative P&L
    let cumulativeProfitLoss = 0;
    profitLossData = profitLossData.map(row => {
      cumulativeProfitLoss += row.profitLoss;
      return { date: row.date, profitLoss: cumulativeProfitLoss };
    });
  
    // min/max P&L
    const minProfitLoss = Math.min(...profitLossData.map(row => row.profitLoss));
    const maxProfitLoss = Math.max(...profitLossData.map(row => row.profitLoss));
  
    // create buffer
    const buffer = 0.25;
    const min = Math.min(minProfitLoss - buffer * Math.abs(minProfitLoss), 0);
    const max = maxProfitLoss + buffer * Math.abs(maxProfitLoss);
  
    const profitLossChart = new Chart(
      document.getElementById('profitLossChart'),
      {
        type: 'line',
        options: {
          animation: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              enabled: true,
              position: 'nearest'
            }
          },
          scales: {
            x: {
              title: {
                display: true,
                text: 'Date'
              }
            },
            y: {
              title: {
                display: true,
                text: 'Cumulative Profit/Loss'
              },
              min: min,
              max: max 
            }
          }
        },
        data: {
          labels: profitLossData.map(row => row.date),
          datasets: [
            {
              label: 'Cumulative Profit/Loss by day',
              data: profitLossData.map(row => row.profitLoss),
              fill: false, 
              borderColor: 'rgb(75, 192, 192)', 
              tension: 0.5  // set smoothness
            }
          ]
        }
      }
    );
//   })();
  
  
// calculate the win rate
let winRateData = data;
let runningWinRate = 0;
let runningWinCount = 0;
let runningTradeCount = 0;
winRateData = winRateData.map(row => {
  if (row.profitLoss >= 0) {
    runningWinCount++;
    runningTradeCount++;
  }
  else {
    runningTradeCount++;
  }

  return { date: row.date, winRate:  (runningWinCount / runningTradeCount) * 100 };
});

const winRateChart = new Chart(
  document.getElementById('winRateChart'),
  {
    type: 'line',
    options: {
      animation: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          enabled: true,
          position: 'nearest'
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Date'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Win Rate (%)'
          },
          min: 0,
          suggestedMax: 100
        }
      }
    },
    data: {
      labels: winRateData.map(row => row.date),
      datasets: [
        {
          label: 'Win Rate by day',
          data: winRateData.map(row => row.winRate),
          fill: false, 
          borderColor: 'rgb(75, 192, 192)', 
          tension: 0.5  // set smoothness
        }
      ]
    }
  }
);

