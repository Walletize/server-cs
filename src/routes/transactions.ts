import express from 'express';
import { prisma } from "../app";
import { Prisma } from '@prisma/client';

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

router.get('/types/:userId', async (req, res) => {
    const userId = req.params.userId;

    try {
        const transactionTypes = await prisma.transactionType.findMany({
            include: {
                transactionCategories: {
                    where: {
                        userId: userId
                    }
                },
            }
        })

        return res.status(200).json(transactionTypes);
    } catch (e) {
        console.error(e);
    }
}
);

router.get('/account/:accountId', async (req, res) => {
    const accountId = req.params.accountId;
    const grouped = req.query.grouped;
    const startDateStr = req.query.startDate;
    const endDateStr = req.query.endDate;

    try {
        if (grouped == "daily") {
            let whereClause = Prisma.sql`WHERE fa.id = ${accountId}`;

            if (startDateStr && startDateStr != "" && endDateStr && endDateStr != "") {
                whereClause = Prisma.sql`WHERE fa.id = ${accountId} AND t.date >= ${startDateStr}::date AND t.date < ${endDateStr}::date`;
            }

            const rawGroupedTransactions: any = await prisma.$queryRaw`
                SELECT DATE_TRUNC('day', t.date) AS "transactionDate",
                    SUM(t.amount) AS "totalAmount",
                    array_agg(json_build_object(
                        'id', t.id,
                        'description', t.description,
                        'amount', t.amount,
                        'convertedAmount', CASE 
                            WHEN t.currency_id != fa.currency_id THEN t.amount / c.rate * fc.rate
                            ELSE t.amount 
                        END,
                        'date', t.date,
                        'accountId', t.account_id,
                        'currencyId', t.currency_id,
                        'createdAt', t.created_at,
                        'updatedAt', t.updated_at,
                        'transactionCategory', json_build_object(
                            'id', tc.id,
                            'name', tc.name,
                            'typeId', tc.type_id,
                            'createdAt', tc.created_at,
                            'updatedAt', tc.updated_at,
                            'transactionType', json_build_object(
                                'id', tt.id,
                                'name', tt.name,
                                'createdAt', tt.created_at,
                                'updatedAt', tt.updated_at
                            )
                        ),
                        'financialAccount', json_build_object(
                            'id', fa.id,
                            'name', fa.name,
                            'userId', fa.user_id,
                            'categoryId', fa.category_id,
                            'currencyId', fa.currency_id,
                            'initialValue', fa.initial_value,
                            'createdAt', fa.created_at,
                            'updatedAt', fa.updated_at,
                            'currency', json_build_object(
                                'id', fc.id,
                                'code', fc.code,
                                'name', fc.name,
                                'symbol', fc.symbol,
                                'rate', fc.rate,
                                'createdAt', fc.created_at,
                                'updatedAt', fc.updated_at
                            )
                        ),
                        'currency', json_build_object(
                            'id', c.id,
                            'code', c.code,
                            'name', c.name,
                            'symbol', c.symbol,
                            'rate', c.rate,
                            'createdAt', c.created_at,
                            'updatedAt', c.updated_at
                        )
                    ) ORDER BY t.created_at DESC) AS transactions
                FROM transactions t
                JOIN transaction_categories tc ON t.category_id = tc.id
                JOIN transaction_types tt ON tc.type_id = tt.id
                JOIN financial_accounts fa ON t.account_id = fa.id
                JOIN currencies c ON t.currency_id = c.id
                JOIN currencies fc ON fa.currency_id = fc.id
                ${whereClause}
                GROUP BY "transactionDate"
                ORDER BY "transactionDate" DESC;
             `;

            const groupedTransactions = JSON.parse(JSON.stringify(rawGroupedTransactions, (_, value) =>
                typeof value === 'bigint'
                    ? value.toString()
                    : value
            ));

            const totalIncome: any = await prisma.$queryRaw`
                SELECT SUM(t.amount) AS "totalIncome"
                FROM transactions t
                JOIN transaction_categories tc ON t.category_id = tc.id
                JOIN transaction_types tt ON tc.type_id = tt.id
                JOIN financial_accounts fa ON t.account_id = fa.id
                ${whereClause} AND tt.name = 'Income'
            `;

            const totalExpenses: any = await prisma.$queryRaw`
                SELECT SUM(t.amount) AS "totalExpenses"
                FROM transactions t
                JOIN transaction_categories tc ON t.category_id = tc.id
                JOIN transaction_types tt ON tc.type_id = tt.id
                JOIN financial_accounts fa ON t.account_id = fa.id
                ${whereClause} AND tt.name = 'Expense'
            `;

            const combinedResults = {
                totalIncome: totalIncome[0]?.totalIncome || 0,
                totalExpenses: totalExpenses[0]?.totalExpenses || 0,
                groupedTransactions
            };

            return res.status(200).json(combinedResults);
        } else {
            const transactions = await prisma.transaction.findMany({
                where: {
                    financialAccount: {
                        id: accountId
                    }
                },
                include: {
                    financialAccount: true,
                    transactionCategory: {
                        include: {
                            transactionType: true
                        }
                    }
                },
                orderBy: [
                    {
                        date: 'desc',
                    },
                ],
            })

            const json = JSON.parse(JSON.stringify(transactions, (_, value) =>
                typeof value === 'bigint'
                    ? value.toString()
                    : value
            ));
            return res.status(200).json(json);
        }
    } catch (e) {
        console.error(e);

        return res.status(500).json({ message: "Internal error" });
    }
}
);

