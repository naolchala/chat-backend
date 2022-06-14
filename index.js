import { randomUUID } from "crypto";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import { faker } from "@faker-js/faker";

const app = express();

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
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
    let img = faker.image.avatar();
    socket.emit("Connected", { id });
    socket.join(`room${id}`);

    users[socket.id] = { id, name: randomName, img };

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
        let sender;
        for (let user in users) {
            if (users[user]["id"] === id) {
                sender = users[user];
            }
        }

        io.emit("msgs", { id, sender, msg });
    });

    socket.on("msgTo", (data) => {
        const { id, reciver, msg } = data;

        let sender;
        let receiver;

        for (let user in users) {
            if (users[user]["id"] === id) {
                sender = users[user];
            }

            if (users[user]["id"] == reciver) {
                receiver = users[user];
            }
        }
        io.to(`room${reciver}`).emit("toMe", { sender, receiver, msg });
    });
});

const port = 4000;
server.listen(port, () => {
    console.log("Listening on port " + port);
});
