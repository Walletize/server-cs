import express from "express";
import { User } from "lucia";
import { prisma } from "../app.js";

const router = express.Router();

router.post("/cancel/:subscriptionId", async (req, res) => {
    try {
        const localUser = res.locals.user as User;
        const subscriptionId = req.params.subscriptionId;

        if (!subscriptionId) {
            return res.status(200).json({ message: "Request processed" });
        }

        const subscription = await prisma.subscription.findUnique({
            where: {
                id: subscriptionId,
            },
        });

        if (localUser.id !== subscription?.userId) {
            return res.status(200).json({ message: "Request processed" });
        }

        await fetch(`https://sandbox-api.paddle.com/subscriptions/${subscriptionId}/cancel`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + process.env.PADDLE_API_KEY!,
            },
            body: JSON.stringify({
                effective_from: "next_billing_period",
            }),
        });

        return res.status(200).json({ message: "Request processed" });
    } catch (e) {
        console.log(e);
        return res.status(200).json({ message: "Request processed" });
    }
});

router.patch("/change/:subscriptionId", async (req, res) => {
    try {
        const localUser = res.locals.user as User;
        const subscriptionId = req.params.subscriptionId;
        const items = req.body;

        if (!subscriptionId) {
            return res.status(200).json({ message: "Request processed" });
        }

        const subscription = await prisma.subscription.findUnique({
            where: {
                id: subscriptionId,
            },
        });

        if (localUser.id !== subscription?.userId) {
            return res.status(200).json({ message: "Request processed" });
        }

        await fetch(`https://sandbox-api.paddle.com/subscriptions/${subscriptionId}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + process.env.PADDLE_API_KEY!,
            },
            body: JSON.stringify({
                items,
            }),
        });

        return res.status(200).json({ message: "Request processed" });
    } catch (e) {
        console.log(e);
        return res.status(200).json({ message: "Request processed" });
    }
});

export default router;