router.get('/user/:userId', async (req, res) => {
    const userId = req.params.userId;
    const grouped = req.query.grouped;
    const startDateStr = req.query.startDate;
    const endDateStr = req.query.endDate;

    try {
        if (grouped == "daily") {
            let whereClause = Prisma.sql`WHERE fa.user_id = ${userId}`;

            if (startDateStr && startDateStr != "" && endDateStr && endDateStr != "") {
                whereClause = Prisma.sql`WHERE fa.user_id = ${userId} AND t.date >= ${startDateStr}::date AND t.date < ${endDateStr}::date`;
            }

            const rawGroupedTransactions: any = await prisma.$queryRaw`
                SELECT DATE_TRUNC('day', t.date) AS "transactionDate",
                    SUM(
                        CASE 
                            WHEN t.currency_id != fa.currency_id THEN t.amount / c.rate * fc.rate
                            ELSE t.amount 
                        END
                    ) AS "totalAmount",
                    array_agg(json_build_object(
                        'id', t.id,
                        'description', t.description,
                        'amount', t.amount,
                        'convertedAmount', CASE 
                            WHEN t.currency_id != fa.currency_id THEN t.amount / c.rate * fc.rate
                            ELSE t.amount 
                        END,
                        'date', t.date,
                        'rate', t.rate,
                        'accountId', t.account_id,
                        'currencyId', t.currency_id,
                        'createdAt', t.created_at,
                        'updatedAt', t.updated_at,
                        'transactionCategory', json_build_object(
                            'id', tc.id,
                            'name', tc.name,
                            'typeId', tc.type_id,
                            'createdAt', tc.created_at,
                            'updatedAt', tc.updated_at,
                            'transactionType', json_build_object(
                                'id', tt.id,
                                'name', tt.name,
                                'createdAt', tt.created_at,
                                'updatedAt', tt.updated_at
                            )
                        ),
                        'financialAccount', json_build_object(
                            'id', fa.id,
                            'name', fa.name,
                            'userId', fa.user_id,
                            'categoryId', fa.category_id,
                            'currencyId', fa.currency_id,
                            'initialValue', fa.initial_value,
                            'createdAt', fa.created_at,
                            'updatedAt', fa.updated_at,
                            'currency', json_build_object(
                                'id', fc.id,
                                'code', fc.code,
                                'name', fc.name,
                                'symbol', fc.symbol,
                                'rate', fc.rate,
                                'createdAt', fc.created_at,
                                'updatedAt', fc.updated_at
                            ),
                            'accountCategory', json_build_object(
                                'id', ac.id,
                                'name', ac.name,
                                'typeId', ac.type_id,
                                'userId', ac.user_id,
                                'icon', ac.icon,
                                'createdAt', ac.created_at,
                                'updatedAt', ac.updated_at
                            )
                        ),
                        'currency', json_build_object(
                            'id', c.id,
                            'code', c.code,
                            'name', c.name,
                            'symbol', c.symbol,
                            'rate', c.rate,
                            'createdAt', c.created_at,
                            'updatedAt', c.updated_at
                        )
                    ) ORDER BY t.created_at DESC) AS transactions
                FROM transactions t
                JOIN transaction_categories tc ON t.category_id = tc.id
                JOIN transaction_types tt ON tc.type_id = tt.id
                JOIN financial_accounts fa ON t.account_id = fa.id
                JOIN account_categories ac ON fa.category_id = ac.id
                JOIN currencies c ON t.currency_id = c.id
                JOIN currencies fc ON fa.currency_id = fc.id
                ${whereClause}
                GROUP BY "transactionDate"
                ORDER BY "transactionDate" DESC;
             `;

            const groupedTransactions = JSON.parse(JSON.stringify(rawGroupedTransactions, (_, value) =>
                typeof value === 'bigint'
                    ? value.toString()
                    : value
            ));

            const totalIncome: any = await prisma.$queryRaw`
                SELECT SUM(
                    CASE
                        WHEN t.currency_id != fa.currency_id THEN t.amount / c.rate * fc.rate
                        ELSE t.amount
                    END
                ) AS "totalIncome"
                FROM transactions t
                JOIN transaction_categories tc ON t.category_id = tc.id
                JOIN transaction_types tt ON tc.type_id = tt.id
                JOIN financial_accounts fa ON t.account_id = fa.id
                JOIN currencies c ON t.currency_id = c.id
                JOIN currencies fc ON fa.currency_id = fc.id
                ${whereClause} AND tt.name = 'Income'
            `;

            const totalExpenses: any = await prisma.$queryRaw`
                SELECT SUM(
                    CASE
                        WHEN t.currency_id != fa.currency_id THEN
                            CASE
                                WHEN fa.currency_id != u.main_currency_id THEN
                                    t.amount / c.rate * uc.rate
                                ELSE
                                    t.amount / c.rate * fc.rate
                            END
                        ELSE
                            CASE
                                WHEN fa.currency_id != u.main_currency_id THEN
                                    t.amount / fc.rate * uc.rate
                                ELSE
                                    t.amount
                            END
                    END
                ) AS "totalExpenses"
                FROM transactions t
                JOIN transaction_categories tc ON t.category_id = tc.id
                JOIN transaction_types tt ON tc.type_id = tt.id
                JOIN financial_accounts fa ON t.account_id = fa.id
                JOIN users u ON fa.user_id = u.id
                JOIN currencies c ON t.currency_id = c.id
                JOIN currencies fc ON fa.currency_id = fc.id
                JOIN currencies uc ON u.main_currency_id = uc.id
                ${whereClause} AND tt.name = 'Expense'
            `;

            const combinedResults = {
                totalIncome: totalIncome[0]?.totalIncome || 0,
                totalExpenses: totalExpenses[0]?.totalExpenses || 0,
                groupedTransactions
            };

            return res.status(200).json(combinedResults);
        } else {
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
                },
                orderBy: [
                    {
                        date: 'desc',
                    },
                ],
            })

            const json = JSON.parse(JSON.stringify(transactions, (_, value) =>
                typeof value === 'bigint'
                    ? value.toString()
                    : value
            ));
            return res.status(200).json(json);
        }
    } catch (e) {
        console.error(e);

        return res.status(500).json({ message: "Internal error" });
    }
}
);

