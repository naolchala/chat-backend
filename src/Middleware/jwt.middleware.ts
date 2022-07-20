import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";
import { Socket } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { jwtSecret } from "..";
import { IUser, RequestWithUser } from "../config/types";

const jwtMiddleware = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const headers = req.headers;
	try {
		const token = headers["authorization"].split(" ")[1];

		if (!token) {
			return res.status(403).json();
		}

		jwt.verify(token, jwtSecret, (err, value: IUser) => {
			if (err) {
				return res.status(400).send("");
			}
			(req as RequestWithUser).user = value;
			next();
		});
	} catch {
		return res.status(5000).json();
	}
};

export interface SocketWithToken
	extends Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap> {
	decoded_token: IUser;
}

export const socketJWTMiddleware = (
	socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap>,
	next: (err?: any) => void
) => {
	const token = socket.handshake.auth.token;
	if (!token) {
		return next(new Error("Token Not found"));
	}

	jwt.verify(token, jwtSecret, (err, value: IUser) => {
		if (err) {
			return next(new Error("Internal Error"));
		}

		(socket as SocketWithToken).decoded_token = value;
		return next();
	});
};

export { jwtMiddleware };
