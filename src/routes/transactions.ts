import { Prisma } from '@prisma/client';
import express from 'express';
import { prisma } from "../app.js";
import { getPreviousMonthPeriod, getPreviousPeriod } from '../lib/utils.js';

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

router.post('/transfer', async (req, res) => {
    try {
        const originAccountId = req.body.originAccountId;
        const originAccountCurrencyId = req.body.originAccountCurrencyId;
        const destinationAccountId = req.body.destinationAccountId;
        const destinationAccountCurrencyId = req.body.destinationAccountCurrencyId;
        const selectedCurrencyId = req.body.selectedCurrencyId;
        const date = req.body.date;
        const amount = req.body.amount;
        const rate = req.body.rate;

        const originTranasaction = await prisma.transaction.create({
            data: {
                date: date,
                amount: -amount,
                rate: selectedCurrencyId !== originAccountCurrencyId ? rate : null,
                accountId: originAccountId,
                currencyId: selectedCurrencyId,
                categoryId: "cfb050f6-dd57-4061-89a8-4fc5c10e777e",
            }
        });
        const destinationTranasaction = await prisma.transaction.create({
            data: {
                date: date,
                amount: amount,
                rate: selectedCurrencyId !== destinationAccountCurrencyId ? rate : null,
                accountId: destinationAccountId,
                currencyId: selectedCurrencyId,
                categoryId: "cfb050f6-dd57-4061-89a8-4fc5c10e777e",
            }
        });
        await prisma.transactionTransfer.create({
            data: {
                originTransactionId: originTranasaction.id,
                destinationTransactionId: destinationTranasaction.id
            }
        });

        return res.status(200).json();
    } catch (e) {
        console.error(e);
    }
});

