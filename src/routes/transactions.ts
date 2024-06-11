import express from 'express';
import { prisma } from "../app";

const router = express.Router();

router.post('/', async (req, res) => {
    try {
        const transaction = req.body;

        await prisma.transaction.create({
            data: transaction
        });

        return res.status(200).json();
    } catch (e) {
        console.error(e);
    }
}
);

router.get('/types', async (req, res) => {
    try {
        const transactionTypes = await prisma.transactionType.findMany({
            include: {
                transactionCategories: true,
            }
        })

        return res.status(200).json(transactionTypes);
    } catch (e) {
        console.error(e);
    }
}
);

router.get('/:userId', async (req, res) => {
    const userId = req.params.userId;

    try {
        const transactions = await prisma.transaction.findMany({
            where: {
                financialAccount: {
                    userId: userId
                }
            },
            include: {
                financialAccount: true,
                transactionCategory: {
                    include: {
                        transactionType: true
                    }
                }
            }
        })

        const json = JSON.parse(JSON.stringify(transactions, (_, value) =>
            typeof value === 'bigint'
                ? value.toString()
                : value
        ));
        return res.status(200).json(json);
    } catch (e) {
        console.error(e);

        return res.status(500).json({ message: "Internal error" });
    }
}
);

export default router;
