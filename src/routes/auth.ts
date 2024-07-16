import express from 'express';
import { lucia, prisma } from "../app";
import { hash } from "@node-rs/argon2";
import { generateIdFromEntropySize } from "lucia";


const router = express.Router();

router.post('/signup', async (req, res) => {
    // // TODO: check if email is already used
    // const user = await prisma.user.create({
    //     data: {
    //         id: "aa"
    //     }
    // })

    // // const session = await lucia.createSession(userId, {});
    
    // return res.status(200).json();
    const user = req.body;

    const email = user.email;
    // email must be between 4 ~ 31 characters, and only consists of lowercase letters, 0-9, -, and _
    // keep in mind some database (e.g. mysql) are case insensitive
    if (
        typeof email !== "string" ||
        email.length < 3 ||
        email.length > 31 ||
        !/^[a-z0-9_-]+$/.test(email)
    ) {
        return res.status(400).json("Invalid email");
    }
    const password = user.password;
    if (typeof password !== "string" || password.length < 6 || password.length > 255) {
        return res.status(400).json("Invalid password");
    }

    const userId = generateIdFromEntropySize(10); // 16 characters long
    const passwordHash = await hash(password, {
        // recommended minimum parameters
        memoryCost: 19456,
        timeCost: 2,
        outputLen: 32,
        parallelism: 1
    });

    // TODO: check if email is already used
    await prisma.user.create({
        data: {
            id: userId,
            email: email,
            passwordHash: passwordHash
        }
    });

    const session = await lucia.createSession(userId, {});
    const sessionCookie = lucia.createSessionCookie(session.id);

    return res.status(200).json(sessionCookie);
}
);

export default router;
