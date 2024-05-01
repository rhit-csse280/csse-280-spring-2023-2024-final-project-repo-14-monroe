// (async function () {
  const volumeData = [
    { date: '04/22/2024', volume: 1000 },
    { date: '04/23/2024', volume: 0 },
    { date: '04/24/2024', volume: 1500 },
    { date: '04/25/2024', volume: 2500 },
    { date: '04/26/2024', volume: 2200 },
  ];

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
        labels: volumeData.map(row => row.date),
        datasets: [
          {
            label: 'Volume by day',
            data: volumeData.map(row => row.volume)
          }
        ]
      }
    }
  );
// })();

// (async function () {
    let profitLossData = [
      { date: '04/22/2024', profitLoss: 200 },
      { date: '04/23/2024', profitLoss: -100 },
      { date: '04/24/2024', profitLoss: 300 },
      { date: '04/25/2024', profitLoss: -50 },
      { date: '04/26/2024', profitLoss: 150 },
    ];
  
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
  
  