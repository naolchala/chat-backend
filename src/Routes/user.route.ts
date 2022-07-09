import { Request, Response, Router } from "express";
import { RequestWithUser } from "../config/types";
import { prisma } from "../config/prisma";
import {
  getContacts,
  getContactsID,
  loadMessages,
  sendMessage,
} from "../Controllers/user.controller";
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

UserRoute.get(
  "/messages/:otherId",
  jwtMiddleware,
  async (req: RequestWithUser, res: Response) => {
    const { id } = req.user;
    const query = req.params;
    console.log(query);

    const otherId = query.otherId as string;
    console.log(otherId);

    if (!otherId || otherId === "undefined") {
      return res.json([]);
    }
    const messages = await loadMessages(id, otherId);
    return res.json(messages);
  }
);

UserRoute.post(
  "/send_message",
  jwtMiddleware,
  async (req: RequestWithUser, res: Response) => {
    const { receiver_id, message } = req.body;
    const msgContent = {
      text: message,
    };
    const user = req.user;

    await sendMessage(user.id, receiver_id, msgContent);

    return res.json(await loadMessages(user.id, receiver_id));
  }
);

export { UserRoute };
