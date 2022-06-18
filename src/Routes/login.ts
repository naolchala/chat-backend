import { Request, Response, Router } from "express";
import * as bcrypt from "bcrypt";
import { prisma } from "../config/prisma";
import * as jwt from "jsonwebtoken";

const AuthRoute = Router();

AuthRoute.post("/login", async (req: Request, res: Response) => {
    const { email, password } = req.body;

    await prisma.user
        .findUnique({
            where: {
                email,
            },
        })
        .then(async (data) => {
            if (!data) {
                res.status(401).json({
                    type: "email",
                    msg: "User With that email doesn't found",
                });
                return;
            }

            const hashedPass = data?.password;

            const match =
                hashedPass && (await bcrypt.compare(password, hashedPass));

            if (match && process.env.JWTSECRET) {
                const { password, ...user } = data;
                const token = jwt.sign(user, process.env.JWTSECRET);
                res.json({ ...user, token });
                return;
            }
            res.status(400).json({
                type: "password",
                msg: "Your password is incorrect",
            });
        })
        .catch((err) => {
            console.log(err);
        });
});

AuthRoute.post("/signUp", async (req: Request, res: Response) => {
    const { name, email, password } = req.body;
    const hashedPass = await bcrypt.hash(password, 10);
    const profilePic = `https://avatars.dicebear.com/api/adventurer-neutral/${email}.svg`;

    await prisma.user
        .create({
            data: {
                email,
                name,
                password: hashedPass,
                photoUrl: profilePic,
            },
        })
        .then((data) => {
            res.json({ msg: "Registred User successfully" });
            // TODO: send the authenticated user
        })
        .catch((err) => {
            if (err.meta.target && err.meta.target == "User_email_key") {
                res.status(403).json({
                    type: "email",
                    msg: "User with that email already Exists",
                });
            } else {
                res.status(500).send("");
            }
        });
});

export { AuthRoute };
