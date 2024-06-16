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
        if (req.query.grouped == "daily") {
            const groupedTransactions: any = await prisma.$queryRaw`
            SELECT DATE_TRUNC('day', t.date) AS "transactionDate",
                    SUM(t.amount) AS "totalAmount",
                    array_agg(json_build_object(
                        'id', t.id,
                        'description', t.description,
                        'amount', t.amount,
                        'createdAt', t.created_at,
                        'updatedAt', t.updated_at,
                        'transactionCategory', json_build_object(
                            'id', tc.id,
                            'name', tc.name,
                            'typeId', tc.type_id,
                            'createdAt', tc.created_at,
                            'updatedAt', tc.updated_at,
                            'type', json_build_object(
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
                            'initialValue', fa.initial_value,
                            'currentValue', fa.current_value,
                            'createdAt', fa.created_at,
                            'updatedAt', fa.updated_at
                        )
                    ) ORDER BY t.created_at DESC) AS transactions
                FROM transactions t
                JOIN transaction_categories tc ON t.category_id = tc.id
                JOIN transaction_types tt ON tc.type_id = tt.id
                JOIN financial_accounts fa ON t.account_id = fa.id
                GROUP BY "transactionDate"
                ORDER BY "transactionDate" DESC;
        `;
            console.log(groupedTransactions);

            const json = JSON.parse(JSON.stringify(groupedTransactions, (_, value) =>
                typeof value === 'bigint'
                    ? value.toString()
                    : value
            ));
            return res.status(200).json(json);
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

export default router;
