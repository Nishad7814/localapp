/* eslint-disable max-classes-per-file */
/* eslint-disable no-restricted-globals */
/* eslint-disable no-undef */

class Last7Days {
  constructor(data) {
    // Process the rows (convert date strings to JavaScript Date objects)
    this.dates = data.map(row => row.date);
    this.temperature = data.map(row => JSON.parse(row.message).temperature);
    this.humidity = data.map(row => JSON.parse(row.message).humidity);

    this.co = data.map(row => JSON.parse(row.message).co);
    this.alcohol = data.map(row => JSON.parse(row.message).alcohol);
    this.co2 = data.map(row => JSON.parse(row.message).co2);
    this.toluene = data.map(row => JSON.parse(row.message).toluene);
    this.nh4 = data.map(row => JSON.parse(row.message).nh4);
    this.acetone = data.map(row => JSON.parse(row.message).acetone);
  }
}

class Last1Day {
  constructor(data) {
    // Process the rows (convert date strings to JavaScript Date objects)
    this.dates = data.map(row => row.date);
    this.temperature = data.map(row => JSON.parse(row.message).temperature);
    this.humidity = data.map(row => JSON.parse(row.message).humidity);

    this.co = data.map(row => JSON.parse(row.message).co);
    this.alcohol = data.map(row => JSON.parse(row.message).alcohol);
    this.co2 = data.map(row => JSON.parse(row.message).co2);
    this.toluene = data.map(row => JSON.parse(row.message).toluene);
    this.nh4 = data.map(row => JSON.parse(row.message).nh4);
    this.acetone = data.map(row => JSON.parse(row.message).acetone);
  }
}

