const express = require('express');
const socketIO = require('socket.io');

const PORT = process.env.PORT || 3000;
const INDEX = '/index.html';
const app = express();
app.set("view engine","ejs");
var bodyParser = require("body-parser");
app.use(express.static("public"))
app.use(bodyParser.urlencoded({extended: true}));
const server = app.listen(PORT, () => console.log(`Listening on ${PORT}`));

const io = socketIO(server);
var clientList = {}

io.sockets.on("error", e => console.log(e));
io.on('connection', (socket) => {
    console.log('Client connected');
    socket.on('room number', (paramList) => {
        roomNumber = paramList.roomNumber;
        console.log("Socket with id "+socket.id+" connected to room number "+roomNumber);
        if(String(roomNumber) in clientList){
            for(let i = 0; i<clientList[String(roomNumber)].length;i++){
                if(clientList[String(roomNumber)][i] != socket.id){
                socket.to(clientList[String(roomNumber)][i]).emit("new member",socket.id);
                }
            }
        }

        socket.join(String(roomNumber));
        if(String(roomNumber) in clientList){
            clientList[String(roomNumber)].push(socket.id);
        }
        else{
            clientList[String(roomNumber)] = [socket.id];
        }
        console.log(clientList)
        });

    socket.on('disconnecting', () => {
        let currentRoom = Object.keys(io.sockets.adapter.sids[socket.id]).filter(item => item!=socket.id);
        console.log("Socket "+socket.id+" is disconnecting from room "+currentRoom)
        if(String(currentRoom) in clientList ){
            for(let i = 0; i<clientList[String(currentRoom)].length;i++){
                if(clientList[String(currentRoom)][i] == socket.id){
                clientList[String(currentRoom)].splice(i,1)
                }
                else{
                    socket.to(io.sockets.connected[String(clientList[String(currentRoom)][i])]).emit('disconnectPeer',socket.id);
                }
                console.log(clientList);
            }
            if(clientList[String(currentRoom)].length == 0){
                delete clientList[String(currentRoom)];
            }
        }
  });
  socket.on('stop', () => {
    let currentRoom = Object.keys(io.sockets.adapter.sids[socket.id]).filter(item => item!=socket.id);
    console.log("Socket "+socket.id+" is disconnecting from room "+currentRoom)
    if(String(currentRoom) in clientList ){
        for(let i = 0; i<clientList[String(currentRoom)].length;i++){
            if(clientList[String(currentRoom)][i] == socket.id){
            clientList[String(currentRoom)].splice(i,1)
            }
            else{
                socket.to(io.sockets.connected[String(clientList[String(currentRoom)][i])]).emit('disconnectPeer',socket.id);
            }
            console.log(clientList);
        }
        if(clientList[String(currentRoom)].length == 0){
            delete clientList[String(currentRoom)];
        }
    }
});
socket.on("offer", (id, message) => {
    socket.to(id).emit("offer", socket.id, message);
});
socket.on("answer", (id, message) => {
  socket.to(id).emit("answer", socket.id, message);
});
socket.on("candidate", (id, message) => {
  socket.to(id).emit("candidate", socket.id, message);
});
});

app.get("/", function(req,res){
    console.log("Here")
    res.render("index.ejs")
});

app.get("/:roomNumber",function(req,res){
    roomNumber = req.params.roomNumber;
    res.render("room.ejs",{roomNumber:roomNumber})
});

setInterval(() => io.emit('time', new Date().toTimeString()), 1000);