router.put('/:transactionId', async (req, res) => {
    const transactionId = req.params.transactionId;
    const updatedAccount = req.body;

    try {
        await prisma.transaction.update({
            where: {
                id: transactionId,
            },
            data: updatedAccount
        });

        return res.status(200).json({ message: "Success" });
    } catch (e) {
        console.error(e);

        return res.status(500).json({ message: "Internal error" });
    }
});

router.delete('/:transactionId', async (req, res) => {
    const transactionId = req.params.transactionId;

    try {
        await prisma.transaction.delete({
            where: {
                id: transactionId,
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
            await prisma.transactionCategory.create({
                data: {
                    name: "Salary",
                    typeId: "a6f2747a-8d68-49f7-9aab-3a9dcaaee850",
                    userId: userId,
                },
            });

            await prisma.transactionCategory.create({
                data: {
                    name: "Business",
                    typeId: "a6f2747a-8d68-49f7-9aab-3a9dcaaee850",
                    userId: userId,
                },
            });

            await prisma.transactionCategory.create({
                data: {
                    name: "Gifts",
                    typeId: "a6f2747a-8d68-49f7-9aab-3a9dcaaee850",
                    userId: userId,
                },
            });

            await prisma.transactionCategory.create({
                data: {
                    name: "Insurance Payout",
                    typeId: "a6f2747a-8d68-49f7-9aab-3a9dcaaee850",
                    userId: userId,
                },
            });

            await prisma.transactionCategory.create({
                data: {
                    name: "Investments",
                    typeId: "a6f2747a-8d68-49f7-9aab-3a9dcaaee850",
                    userId: userId,
                },
            });

            await prisma.transactionCategory.create({
                data: {
                    name: "Loan",
                    typeId: "a6f2747a-8d68-49f7-9aab-3a9dcaaee850",
                    userId: userId,
                },
            });

            await prisma.transactionCategory.create({
                data: {
                    name: "Other",
                    typeId: "a6f2747a-8d68-49f7-9aab-3a9dcaaee850",
                    userId: userId,
                },
            });

            await prisma.transactionCategory.create({
                data: {
                    name: "Bills & Fees",
                    typeId: "62919f5b-047d-45c7-96d9-1cd21a946d3a",
                    userId: userId,
                },
            });

            await prisma.transactionCategory.create({
                data: {
                    name: "Entertainment",
                    typeId: "62919f5b-047d-45c7-96d9-1cd21a946d3a",
                    userId: userId,
                },
            });

            await prisma.transactionCategory.create({
                data: {
                    name: "Car",
                    typeId: "62919f5b-047d-45c7-96d9-1cd21a946d3a",
                    userId: userId,
                },
            });

            await prisma.transactionCategory.create({
                data: {
                    name: "Beauty",
                    typeId: "62919f5b-047d-45c7-96d9-1cd21a946d3a",
                    userId: userId,
                },
            });

            await prisma.transactionCategory.create({
                data: {
                    name: "Education",
                    typeId: "62919f5b-047d-45c7-96d9-1cd21a946d3a",
                    userId: userId,
                },
            });

            await prisma.transactionCategory.create({
                data: {
                    name: "Family & Personal",
                    typeId: "62919f5b-047d-45c7-96d9-1cd21a946d3a",
                    userId: userId,
                },
            });

            await prisma.transactionCategory.create({
                data: {
                    name: "Food & Drink",
                    typeId: "62919f5b-047d-45c7-96d9-1cd21a946d3a",
                    userId: userId,
                },
            });

            await prisma.transactionCategory.create({
                data: {
                    name: "Gifts",
                    typeId: "62919f5b-047d-45c7-96d9-1cd21a946d3a",
                    userId: userId,
                },
            });

            await prisma.transactionCategory.create({
                data: {
                    name: "Groceries",
                    typeId: "62919f5b-047d-45c7-96d9-1cd21a946d3a",
                    userId: userId,
                },
            });

            await prisma.transactionCategory.create({
                data: {
                    name: "Healthcare",
                    typeId: "62919f5b-047d-45c7-96d9-1cd21a946d3a",
                    userId: userId,
                },
            });

            await prisma.transactionCategory.create({
                data: {
                    name: "Home",
                    typeId: "62919f5b-047d-45c7-96d9-1cd21a946d3a",
                    userId: userId,
                },
            });

            await prisma.transactionCategory.create({
                data: {
                    name: "Shopping",
                    typeId: "62919f5b-047d-45c7-96d9-1cd21a946d3a",
                    userId: userId,
                },
            });

            await prisma.transactionCategory.create({
                data: {
                    name: "Sport & Hobbies",
                    typeId: "62919f5b-047d-45c7-96d9-1cd21a946d3a",
                    userId: userId,
                },
            });

            await prisma.transactionCategory.create({
                data: {
                    name: "Transport",
                    typeId: "62919f5b-047d-45c7-96d9-1cd21a946d3a",
                    userId: userId,
                },
            });

            await prisma.transactionCategory.create({
                data: {
                    name: "Travel",
                    typeId: "62919f5b-047d-45c7-96d9-1cd21a946d3a",
                    userId: userId,
                },
            });

            await prisma.transactionCategory.create({
                data: {
                    name: "Work",
                    typeId: "62919f5b-047d-45c7-96d9-1cd21a946d3a",
                    userId: userId,
                },
            });

            await prisma.transactionCategory.create({
                data: {
                    name: "Other",
                    typeId: "62919f5b-047d-45c7-96d9-1cd21a946d3a",
                    userId: userId,
                },
            });
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
        await prisma.transactionCategory.update({
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
        await prisma.transactionCategory.delete({
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
