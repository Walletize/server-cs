import express from "express";
import { prisma } from "../app.js";
import { User } from "lucia";

const router = express.Router();

router.put("/currency/:userId", async (req, res) => {
    try {
        const localUser = res.locals.user as User;
        const userId = req.params.userId;
        const currencyId = req.body.currencyId;

        if (localUser.id !== userId) {
            return res.status(403).json({ message: "Forbidden" });
        }

        await prisma.user.update({
            where: {
                id: userId,
            },
            data: {
                mainCurrencyId: currencyId,
            },
        });

        return res.status(200).json({ message: "Success" });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: "Internal error" });
    }
});

router.put("/:userId", async (req, res) => {
    try {
        const localUser = res.locals.user as User;
        const userId = req.params.userId;
        const user = req.body;

        if (localUser.id !== userId) {
            return res.status(403).json({ message: "Forbidden" });
        }

        await prisma.user.update({
            where: {
                id: userId,
            },
            data: user,
        });

        return res.status(200).json({ message: "Success" });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: "Internal error" });
    }
});

router.delete("/:userId", async (req, res) => {
    try {
        const localUser = res.locals.user as User;
        const userId = req.params.userId;

        if (localUser.id !== userId) {
            return res.status(403).json({ message: "Forbidden" });
        }

        await prisma.user.delete({
            where: {
                id: userId,
            },
        });

        return res.status(200).json({ message: "Success" });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: "Internal error" });
    }
});

export default router;
