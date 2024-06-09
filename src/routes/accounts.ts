import express from 'express';
import { prisma } from "../app";

const router = express.Router();

router.get('/:userId', async (req, res) => {
    const userId = req.params.userId;

    try {
        const accounts = await prisma.financialAccount.findMany({
            where: {
                userId: userId,
            }
        })

        const json = JSON.parse(JSON.stringify(accounts, (_, value) =>
            typeof value === 'bigint'
                ? value.toString()
                : value
        ));
        return res.status(200).json(json);
    } catch (e) {
        console.error(e);

        return res.status(500).json({message: "Internal error"});
    }
}
);

router.post('/', async (req, res) => {
    try {
        const account = req.body;

        await prisma.financialAccount.create({
            data: account
        });

        return res.status(200).json();
    } catch (e) {
        console.error(e);
    }
}
);

export default router;