router.post('/update', async (req, res) => {
    try {
        const description = req.body.description;
        const date = req.body.date;
        const newValue = req.body.newValue;
        const rate = req.body.rate;
        const currencyId = req.body.currencyId;
        const accountId = req.body.accountId;

        const result = await prisma.transaction.aggregate({
            _sum: {
                amount: true,
            },
            where: {
                accountId: accountId,
            },
        });
        if (!result._sum.amount) {
            return res.status(500).json();
        };

        await prisma.transaction.create({
            data: {
                description: description,
                date: date,
                amount: newValue - Number(result._sum.amount),
                rate: rate,
                accountId: accountId,
                currencyId: currencyId,
                categoryId: "8e46c952-3378-49f6-bcfa-377351882dad",
            }
        });

        return res.status(200).json();
    } catch (e) {
        console.error(e);
        return res.status(500).json();
    }
});

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
    const startDateStr = req.query.startDate;
    const endDateStr = req.query.endDate;

    try {
        let previousPeriod = getPreviousMonthPeriod();
        let groupedTransactionsWhereClause = Prisma.sql`WHERE fa.id = ${accountId}`;
        if (startDateStr && startDateStr != "" && endDateStr && endDateStr != "") {
            previousPeriod = getPreviousPeriod(startDateStr as string, endDateStr as string);
            groupedTransactionsWhereClause = Prisma.sql`WHERE fa.id = ${accountId} AND t.date >= ${startDateStr}::date AND t.date <= ${endDateStr}::date`;
        }
        let prevValuesWhereClause = Prisma.sql`WHERE fa.id = ${accountId} AND t.date >= ${previousPeriod.startDate}::date AND t.date <= ${previousPeriod.endDate}::date`;

        const rawGroupedTransactions: any = await prisma.$queryRaw`
                SELECT DATE_TRUNC('day', t.date) AS "transactionDate",
                    SUM(
                        CASE 
                            WHEN tt.name = 'Expense' AND t.currency_id != fa.currency_id THEN t.amount * t.rate
                            WHEN tt.name = 'Expense' THEN t.amount
                            ELSE 0
                        END
                    ) AS "totalExpenses",
                    SUM(
                        CASE 
                            WHEN tt.name = 'Income' AND t.currency_id != fa.currency_id THEN t.amount * t.rate
                            WHEN tt.name = 'Income' THEN t.amount
                            ELSE 0
                        END
                    ) AS "totalIncome",
                    SUM(
                        CASE 
                            WHEN at.name = 'Asset' AND t.currency_id != fa.currency_id THEN t.amount * t.rate
                            WHEN at.name = 'Asset' THEN t.amount
                            ELSE 0
                        END
                    ) AS "assetsValue",
                    SUM(
                        CASE 
                            WHEN at.name = 'Liability' AND t.currency_id != fa.currency_id THEN t.amount * t.rate
                            WHEN at.name = 'Liability' THEN t.amount
                            ELSE 0
                        END
                    ) AS "liabilitiesValue",
                    array_agg(json_build_object(
                        'id', t.id,
                        'description', t.description,
                        'amount', t.amount,
                        'convertedAccountAmount', CASE 
                            WHEN t.currency_id != fa.currency_id THEN 
                                t.amount * t.rate
                            ELSE 
                                t.amount 
                        END,
                        'convertedMainAmount', CASE 
                            WHEN t.currency_id != fa.currency_id THEN
                                CASE
                                    WHEN fa.currency_id != u.main_currency_id THEN
                                        t.amount * t.rate / fc.rate * uc.rate
                                    ELSE
                                        t.amount * t.rate
                                END
                            ELSE
                                CASE
                                    WHEN t.currency_id != u.main_currency_id THEN
                                        t.amount / c.rate * uc.rate
                                    ELSE
                                        t.amount
                            END
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
                            'icon', tc.icon,
                            'color', tc.color,
                            'iconColor', tc.icon_color,
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
                            'icon', fa.icon,
                            'color', fa.color,
                            'iconColor', fa.icon_color,
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
                                'createdAt', ac.created_at,
                                'updatedAt', ac.updated_at,
                                'accountType', jsonb_build_object(
                                    'id', at.id,
                                    'name', at.name,
                                    'createdAt', at.created_at,
                                    'updatedAt', at.updated_at
                                )
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
                JOIN account_types at ON ac.type_id = at.id
                JOIN currencies c ON t.currency_id = c.id
                JOIN currencies fc ON fa.currency_id = fc.id
                JOIN users u ON fa.user_id = u.id
                JOIN currencies uc ON u.main_currency_id = uc.id
                ${groupedTransactionsWhereClause}
                GROUP BY "transactionDate"
                ORDER BY "transactionDate" DESC;
             `;

        const groupedTransactions = JSON.parse(JSON.stringify(rawGroupedTransactions, (_, value) =>
            typeof value === 'bigint'
                ? value.toString()
                : value
        ));

        const prevIncome: any = await prisma.$queryRaw`
                SELECT SUM(
                    CASE
                        WHEN t.currency_id != fa.currency_id THEN
                            CASE
                                WHEN fa.currency_id != u.main_currency_id THEN
                                    t.amount * t.rate / fc.rate * uc.rate
                                ELSE
                                    t.amount * t.rate
                            END
                        ELSE
                            CASE
                                WHEN t.currency_id != u.main_currency_id THEN
                                    t.amount / c.rate * uc.rate
                                ELSE
                                    t.amount
                            END
                    END
                ) AS "prevIncome"
                FROM transactions t
                JOIN transaction_categories tc ON t.category_id = tc.id
                JOIN transaction_types tt ON tc.type_id = tt.id
                JOIN financial_accounts fa ON t.account_id = fa.id
                JOIN users u ON fa.user_id = u.id
                JOIN currencies c ON t.currency_id = c.id
                JOIN currencies fc ON fa.currency_id = fc.id
                JOIN currencies uc ON u.main_currency_id = uc.id
                ${prevValuesWhereClause} AND tt.name = 'Income'
            `;

        const prevExpenses: any = await prisma.$queryRaw`
                SELECT SUM(
                    CASE
                        WHEN t.currency_id != fa.currency_id THEN
                            CASE
                                WHEN fa.currency_id != u.main_currency_id THEN
                                    t.amount * t.rate / fc.rate * uc.rate
                                ELSE
                                    t.amount * t.rate
                            END
                        ELSE
                            CASE
                                WHEN t.currency_id != u.main_currency_id THEN
                                    t.amount / c.rate * uc.rate
                                ELSE
                                    t.amount
                            END
                    END
                ) AS "prevExpenses"
                FROM transactions t
                JOIN transaction_categories tc ON t.category_id = tc.id
                JOIN transaction_types tt ON tc.type_id = tt.id
                JOIN financial_accounts fa ON t.account_id = fa.id
                JOIN users u ON fa.user_id = u.id
                JOIN currencies c ON t.currency_id = c.id
                JOIN currencies fc ON fa.currency_id = fc.id
                JOIN currencies uc ON u.main_currency_id = uc.id
                ${prevValuesWhereClause} AND tt.name = 'Expense'
            `;

        const combinedResults = {
            prevStartDate: new Date(previousPeriod.startDate),
            prevEndDate: new Date(previousPeriod.endDate),
            prevIncome: prevIncome[0]?.prevIncome || 0,
            prevExpenses: prevExpenses[0]?.prevExpenses || 0,
            groupedTransactions
        };

        return res.status(200).json(combinedResults);
    } catch (e) {
        console.error(e);

        return res.status(500).json({ message: "Internal error" });
    }
}
);

