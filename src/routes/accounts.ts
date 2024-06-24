import express from 'express';
import { prisma } from "../app";
import { FinancialAccount } from '@prisma/client';

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

router.get('/:accountId', async (req, res) => {
    const accountId = req.params.accountId;

    try {
        const account: FinancialAccount[] = await prisma.$queryRaw`
            SELECT 
                fa.id AS "id",
                fa.name AS "name",
                fa.user_id AS "userId",
                fa.category_id AS "categoryId",
                fa.initial_value AS "initialValue",
                fa.created_at AS "createdAt",
                fa.updated_at AS "updatedAt",
                jsonb_build_object(
                    'id', ac.id,
                    'name', ac.name,
                    'typeId', ac.type_id,
                    'userId', ac.user_id,
                    'icon', ac.icon,
                    'createdAt', ac.created_at,
                    'updatedAt', ac.updated_at,
                    'accountType', jsonb_build_object(
                        'id', at.id,
                        'name', at.name,
                        'createdAt', at.created_at,
                        'updatedAt', at.updated_at
                    )
                ) AS "accountCategory",
                COALESCE(SUM(t.amount), 0) AS "currentValue"
            FROM 
                financial_accounts fa
            JOIN 
                account_categories ac ON fa.category_id = ac.id
            JOIN 
                account_types at ON ac.type_id = at.id
            LEFT JOIN 
                transactions t ON fa.id = t.account_id
            WHERE 
                fa.id = ${accountId}
            GROUP BY 
                fa.id, ac.id, at.id
        `;

        const json = JSON.parse(JSON.stringify(account, (_, value) =>
            typeof value === 'bigint'
                ? value.toString()
                : value
        ));
        console.log(json)

        return res.status(200).json(json[0]);
    } catch (e) {
        console.error(e);

        return res.status(500).json({ message: "Internal error" });
    }
}
);

router.get('/user/:userId', async (req, res) => {
    const userId = req.params.userId;

    try {
        const accounts = await prisma.$queryRaw`
            SELECT 
                fa.id AS "id",
                fa.name AS "name",
                fa.user_id AS "userId",
                fa.category_id AS "categoryId",
                fa.initial_value AS "initialValue",
                fa.created_at AS "createdAt",
                fa.updated_at AS "updatedAt",
                jsonb_build_object(
                    'id', ac.id,
                    'name', ac.name,
                    'typeId', ac.type_id,
                    'userId', ac.user_id,
                    'icon', ac.icon,
                    'createdAt', ac.created_at,
                    'updatedAt', ac.updated_at,
                    'accountType', jsonb_build_object(
                        'id', at.id,
                        'name', at.name,
                        'createdAt', at.created_at,
                        'updatedAt', at.updated_at
                    )
                ) AS "accountCategory",
                COALESCE(SUM(t.amount), 0) AS "currentValue"
            FROM 
                financial_accounts fa
            JOIN 
                account_categories ac ON fa.category_id = ac.id
            JOIN 
                account_types at ON ac.type_id = at.id
            LEFT JOIN 
                transactions t ON fa.id = t.account_id
            WHERE 
                fa.user_id = ${userId}
            GROUP BY 
                fa.id, ac.id, at.id
        `;

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
