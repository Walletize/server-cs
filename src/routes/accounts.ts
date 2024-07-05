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

router.get('/types/:userId', async (req, res) => {
    const userId = req.params.userId;

    try {
        const accountTypes = await prisma.accountType.findMany({
            include: {
                accountCategories: {
                    where: {
                        userId: userId
                    }
                },
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
                fa.initial_value + COALESCE(SUM(t.amount), 0) AS "currentValue"
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

        return res.status(200).json(json[0]);
    } catch (e) {
        console.error(e);

        return res.status(500).json({ message: "Internal error" });
    }
}
);

router.get('/user/:userId', async (req, res) => {
    const userId = req.params.userId;
    const countTotalValues = req.query.countTotalValues;

    try {
        const rawAccounts = await prisma.$queryRaw`
            SELECT 
                fa.id AS "id",
                fa.name AS "name",
                fa.user_id AS "userId",
                fa.category_id AS "categoryId",
                fa.currency_id AS "currencyId",
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
                jsonb_build_object(
                    'id', fc.id,
                    'code', fc.code,
                    'name', fc.name,
                    'symbol', fc.symbol,
                    'rate', fc.rate,
                    'createdAt', fc.created_at,
                    'updatedAt', fc.updated_at
                ) AS "currency",
                    fa.initial_value + COALESCE(
                        SUM(
                            CASE 
                                WHEN t.currency_id != fa.currency_id THEN t.amount / tc.rate * fc.rate
                                ELSE t.amount 
                            END
                        ), 
                        0
                    ) AS "currentValue"
            FROM financial_accounts fa
            JOIN account_categories ac ON fa.category_id = ac.id
            JOIN account_types at ON ac.type_id = at.id
            LEFT JOIN transactions t ON fa.id = t.account_id
            LEFT JOIN currencies fc ON fa.currency_id = fc.id
            LEFT JOIN currencies tc ON t.currency_id = tc.id
            WHERE fa.user_id = ${userId}
            GROUP BY fa.id, ac.id, at.id, fc.id
        `;

        const accounts = JSON.parse(JSON.stringify(rawAccounts, (_, value) =>
            typeof value === 'bigint'
                ? value.toString()
                : value
        ));

        if (countTotalValues) {
            const totalAssets: { totalAssets: number }[] = await prisma.$queryRaw`
            SELECT 
                SUM(fa.initial_value + COALESCE(t.totalAmount, 0)) AS "totalAssets"
            FROM 
                financial_accounts fa
            JOIN 
                account_categories ac ON fa.category_id = ac.id
            JOIN 
                account_types at ON ac.type_id = at.id
            LEFT JOIN (
                SELECT 
                    account_id, 
                    SUM(amount) AS totalAmount
                FROM 
                    transactions
                GROUP BY 
                    account_id
            ) t ON fa.id = t.account_id
            WHERE 
                at.name = 'Asset'
        `;

            const totalLiabilities: { totalLiabilities: number }[] = await prisma.$queryRaw`
            SELECT 
                SUM(fa.initial_value + COALESCE(t.totalAmount, 0)) AS "totalLiabilities"
            FROM 
                financial_accounts fa
            JOIN 
                account_categories ac ON fa.category_id = ac.id
            JOIN 
                account_types at ON ac.type_id = at.id
            LEFT JOIN (
                SELECT 
                    account_id, 
                    SUM(amount) AS totalAmount
                FROM 
                    transactions
                GROUP BY 
                    account_id
            ) t ON fa.id = t.account_id
            WHERE 
                at.name = 'Liability'
        `;
        
            const combinedResults = {
                totalAssets: totalAssets[0].totalAssets ? totalAssets[0].totalAssets : 0,
                totalLiabilities: totalLiabilities[0].totalLiabilities ? totalLiabilities[0].totalLiabilities : 0,
                accounts
            };

            return res.status(200).json(combinedResults);
        } else {
            return res.status(200).json(accounts);
        }
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

router.post('/categories/:userId', async (req, res) => {
    const userId = req.params.userId;
    const category = req.body;

    try {
        if (Object.keys(category).length === 0) {
            await prisma.accountCategory.create({
                data: {
                    name: "Checking Account",
                    icon: "",
                    typeId: "590cf50e-09a5-414c-9444-a716b14d210f",
                    userId: userId,
                },
            })

            await prisma.accountCategory.create({
                data: {
                    name: "Savings Account",
                    icon: "",
                    typeId: "590cf50e-09a5-414c-9444-a716b14d210f",
                    userId: userId,
                },
            })

            await prisma.accountCategory.create({
                data: {
                    name: "Cash",
                    icon: "",
                    typeId: "590cf50e-09a5-414c-9444-a716b14d210f",
                    userId: userId,
                },
            })

            await prisma.accountCategory.create({
                data: {
                    name: "Stocks",
                    icon: "",
                    typeId: "590cf50e-09a5-414c-9444-a716b14d210f",
                    userId: userId,
                },
            })

            await prisma.accountCategory.create({
                data: {
                    name: "Cryptocurrencies",
                    icon: "",
                    typeId: "590cf50e-09a5-414c-9444-a716b14d210f",
                    userId: userId,
                },
            })

            await prisma.accountCategory.create({
                data: {
                    name: "Real Estate",
                    icon: "",
                    typeId: "590cf50e-09a5-414c-9444-a716b14d210f",
                    userId: userId,
                },
            })

            await prisma.accountCategory.create({
                data: {
                    name: "Vehicle",
                    icon: "",
                    typeId: "590cf50e-09a5-414c-9444-a716b14d210f",
                    userId: userId,
                },
            })

            await prisma.accountCategory.create({
                data: {
                    name: "Retirement Accounts",
                    icon: "",
                    typeId: "590cf50e-09a5-414c-9444-a716b14d210f",
                    userId: userId,
                },
            })

            await prisma.accountCategory.create({
                data: {
                    name: "Gold",
                    icon: "",
                    typeId: "590cf50e-09a5-414c-9444-a716b14d210f",
                    userId: userId,
                },
            })

            await prisma.accountCategory.create({
                data: {
                    name: "Insurance",
                    icon: "",
                    typeId: "590cf50e-09a5-414c-9444-a716b14d210f",
                    userId: userId,
                },
            })

            await prisma.accountCategory.create({
                data: {
                    name: "Collectibles",
                    icon: "",
                    typeId: "590cf50e-09a5-414c-9444-a716b14d210f",
                    userId: userId,
                },
            })

            await prisma.accountCategory.create({
                data: {
                    name: "Other",
                    icon: "",
                    typeId: "590cf50e-09a5-414c-9444-a716b14d210f",
                    userId: userId,
                },
            })

            await prisma.accountCategory.create({
                data: {
                    name: "Loan",
                    icon: "",
                    typeId: "645349f8-6b34-420c-91ef-c058eb065f2d",
                    userId: userId,
                },
            })

            await prisma.accountCategory.create({
                data: {
                    name: "Credit Card",
                    icon: "",
                    typeId: "645349f8-6b34-420c-91ef-c058eb065f2d",
                    userId: userId,
                },
            })

            await prisma.accountCategory.create({
                data: {
                    name: "Bills",
                    icon: "",
                    typeId: "645349f8-6b34-420c-91ef-c058eb065f2d",
                    userId: userId,
                },
            })

            await prisma.accountCategory.create({
                data: {
                    name: "Mortgage",
                    icon: "",
                    typeId: "645349f8-6b34-420c-91ef-c058eb065f2d",
                    userId: userId,
                },
            })

            await prisma.accountCategory.create({
                data: {
                    name: "Other",
                    icon: "",
                    typeId: "645349f8-6b34-420c-91ef-c058eb065f2d",
                    userId: userId,
                },
            })
        } else {
            await prisma.accountCategory.create({
                data: category
            });
        }

        return res.status(200).json();
    } catch (e) {
        console.error(e);

        return res.status(500).json({ message: "Internal error" });
    }
});

router.put('/categories/:categoryId', async (req, res) => {
    const categoryId = req.params.categoryId;
    const updatedCategory = req.body;

    try {
        await prisma.accountCategory.update({
            where: {
                id: categoryId,
            },
            data: updatedCategory
        });

        return res.status(200).json({ message: "Success" });
    } catch (e) {
        console.error(e);

        return res.status(500).json({ message: "Internal error" });
    }
});

router.delete('/categories/:categoryId', async (req, res) => {
    const categoryId = req.params.categoryId;

    try {
        await prisma.accountCategory.delete({
            where: {
                id: categoryId,
            },
        });

        return res.status(200).json({ message: "Success" });
    } catch (e) {
        console.error(e);

        return res.status(500).json({ message: "Internal error" });
    }
});


export default router;
