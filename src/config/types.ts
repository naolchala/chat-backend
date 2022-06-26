import { User } from "@prisma/client";
import { Socket } from "socket.io";
import { Request } from "express";

export type IUser = Omit<User, "password">;

export interface RequestWithUser extends Request {
    user?: IUser;
}

export interface SocketWithToken extends Socket {
    decoded_token: IUser;
}
