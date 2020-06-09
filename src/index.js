const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const Filter = require("bad-words");
const app = express();
const server = http.createServer(app);
const io = socketio(server);

const {
    generateMessage,
    generateLocationMessage
} = require('./utils/messages')

const {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom
} = require('./utils/users')

const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, "../public");
app.use(express.static(publicDirectoryPath));

io.on("connection", (socket) => {
    console.log("New Websocket connection");

    socket.on('join', ({
        username,
        room
    }, callback) => {
        const {
            error,
            user
        } = addUser({
            id: socket.id,
            username,
            room
        })
        if (error) {
            return callback(error)
        }

        socket.join(user.room) // io.to.emit emit everyone in the room
        // socket.broadcast.to.emit emits to everyone except the person who sent in the room
        socket.emit("message", generateMessage('Admin', 'Welcome')); // that particular client/server will get the message
        socket.broadcast.to(user.room).emit("message", generateMessage(`${user.username} has joined!`)); // everyone except the current user
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        callback()
    })

    socket.on("sendMessage", (message, callback) => {
        const filter = new Filter();
        const user = getUser(socket.id)
        if (filter.isProfane(message)) {
            return callback("Profanity is not allowed!");
        }

        io.to(user.room).emit("message", generateMessage(user.username, message)); // everyone will get the message
        callback("delivered!");
    });

    socket.on("sendLocation", (coords, callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit(
            "locationMessage",
            generateLocationMessage(user.username,
                `https://google.com/maps?q=${coords.latitude},${coords.longitude}`)
        );
        callback();
    });

    socket.on("disconnect", () => {
        const user = removeUser(socket.id)
        if (user) {
            io.to(user.room).emit("message", generateMessage('Admin', `${user.username} has left!`));
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    });
});

server.listen(port, () => {
    console.log(`Server is up on port ${port}`);
});