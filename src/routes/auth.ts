import express from 'express';
import { lucia, prisma } from "../app";
import { hash } from "@node-rs/argon2";
import { generateIdFromEntropySize } from "lucia";
import { verify } from "@node-rs/argon2";
import { User } from '@prisma/client';

const router = express.Router();

router.post('/signup', async (req, res) => {
    const user = req.body;
    const name = user.name;
    const email = user.email;
    if (
        typeof email !== "string" ||
        email.length < 5 || // minimum length for a valid email (e.g., a@b.c)
        email.length > 254 || // maximum length for a valid email
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
        return res.status(400).json("Invalid email");
    }
    const password = user.password;
    if (typeof password !== "string" || password.length < 6 || password.length > 255) {
        return res.status(400).json("Invalid password");
    }

    const passwordHash = await hash(password, {
        // recommended minimum parameters
        memoryCost: 19456,
        timeCost: 2,
        outputLen: 32,
        parallelism: 1
    });

    // TODO: check if email is already used
    const newUser = await prisma.user.create({
        data: {
            email: email,
            name: name,
            passwordHash: passwordHash
        }
    });

    const session = await lucia.createSession(newUser.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id).serialize();
    res.set("Set-Cookie", sessionCookie);

    return res.status(200).json("Sign up succesful");
});

router.post('/login', async (req, res) => {
    const user = req.body;
    const email = user.email;
    if (
        typeof email !== "string" ||
        email.length < 5 || // minimum length for a valid email (e.g., a@b.c)
        email.length > 254 || // maximum length for a valid email
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
        return res.status(400).json("Invalid email");
    }
    const password = user.password;
    if (typeof password !== "string" || password.length < 6 || password.length > 255) {
        return res.status(400).json("Invalid password");
    }

    const existingUser = await prisma.user.findUnique({
        where: {
            email: email,
        },
    });
    if (!existingUser) {
        return res.status(400).json("Incorrect username or password");
    };

    const validPassword = await verify(existingUser.passwordHash || "", password, {
        memoryCost: 19456,
        timeCost: 2,
        outputLen: 32,
        parallelism: 1
    });
    if (!validPassword) {
        return res.status(400).json("Incorrect username or password");
    }

    const session = await lucia.createSession(existingUser.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id).serialize();
    res.set("Set-Cookie", sessionCookie);

    return res.status(200).json("Login succesful");
});

router.get('/session/validate', async (req, res) => {
    return res.status(200).json(res.locals.user);
});

router.get('/logout', async (req, res) => {
    if (!res.locals.session) {
        return res.status(401).end();
    }

    await lucia.invalidateSession(res.locals.session.id);
    const sessionCookie = lucia.createBlankSessionCookie().serialize();
    res.set("Set-Cookie", sessionCookie);

    return res.status(200).json("Signup succesful");
});

router.post('/login/:providerId', async (req, res) => {
    const user: User = req.body;
    const providerId = req.params.providerId;

    const existingUser = await prisma.user.findUnique({
        where: {
            providerId: providerId,
            providerUserId: user.providerUserId || undefined,
        },
    });
    if (existingUser) {
        const session = await lucia.createSession(existingUser.id, {});
        const sessionCookie = lucia.createSessionCookie(session.id).serialize();
        res.set("Set-Cookie", sessionCookie);

        return res.status(200).json("Login succesful");
    }

    const newUser = await prisma.user.create({
        data: {
            providerId: providerId,
            providerUserId: user.providerUserId,
            email: user.email,
            name: user.name,
            image: user.image
        }
    });

    const session = await lucia.createSession(newUser.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id).serialize();
    res.set("Set-Cookie", sessionCookie);

    return res.status(200).json("Signup succesful");
});

export default router;
