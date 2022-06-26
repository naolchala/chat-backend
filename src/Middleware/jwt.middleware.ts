import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";
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

export { jwtMiddleware };
