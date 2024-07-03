import express from 'express';
import { prisma } from "../app";

const router = express.Router();

router.put('/currency/:userId', async (req, res) => {
    const userId = req.params.userId;
    const currencyId = req.body.currencyId;

    try {
        await prisma.user.update({
            where: {
                id: userId,
            },
            data: {
                mainCurrencyId: currencyId
            }
        });

        return res.status(200).json({ message: "Success" });
    } catch (e) {
        console.error(e);

        return res.status(500).json({ message: "Internal error" });
    }
});

router.put('/:userId', async (req, res) => {
    const userId = req.params.userId;
    const user = req.body;

    try {
        await prisma.user.update({
            where: {
                id: userId,
            },
            data: user
        });

        return res.status(200).json({ message: "Success" });
    } catch (e) {
        console.error(e);

        return res.status(500).json({ message: "Internal error" });
    }
});

router.delete('/:userId', async (req, res) => {
    const userId = req.params.userId;

    try {
        await prisma.user.delete({
            where: {
                id: userId,
            }
        });

        return res.status(200).json({ message: "Success" });
    } catch (e) {
        console.error(e);

        return res.status(500).json({ message: "Internal error" });
    }
});

export default router;