router.get('/user/:userId', async (req, res) => {
    const userId = req.params.userId;
    const startDateStr = req.query.startDate;
    const endDateStr = req.query.endDate;

    try {
        let previousPeriod = getPreviousMonthPeriod();
        let groupedTransactionsWhereClause = Prisma.sql`WHERE fa.user_id = ${userId}`;
        if (startDateStr && startDateStr != "" && endDateStr && endDateStr != "") {
            previousPeriod = getPreviousPeriod(startDateStr as string, endDateStr as string);
            groupedTransactionsWhereClause = Prisma.sql`WHERE fa.user_id = ${userId} AND t.date >= ${startDateStr}::date AND t.date <= ${endDateStr}::date`;
        }
        let prevValuesWhereClause = Prisma.sql`WHERE fa.user_id = ${userId} AND t.date >= ${previousPeriod.startDate}::date AND t.date <= ${previousPeriod.endDate}::date`;

        const rawGroupedTransactions: any = await prisma.$queryRaw`
                SELECT DATE_TRUNC('day', t.date) AS "transactionDate",
                    SUM(
                        CASE 
                            WHEN tt.name = 'Expense' AND t.currency_id != fa.currency_id THEN t.amount * t.rate
                            WHEN tt.name = 'Expense' THEN t.amount
                            ELSE 0
                        END
                    ) AS "totalExpenses",
                    SUM(
                        CASE 
                            WHEN tt.name = 'Income' AND t.currency_id != fa.currency_id THEN t.amount * t.rate
                            WHEN tt.name = 'Income' THEN t.amount
                            ELSE 0
                        END
                    ) AS "totalIncome",
                    SUM(
                        CASE 
                            WHEN at.name = 'Asset' AND t.currency_id != fa.currency_id THEN t.amount * t.rate
                            WHEN at.name = 'Asset' THEN t.amount
                            ELSE 0
                        END
                    ) AS "assetsValue",
                    SUM(
                        CASE 
                            WHEN at.name = 'Liability' AND t.currency_id != fa.currency_id THEN t.amount * t.rate
                            WHEN at.name = 'Liability' THEN t.amount
                            ELSE 0
                        END
                    ) AS "liabilitiesValue",
                    array_agg(json_build_object(
                        'id', t.id,
                        'description', t.description,
                        'amount', t.amount,
                        'convertedAccountAmount', CASE 
                            WHEN t.currency_id != fa.currency_id THEN 
                                t.amount * t.rate
                            ELSE 
                                t.amount 
                        END,
                        'convertedMainAmount', CASE 
                            WHEN t.currency_id != fa.currency_id THEN
                                CASE
                                    WHEN fa.currency_id != u.main_currency_id THEN
                                        t.amount * t.rate / fc.rate * uc.rate
                                    ELSE
                                        t.amount * t.rate
                                END
                            ELSE
                                CASE
                                    WHEN t.currency_id != u.main_currency_id THEN
                                        t.amount / c.rate * uc.rate
                                    ELSE
                                        t.amount
                            END
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
                            'icon', tc.icon,
                            'color', tc.color,
                            'iconColor', tc.icon_color,
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
                            'icon', fa.icon,
                            'color', fa.color,
                            'iconColor', fa.icon_color,
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
                                'createdAt', ac.created_at,
                                'updatedAt', ac.updated_at,
                                'accountType', jsonb_build_object(
                                    'id', at.id,
                                    'name', at.name,
                                    'createdAt', at.created_at,
                                    'updatedAt', at.updated_at
                                )
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
                JOIN account_types at ON ac.type_id = at.id
                JOIN currencies c ON t.currency_id = c.id
                JOIN currencies fc ON fa.currency_id = fc.id
                JOIN users u ON fa.user_id = u.id
                JOIN currencies uc ON u.main_currency_id = uc.id
                ${groupedTransactionsWhereClause}
                GROUP BY "transactionDate"
                ORDER BY "transactionDate" DESC;
             `;

        const groupedTransactions = JSON.parse(JSON.stringify(rawGroupedTransactions, (_, value) =>
            typeof value === 'bigint'
                ? value.toString()
                : value
        ));

        const prevIncome: any = await prisma.$queryRaw`
            SELECT SUM(
                    CASE
                        WHEN t.currency_id != fa.currency_id THEN
                            CASE
                                WHEN fa.currency_id != u.main_currency_id THEN
                                    t.amount * t.rate / fc.rate * uc.rate
                                ELSE
                                    t.amount * t.rate
                            END
                        ELSE
                            CASE
                                WHEN t.currency_id != u.main_currency_id THEN
                                    t.amount / c.rate * uc.rate
                                ELSE
                                    t.amount
                            END
                    END
                ) AS "prevIncome"
                FROM transactions t
                JOIN transaction_categories tc ON t.category_id = tc.id
                JOIN transaction_types tt ON tc.type_id = tt.id
                JOIN financial_accounts fa ON t.account_id = fa.id
                JOIN users u ON fa.user_id = u.id
                JOIN currencies c ON t.currency_id = c.id
                JOIN currencies fc ON fa.currency_id = fc.id
                JOIN currencies uc ON u.main_currency_id = uc.id
                ${prevValuesWhereClause} AND tt.name = 'Income'
            `;

        const prevExpenses: any = await prisma.$queryRaw`
                SELECT SUM(
                    CASE
                        WHEN t.currency_id != fa.currency_id THEN
                            CASE
                                WHEN fa.currency_id != u.main_currency_id THEN
                                    t.amount * t.rate / fc.rate * uc.rate
                                ELSE
                                    t.amount * t.rate
                            END
                        ELSE
                            CASE
                                WHEN t.currency_id != u.main_currency_id THEN
                                    t.amount / c.rate * uc.rate
                                ELSE
                                    t.amount
                            END
                    END
                ) AS "prevExpenses"
                FROM transactions t
                JOIN transaction_categories tc ON t.category_id = tc.id
                JOIN transaction_types tt ON tc.type_id = tt.id
                JOIN financial_accounts fa ON t.account_id = fa.id
                JOIN users u ON fa.user_id = u.id
                JOIN currencies c ON t.currency_id = c.id
                JOIN currencies fc ON fa.currency_id = fc.id
                JOIN currencies uc ON u.main_currency_id = uc.id
                ${prevValuesWhereClause} AND tt.name = 'Expense'
            `;

        const combinedResults = {
            prevStartDate: new Date(previousPeriod.startDate),
            prevEndDate: new Date(previousPeriod.endDate),
            prevIncome: prevIncome[0]?.prevIncome || 0,
            prevExpenses: prevExpenses[0]?.prevExpenses || 0,
            groupedTransactions
        };
        
        return res.status(200).json(combinedResults);
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
    const category = req.body;

    try {
        await prisma.transactionCategory.create({
            data: category
        });

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
