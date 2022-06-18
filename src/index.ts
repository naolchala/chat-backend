import * as express from "express";
import * as http from "http";
import * as socketioJwt from "socketio-jwt";
import * as bodyParser from "body-parser";
import * as cors from "cors";
import { randomUUID } from "crypto";
import { Server, Socket } from "socket.io";
import { faker } from "@faker-js/faker";
import { AuthRoute } from "./Routes/login";
import { IUser } from "./config/IUser";

const app = express();
app.use(
    cors({
        origin: "*",
    })
);
app.use(bodyParser.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        optionsSuccessStatus: 200,
    },
});

const jwtSecret = process.env.JWTSECRET || randomUUID();

io.use(
    socketioJwt.authorize({
        secret: jwtSecret,
        handshake: true,
        auth_header_required: true,
    })
);

app.use("/auth", AuthRoute);
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

interface SocketWithToken extends Socket {
    decoded_token: IUser;
}

io.on("connection", (socket: SocketWithToken) => {
    console.log(socket.decoded_token);
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
        socket.emit("toMe", { sender: receiver, receiver: sender, msg });
    });
});

const port = 5000;
server.listen(port, () => {
    console.log("Listening on port " + port);
});
