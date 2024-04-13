const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const EventHubReader = require('./scripts/event-hub-reader.js');
const mysql = require('mysql');
const fs = require('fs');

const connection = mysql.createConnection({
  host: 'air-quality.mysql.database.azure.com',
  user: 'air',
  password: 'Ni@78shd',
  database: 'device_telemetry',
  port: 3306, // Default MySQL port
  ssl: {
    ca: fs.readFileSync('DigiCertGlobalRootCA.crt.pem') // Path to SSL CA certificate file
  }
});
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to Azure MySQL:', err);
    return;
  }
  console.log('Connected to Azure MySQL');
});

// Define table schema and create the table
const createTableQuery = `
CREATE TABLE IF NOT EXISTS telemetry (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date TIMESTAMP,
  message TEXT,
  deviceid VARCHAR(255)
)`;

connection.query(createTableQuery, (err, results) => {
  if (err) {
    console.error('Error creating table:', err.message);
  } else {
    console.log('Table created successfully');
  }
});


// const iotHubConnectionString = process.env.IotHubConnectionString;
const iotHubConnectionString = 'HostName=iotAir.azure-devices.net;SharedAccessKeyName=service;SharedAccessKey=bXGUok8EcNhFO4Gphep4pERdqd/t6t5HpAIoTAQ56as=';
if (!iotHubConnectionString) {
  console.error(`Environment variable IotHubConnectionString must be specified.`);
  return;
}
console.log(`Using IoT Hub connection string [${iotHubConnectionString}]`);

// const eventHubConsumerGroup = process.env.EventHubConsumerGroup;
const eventHubConsumerGroup = 'data';

console.log(eventHubConsumerGroup);
if (!eventHubConsumerGroup) {
  console.error(`Environment variable EventHubConsumerGroup must be specified.`);
  return;
}
console.log(`Using event hub consumer group [${eventHubConsumerGroup}]`);

// Redirect requests to the public subdirectory to the root
const app = express();

// API endpoint to retrieve data for the last 7 days
app.get('/last7Days', (req, res) => {
  // Get the current timestamp and calculate the timestamp for 7 days ago
  const curr = new Date();
  const last7T = new Date(curr.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');

  // Define the SQL query to retrieve data for the last 7 days
  const sql = "SELECT * FROM telemetry WHERE date > ?";

  // Execute the query and send the result as response
  connection.query(sql, [last7T], (err, rows) => {
    if (err) {
      console.error('Error querying data:', err.message);
      res.status(500).json({ error: 'An error occurred while fetching data' });
      return;
    }
    res.json(rows);
  });
});

// API endpoint to retrieve data for the last 1 day
app.get('/last1Day', (req, res) => {
  // Get the current timestamp and calculate the timestamp for 1 day ago
  const curr = new Date();
  const last1T = new Date(curr.getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');

  // Define the SQL query to retrieve data for the last 1 day
  const sql = "SELECT * FROM telemetry WHERE date > ?";

  // Execute the query and send the result as response
  connection.query(sql, [last1T], (err, rows) => {
    if (err) {
      console.error('Error querying data:', err.message);
      res.status(500).json({ error: 'An error occurred while fetching data' });
      return;
    }
    res.json(rows);
  });
});



app.use(express.static(path.join(__dirname, 'public')));
app.use((req, res /* , next */) => {
  res.redirect('/');
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.broadcast = (data) => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        console.log(`Broadcasting data ${data}`);
        client.send(data);
      } catch (e) {
        console.error(e);
      }
    }
  });
};

server.listen(process.env.PORT || '3000', () => {
  console.log('Listening on %d.', server.address().port);
});

const eventHubReader = new EventHubReader(iotHubConnectionString, eventHubConsumerGroup);

(async () => {
  await eventHubReader.startReadMessage((message, date, deviceId) => {
    try {
      const payload = {
        IotData: message,
        MessageDate: date || Date.now().toISOString(),
        DeviceId: deviceId,
        Port: server.address().port,
      };

      const data = JSON.stringify(payload);

      // Define the SQL query to insert data into the telemetry table
      const sql = 'INSERT INTO telemetry (date, message, deviceid) VALUES (?, ?, ?)';

      // Execute the query to insert data into the telemetry table
      connection.query(sql, [payload.MessageDate, JSON.stringify(message), deviceId], (err, result) => {
        if (err) {
          console.error('Error inserting JSON data:', err.message);
          return;
        }
        console.log(`JSON data inserted with row id: ${result.insertId}`);
      });


      wss.broadcast(JSON.stringify(payload));
    } catch (err) {
      console.error('Error broadcasting: [%s] from [%s].', err, message);
    }
  });
})().catch();

// // Close the connection when done
process.on('SIGINT', () => {
  connection.end((err) => {
    if (err) {
      console.error('Error closing the database connection:', err.message);
    } else {
      console.log('Connection to the database closed');
    }
    process.exit();
  });
});
