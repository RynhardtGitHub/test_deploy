const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app); 
const { Server } = require("socket.io");
const io = new Server(server);
const port = 8080;

const cors = require('cors');
app.use(cors()); 

// Game State
const players = {};
let ballPosition = { x: 0, y: 0 };
let ballVelocity = { x: 0, y: 0 };

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Socket.IO Handling
io.on('connection', (socket) => {
    const playerId = socket.id; 
    console.log(`New user connected. Current list: ${players[0]}`);
  
    // Initialize player data
    players[playerId] = {
        socket: socket, // Reference to socket
        ballPosition: { x: 0, y: 0 }, // Initial position (adjust)
        ballVelocity: { x: 0, y: 0 }
    };

    // Immediately send initial data
    socket.emit('initialUpdate', { 
        message: 'Welcome to the game!',
        ballPosition: players[playerId].ballPosition 
    });

    socket.on('sensorData', (data) => {
    // console.log('Sensor data received by server. ' + data.x + ' ' + data.y + ' ' + data.z);

    const updatedBallPosition = simulateBallPhysics(
        players[playerId].ballPosition,
        players[playerId].ballVelocity,
        data
    );
  
    // Update player's position in the players object
    players[playerId].ballPosition = updatedBallPosition;

    // Notify player of update
    io.emit("ballUpdate", { 
        playerId: playerId, 
        ballPosition: updatedBallPosition 
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', playerId);
    delete players[playerId];
  });
});

// Start the server
server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

// Physics Parameters
const gravity = 0.1;
const friction = 0.98;
const forceScaler = 2;
function simulateBallPhysics(ballPosition, ballVelocity, sensorData) {
    // console.log(`Sensor data: ${sensorData.x}, ${sensorData.y}, ${sensorData.z}`);
  
    // Use the correct properties from sensorData
    const accelForceX = (sensorData.x / 10) * forceScaler;
    const accelForceY = (sensorData.y / 10) * forceScaler;
  
    // console.log(`Accel: ${accelForceX}, ${accelForceY}`);
  
    // Update velocity based on forces and gravity
    ballVelocity.x += accelForceX - (ballVelocity.x * friction);
    ballVelocity.y += accelForceY + gravity - (ballVelocity.y * friction);
  
    // console.log(`Velocity: ${ballVelocity.x}, ${ballVelocity.y}`);
  
    // Update position based on velocity
    ballPosition.x += ballVelocity.x;
    ballPosition.y += ballVelocity.y;
  
    // console.log(`New ball position: ${ballPosition.x}, ${ballPosition.y}`);
    return ballPosition;
  }