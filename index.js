import { randomUUID } from "crypto";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import { faker } from "@faker-js/faker";

const app = express();

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        optionsSuccessStatus: 200,
    },
});

app.get("/", (req, res) => {
    res.send("Hello World");
});

let users = {};

const getUsers = () => {
    const u = [];
    for (let user in users) {
        u.push(users[user]);
    }
    return u;
};

io.on("connection", (socket) => {
    let id = randomUUID();
    let randomName = faker.name.findName();
    socket.emit("Connected", { id });
    socket.join(`room${id}`);

    users[socket.id] = { id, name: randomName };

    io.emit("users", getUsers());

    socket.on("disconnecting", () => {
        delete users[socket.id];
        io.emit("users", getUsers());
    });

    socket.on("disconnect", () => {
        console.log("User Disconnected");
    });

    socket.on("msg", (data) => {
        const { id, msg } = data;
        io.emit("msgs", { id });
    });

    socket.on("msgTo", (data) => {
        const { id, reciver, msg } = data;
        io.to(`room${reciver}`).emit("toMe", { id: reciver, sender: id, msg });
    });
});

const port = 4000;
server.listen(port, () => {
    console.log("Listening on port " + port);
});