$(document).ready(() => {
  // if deployed to a site supporting SSL, use wss://
  const protocol = document.location.protocol.startsWith('https') ? 'wss://' : 'ws://';
  const webSocket = new WebSocket(protocol + location.host);

  // A class for holding the last N points of telemetry for a device
  class DeviceData {
    constructor(deviceId) {
      this.deviceId = deviceId;
      this.maxLen = 50;
      this.timeData = new Array(this.maxLen);
      this.temperatureData = new Array(this.maxLen);
      this.humidityData = new Array(this.maxLen);

      this.co = new Array(this.maxLen);
      this.alcohol = new Array(this.maxLen);
      this.co2 = new Array(this.maxLen);
      this.toluene = new Array(this.maxLen);
      this.nh4 = new Array(this.maxLen);
      this.acetone = new Array(this.maxLen);
    }

    addData(time, temperature, humidity, co, alcohol, co2, toluene, nh4, acetone) {
      this.timeData.push(time);
      this.temperatureData.push(temperature);
      this.humidityData.push(humidity || null);
      this.co.push(co || null);
      this.alcohol.push(alcohol || null);
      this.co2.push(co2 || null);
      this.toluene.push(toluene || null);
      this.nh4.push(nh4 || null);
      this.acetone.push(acetone || null);

      if (this.timeData.length > this.maxLen) {
        this.timeData.shift();
        this.temperatureData.shift();
        this.humidityData.shift();
        this.co.shift();
        this.alcohol.shift();
        this.co2.shift();
        this.toluene.shift();
        this.nh4.shift();
        this.acetone.shift();
      }
    }
  }

  // All the devices in the list (those that have been sending telemetry)
  class TrackedDevices {
    constructor() {
      this.devices = [];
    }

    // Find a device based on its Id
    findDevice(deviceId) {
      for (let i = 0; i < this.devices.length; ++i) {
        if (this.devices[i].deviceId === deviceId) {
          return this.devices[i];
        }
      }

      return undefined;
    }

    getDevicesCount() {
      return this.devices.length;
    }
  }

  var last1 = null;
  var last7 = null;
  const trackedDevices = new TrackedDevices();

  // Define the chart axes
  const chartData1 = {
    datasets: [
      {
        fill: false,
        label: 'Temperature',
        yAxisID: 'Temperature',
        borderColor: 'rgba(255, 204, 0, 1)',
        pointBoarderColor: 'rgba(255, 204, 0, 1)',
        backgroundColor: 'rgba(255, 204, 0, 0.4)',
        pointHoverBackgroundColor: 'rgba(255, 204, 0, 1)',
        pointHoverBorderColor: 'rgba(255, 204, 0, 1)',
        spanGaps: true,
      },
      {
        fill: false,
        label: 'Humidity',
        yAxisID: 'Humidity',
        borderColor: 'rgba(24, 120, 240, 1)',
        pointBoarderColor: 'rgba(24, 120, 240, 1)',
        backgroundColor: 'rgba(24, 120, 240, 0.4)',
        pointHoverBackgroundColor: 'rgba(24, 120, 240, 1)',
        pointHoverBorderColor: 'rgba(24, 120, 240, 1)',
        spanGaps: true,
      }
    ]
  };

  const chartData2 = {
    datasets: [
      {
        fill: false,
        label: 'Carbon Monooxide',
        yAxisID: 'Gas Concentration',
        borderColor: 'rgba(228, 8, 10, 1)',
        pointBoarderColor: 'rgba(228, 8, 10, 1)',
        backgroundColor: 'rgba(228, 8, 10, 0.4)',
        pointHoverBackgroundColor: 'rgba(228, 8, 10, 1)',
        pointHoverBorderColor: 'rgba(228, 8, 10, 1)',
        spanGaps: true,
      },
      {
        fill: false,
        label: 'Alcohol',
        yAxisID: 'Gas Concentration',
        borderColor: 'rgba(93, 226, 231 1)',
        pointBoarderColor: 'rgba(93, 226, 231 1)',
        backgroundColor: 'rgba(93, 226, 231 0.4)',
        pointHoverBackgroundColor: 'rgba(93, 226, 231 1)',
        pointHoverBorderColor: 'rgba(93, 226, 231 1)',
        spanGaps: true,
      },
      {
        fill: false,
        label: 'Carbon Dioxide',
        yAxisID: 'Gas Concentration',
        borderColor: 'rgba(141, 111, 100, 1)',
        pointBoarderColor: 'rgba(141, 111, 100, 1)',
        backgroundColor: 'rgba(141, 111, 100, 0.4)',
        pointHoverBackgroundColor: 'rgba(141, 111, 100, 1)',
        pointHoverBorderColor: 'rgba(141, 111, 100, 1)',
        spanGaps: true,
      },
      {
        fill: false,
        label: 'Toluene',
        yAxisID: 'Gas Concentration',
        borderColor: 'rgba(204, 108, 231, 1)',
        pointBoarderColor: 'rgba(204, 108, 231, 1)',
        backgroundColor: 'rgba(204, 108, 231, 0.4)',
        pointHoverBackgroundColor: 'rgba(204, 108, 231, 1)',
        pointHoverBorderColor: 'rgba(204, 108, 231, 1)',
        spanGaps: true,
      },
      {
        fill: false,
        label: 'Ammonium',
        yAxisID: 'Gas Concentration',
        borderColor: 'rgba(0, 200, 0, 1)',
        pointBoarderColor: 'rgba(0, 200, 0, 1)',
        backgroundColor: 'rgba(0, 200, 0, 0.4)',
        pointHoverBackgroundColor: 'rgba(0, 200, 0, 1)',
        pointHoverBorderColor: 'rgba(0, 200, 0, 1)',
        spanGaps: true,
      }
      ,
      {
        fill: false,
        label: 'Acetone',
        yAxisID: 'Gas Concentration',
        borderColor: 'rgba(255, 236, 161, 1)',
        pointBoarderColor: 'rgba(255, 236, 161, 1)',
        backgroundColor: 'rgba(255, 236, 161, 0.4)',
        pointHoverBackgroundColor: 'rgba(255, 236, 161, 1)',
        pointHoverBorderColor: 'rgba(255, 236, 161, 1)',
        spanGaps: true,
      }
    ]
  };

  const chartOptions1 = {
    scales: {
      yAxes: [{
        id: 'Temperature',
        type: 'linear',
        scaleLabel: {
          labelString: 'Temperature (ºC)',
          display: true,
        },
        position: 'left',
        ticks: {
          suggestedMin: 0,
          suggestedMax: 100,
          beginAtZero: true
        }
      },
      {
        id: 'Humidity',
        type: 'linear',
        scaleLabel: {
          labelString: 'Humidity (%)',
          display: true,
        },
        position: 'right',
        ticks: {
          suggestedMin: 0,
          suggestedMax: 100,
          beginAtZero: true
        }
      }]
    },
    responsive: true,
    maintainAspectRatio: false,
  };

  const chartOptions2 = {
    scales: {
      yAxes: [{
        id: 'Gas Concentration',
        type: 'linear',
        scaleLabel: {
          labelString: 'ppm',
          display: true,
        },
        position: 'left',
        ticks: {
          suggestedMin: 0,
          suggestedMax: 100,
          beginAtZero: true
        }
      }]
    },
    responsive: true,
    maintainAspectRatio: false,
  };

  // Get the context of the canvas element we want to select
  const ctx1 = document.getElementById('iotChart1').getContext('2d');
  const ctx2 = document.getElementById('iotChart2').getContext('2d');

  const myLineChart1 = new Chart(
    ctx1,
    {
      type: 'line',
      data: chartData1,
      options: chartOptions1,
    });

  const myLineChart2 = new Chart(
    ctx2,
    {
      type: 'line',
      data: chartData2,
      options: chartOptions2,
    });

  myLineChart1.canvas.parentNode.style.height = '30vw';
  myLineChart1.canvas.parentNode.style.width = '45vw';
  myLineChart2.canvas.parentNode.style.height = '30vw';
  myLineChart2.canvas.parentNode.style.width = '45vw';

  let realTime = true;
  let selectedOption = 'realTime';
  const dataOption = $('#dataOption');

  var port = 3000;
  // Event listener for dropdown change
  dataOption.on('change', function () {

    selectedOption = $(this).val();

    if (selectedOption === 'realTime') {
      realTime = true;
    } else {
      realTime = false;

      // Fetch last 7 days data from the server using fetch API
      fetch('http://localhost:'+port+'/last7Days')
        .then(response => response.json())
        .then(data => {
          console.log('Last 7 Days Data:', data);
          // Do something with the last 7 days data received from the API
          last7 = new Last7Days(data);
          OnSelectionChange();
        })
        .catch(error => console.error('Error fetching data:', error));

      // Fetch last 1 day data from the server using fetch API
      fetch('http://localhost:'+port+'/last1Day')
        .then(response => response.json())
        .then(data => {
          // console.log('Last 7 Days Data:', data);
          // Do something with the last 7 days data received from the API
          last1 = new Last1Day(data);
          OnSelectionChange();
        })
        .catch(error => console.error('Error fetching data:', error));
    }
  });

  // Manage a list of devices in the UI, and update which device data the chart is showing
  // based on selection
  let needsAutoSelect = true;
  const deviceCount = document.getElementById('deviceCount');
  const listOfDevices = document.getElementById('listOfDevices');
  function OnSelectionChange() {
    const device = trackedDevices.findDevice(listOfDevices[listOfDevices.selectedIndex].text);

    if (realTime) {
      chartData1.labels = device.timeData;
      chartData1.datasets[0].data = device.temperatureData;
      chartData1.datasets[1].data = device.humidityData;

      chartData2.labels = device.timeData;
      chartData2.datasets[0].data = device.co;
      chartData2.datasets[1].data = device.alcohol;
      chartData2.datasets[2].data = device.co2;
      chartData2.datasets[3].data = device.toluene;
      chartData2.datasets[4].data = device.nh4;
      chartData2.datasets[5].data = device.acetone;

    }
    else if (selectedOption === 'last7Days') {
      chartData1.labels = last7.dates;
      chartData1.datasets[0].data = last7.temperature;
      chartData1.datasets[1].data = last7.humidity;

      chartData2.labels = last7.dates;
      chartData2.datasets[0].data = last7.co;
      chartData2.datasets[1].data = last7.alcohol;
      chartData2.datasets[2].data = last7.co2;
      chartData2.datasets[3].data = last7.toluene;
      chartData2.datasets[4].data = last7.nh4;
      chartData2.datasets[5].data = last7.acetone;
    }

    else if (selectedOption === 'last1Day') {
      chartData1.labels = last1.dates;
      chartData1.datasets[0].data = last1.temperature;
      chartData1.datasets[1].data = last1.humidity;

      chartData2.labels = last1.dates;
      chartData2.datasets[0].data = last1.co;
      chartData2.datasets[1].data = last1.alcohol;
      chartData2.datasets[2].data = last1.co2;
      chartData2.datasets[3].data = last1.toluene;
      chartData2.datasets[4].data = last1.nh4;
      chartData2.datasets[5].data = last1.acetone;
    }


    myLineChart1.update();
    myLineChart2.update();

  }
  listOfDevices.addEventListener('change', OnSelectionChange, false);

  // When a web socket message arrives:
  // 1. Unpack it
  // 2. Validate it has date/time and temperature
  // 3. Find or create a cached device to hold the telemetry data
  // 4. Append the telemetry data
  // 5. Update the chart UI
  webSocket.onmessage = function onMessage(message) {
    try {
      const messageData = JSON.parse(message.data);
      console.log(messageData);
      var msg = messageData.IotData;
      port = messageData.Port;

      // find or add device to list of tracked devices
      const existingDeviceData = trackedDevices.findDevice(messageData.DeviceId);

      if (existingDeviceData) {
        existingDeviceData.addData(messageData.MessageDate, msg.temperature, msg.humidity, msg.co, msg.alcohol,
                                  msg.co2, msg.toluene, msg.nh4, msg.acetone);
        console.log(existingDeviceData.mq135data);
      } else {
        const newDeviceData = new DeviceData(messageData.DeviceId);
        trackedDevices.devices.push(newDeviceData);
        const numDevices = trackedDevices.getDevicesCount();
        deviceCount.innerText = numDevices === 1 ? `${numDevices} device` : `${numDevices} devices`;
        newDeviceData.addData(messageData.MessageDate, msg.temperature, msg.humidity, msg.co, msg.alcohol,
                              msg.co2, msg.toluene, msg.nh4, msg.acetone);

        // add device to the UI list
        const node = document.createElement('option');
        const nodeText = document.createTextNode(messageData.DeviceId);
        node.appendChild(nodeText);
        listOfDevices.appendChild(node);

        // if this is the first device being discovered, auto-select it
        if (needsAutoSelect) {
          needsAutoSelect = false;
          listOfDevices.selectedIndex = 0;
          OnSelectionChange();
        }
      }
      OnSelectionChange();
    } catch (err) {
      console.error(err);
    }
  };
});
