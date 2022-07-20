import * as express from "express";
import * as https from "https";
import * as bodyParser from "body-parser";
import * as cors from "cors";
import { Server } from "socket.io";
import { AuthRoute } from "./Routes/login";
import { SocketWithToken } from "./config/types";
import {
	contactUsers,
	getContactsID,
	sendMessage,
	setOnline,
} from "./Controllers/user.controller";
import { UserRoute } from "./Routes/user.route";
import { socketJWTMiddleware } from "./Middleware/jwt.middleware";

const app = express();
app.use(cors());
app.use(bodyParser.json());

const server = https.createServer(app);
const io = new Server(server, {
	cors: {
		origin: "*",
		optionsSuccessStatus: 200,
	},
});

export const jwtSecret = process.env.JWTSECRET;

io.use(socketJWTMiddleware);

app.use("/auth", AuthRoute);
app.use("/user", UserRoute);
app.get("/", (req, res) => {
	res.send("Hello World");
});

const SocketIdUserMap = new Map<string, string[]>();

io.on("connection", async (socket: SocketWithToken) => {
	const user = socket.decoded_token;

	setOnline(user.id, true);

	if (SocketIdUserMap.has(user.id)) {
		let ids = SocketIdUserMap.get(user.id);
		SocketIdUserMap.set(user.id, [...ids, socket.id]);
	} else {
		SocketIdUserMap.set(user.id, [socket.id]);
	}

	console.log({ SocketIdUserMap });

	socket.join(user.id);
	const contactsID = await getContactsID(user.id);
	contactsID.map((id) => socket.to(id).emit("friend_online", user.id));

	socket.on("disconnecting", async () => {
		SocketIdUserMap.forEach(async (value: string[], key: string) => {
			if (value.indexOf(socket.id) != -1) {
				value = value.filter((id) => id != socket.id);
				if (value.length == 0) {
					const contactsID = await getContactsID(key);
					contactsID.map((id) =>
						socket.to(id).emit("friend_offline", user.id)
					);
					setOnline(key, false);
					SocketIdUserMap.delete(key);
				} else {
					SocketIdUserMap.set(key, value);
				}
			}
		});
	});

	socket.on("send_message", async (req) => {
		const user = socket.decoded_token;
		const { from_id, to_id, content, newContact } = req;

		if (newContact) {
			await contactUsers(user.id, to_id);
		}

		const msg = await sendMessage(user.id, to_id, content);

		if (SocketIdUserMap.has(to_id)) {
			const rooms = SocketIdUserMap.get(to_id);

			rooms.map((room) => {
				io.to(room).emit("incoming_message", msg);
			});
		}

		socket.emit("incoming_message", msg);
	});
});

const port = process.env.PORT || 80;
server.listen(port, () => {
	console.log("Listening on port " + port);
});
