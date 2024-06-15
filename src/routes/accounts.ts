import express from 'express';
import { prisma } from "../app";

const router = express.Router();

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

router.get('/types', async (req, res) => {
    try {
        const accountTypes = await prisma.accountType.findMany({
            include: {
                accountCategories: true,
            }
        })
        
        return res.status(200).json(accountTypes);
    } catch (e) {
        console.error(e);
    }
}
);

router.get('/:userId', async (req, res) => {
    const userId = req.params.userId;

    try {
        const accounts = await prisma.financialAccount.findMany({
            where: {
                userId: userId,
            },
            include: {
                accountCategory: {
                    include: {
                        accountType: true
                    }
                }
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

router.put('/:accountId', async (req, res) => {
    const accountId = req.params.accountId;
    const updatedAccount = req.body;

    try {
        await prisma.financialAccount.update({
            where: {
                id: accountId,
            },
            data: updatedAccount
        });

        return res.status(200).json({ message: "Success" });
    } catch (e) {
        console.error(e);

        return res.status(500).json({ message: "Internal error" });
    }
});

router.delete('/:accountId', async (req, res) => {
    const accountId = req.params.accountId;

    try {
        await prisma.financialAccount.delete({
            where: {
                id: accountId,
            },
        })

        return res.status(200).json({ message: "Success" });
    } catch (e) {
        console.error(e);

        return res.status(500).json({ message: "Internal error" });
    }
});


export default router;
