import { Request, Response, Router } from "express";
import { RequestWithUser } from "../config/types";
import { prisma } from "../config/prisma";
import { getContacts, getContactsID } from "../Controllers/user.controller";
import { jwtMiddleware } from "../Middleware/jwt.middleware";
import { userSelect } from "../config/userSelect";

const UserRoute = Router();
UserRoute.get(
    "/contacts",
    jwtMiddleware,
    async (req: RequestWithUser, res: Response) => {
        const user = req.user;
        const contacts = await getContacts(user.id);
        return res.json(contacts);
    }
);

UserRoute.get("/search", async (req: Request, res: Response) => {
    const query = req.query;
    const email = query.email as string;
    const users = await prisma.user.findMany({
        select: userSelect,
        take: 10,
        where: {
            email: {
                startsWith: email,
            },
        },
    });

    return res.json(users);
});

export { UserRoute };
