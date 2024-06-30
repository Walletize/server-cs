import express from 'express';
import { prisma } from "../app";

const router = express.Router();

router.put('/update/currency/:userId', async (req, res) => {
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

export default router;
