console.log("getting it");
(async function () {
  // Assuming you have the volume data for the past week (excluding weekends)
  const data = [
    { date: 'Monday', volume: 1000 },
    { date: 'Tuesday', volume: 0 },
    { date: 'Wednesday', volume: 1500 },
    { date: 'Thursday', volume: 2500 },
    { date: 'Friday', volume: 2200 },
  ];

  new Chart(
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
            enabled: false
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
})();