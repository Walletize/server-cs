import { AccountCategory, FinancialAccount } from "@prisma/client";
import express from "express";
import { User } from "lucia";
import { prisma } from "../app.js";
import { seedAccountCategories } from "../prisma/seeders/accountCategories.js";

const router = express.Router();

router.post("/", async (req, res) => {
    try {
        const localUser = res.locals.user as User;
        const account = req.body as FinancialAccount;

        if (localUser.id !== account.userId) {
            return res.status(403).json({ message: "Forbidden" });
        }

        const accounts = await prisma.financialAccount.findMany({
            where: {
                userId: account.userId,
            },
        });
        const activeSubscriptions = await prisma.subscription.findMany({
            where: {
                userId: account.userId,
                status: {
                    in: ["active", "trialing"],
                },
            },
        });
        if (accounts.length >= 3 && activeSubscriptions.length === 0) {
            return res.status(403).json({ message: "Limit reached" });
        }

        await prisma.financialAccount.create({
            data: account,
        });

        return res.status(200).json({ message: "Success" });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: "Internal error" });
    }
});

router.get("/types/:userId", async (req, res) => {
    try {
        const localUser = res.locals.user as User;
        const userId = req.params.userId;

        if (localUser.id !== userId) {
            return res.status(403).json({ message: "Forbidden" });
        }

        const accountTypes = await prisma.accountType.findMany({
            include: {
                accountCategories: {
                    where: {
                        userId: userId,
                    },
                },
            },
        });

        return res.status(200).json(accountTypes);
    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: "Internal error" });
    }
});

router.get("/:accountId", async (req, res) => {
    try {
        const localUser = res.locals.user as User;
        const accountId = req.params.accountId;

        const checkAccount = await prisma.financialAccount.findUnique({
            where: {
                id: accountId,
            },
        });

        if (!checkAccount) {
            return res.status(404).json({ message: "Not found" });
        }
        if (localUser.id !== checkAccount?.userId) {
            return res.status(403).json({ message: "Forbidden" });
        }

        const account: FinancialAccount[] = await prisma.$queryRaw`
            SELECT 
                fa.id AS "id",
                fa.name AS "name",
                fa.user_id AS "userId",
                fa.category_id AS "categoryId",
                fa.initial_value AS "initialValue",
                fa.icon AS "icon",
                fa.color AS "color",
                fa.icon_color AS "iconColor",
                fa.created_at AS "createdAt",
                fa.updated_at AS "updatedAt",
                jsonb_build_object(
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
                ) AS "accountCategory",
                jsonb_build_object(
                    'id', c.id,
                    'code', c.code,
                    'name', c.name,
                    'symbol', c.symbol,
                    'rate', c.rate,
                    'createdAt', c.created_at,
                    'updatedAt', c.updated_at
                ) AS "currency",
                fa.initial_value + COALESCE(
                    SUM(
                        CASE 
                            WHEN t.currency_id != fa.currency_id THEN t.amount * t.rate
                            ELSE t.amount 
                        END
                    ), 
                0) AS "currentValue"
            FROM financial_accounts fa
            JOIN account_categories ac ON fa.category_id = ac.id
            JOIN account_types at ON ac.type_id = at.id
            JOIN currencies c ON fa.currency_id = c.id
            LEFT JOIN transactions t ON fa.id = t.account_id
            WHERE fa.id = ${accountId}
            GROUP BY fa.id, ac.id, at.id, c.id
        `;

        const json = JSON.parse(
            JSON.stringify(account, (_, value) => (typeof value === "bigint" ? value.toString() : value))
        );

        return res.status(200).json(json[0]);
    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: "Internal error" });
    }
});

router.get("/user/:userId", async (req, res) => {
    try {
        const localUser = res.locals.user as User;
        const userId = req.params.userId;
        const countTotalValues = req.query.countTotalValues;
        const startDate = req.query.startDate;

        if (localUser.id !== localUser.id) {
            return res.status(403).json({ message: "Forbidden" });
        }

        const results: { [key: string]: any } = {};

        const rawAccounts = await prisma.$queryRaw`
            SELECT 
                fa.id AS "id",
                fa.name AS "name",
                fa.user_id AS "userId",
                fa.category_id AS "categoryId",
                fa.currency_id AS "currencyId",
                fa.initial_value AS "initialValue",
                fa.icon AS "icon",
                fa.color AS "color",
                fa.icon_color AS "iconColor",
                fa.created_at AS "createdAt",
                fa.updated_at AS "updatedAt",
                jsonb_build_object(
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
                                WHEN t.currency_id != fa.currency_id THEN t.amount * t.rate
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

        const accounts = JSON.parse(
            JSON.stringify(rawAccounts, (_, value) => (typeof value === "bigint" ? value.toString() : value))
        );

        results.accounts = accounts;

        if (startDate) {
            const prevAssetsValue: { prevAssetsValue: number }[] = await prisma.$queryRaw`
                SELECT SUM(
                    CASE
                        WHEN t.currency_id != fa.currency_id THEN (t.amount / c.rate * fc.rate) + fa.initial_value
                        ELSE t.amount + fa.initial_value
                    END
                ) AS "prevAssetsValue"
                FROM transactions t
                INNER JOIN financial_accounts fa ON t.account_id = fa.id
                INNER JOIN account_categories ac ON fa.category_id = ac.id
                INNER JOIN account_types at ON ac.type_id = at.id
                LEFT JOIN currencies c ON t.currency_id = c.id
                LEFT JOIN currencies fc ON fa.currency_id = fc.id
                WHERE at.name = 'Asset' AND fa.user_id = ${userId} AND t.date < ${startDate}::date;
            `;
            const prevLiabilitiesValue: { prevLiabilitiesValue: number }[] = await prisma.$queryRaw`
                SELECT SUM(
                    CASE
                        WHEN t.currency_id != fa.currency_id THEN t.amount / c.rate * fc.rate
                        ELSE t.amount
                    END
                ) AS "prevLiabilitiesValue"
                FROM transactions t
                INNER JOIN financial_accounts fa ON t.account_id = fa.id
                INNER JOIN account_categories ac ON fa.category_id = ac.id
                INNER JOIN account_types at ON ac.type_id = at.id
                LEFT JOIN currencies c ON t.currency_id = c.id
                LEFT JOIN currencies fc ON fa.currency_id = fc.id
                WHERE at.name = 'Liability' AND fa.user_id = ${userId} AND t.date < ${startDate}::date;
            `;

            results.prevAssetsValue = prevAssetsValue[0].prevAssetsValue ? prevAssetsValue[0].prevAssetsValue : 0;
            results.prevLiabilitiesValue = prevLiabilitiesValue[0].prevLiabilitiesValue
                ? prevLiabilitiesValue[0].prevLiabilitiesValue
                : 0;
        }

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
                SUM(
                    CASE
                        WHEN t.currency_id != fa.currency_id THEN (t.amount / c.rate * fc.rate) + fa.initial_value
                        ELSE t.amount + fa.initial_value
                    END
                ) AS totalAmount
                FROM 
                    transactions t
                INNER JOIN financial_accounts fa ON t.account_id = fa.id
                LEFT JOIN currencies c ON t.currency_id = c.id
                LEFT JOIN currencies fc ON fa.currency_id = fc.id
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
                    SUM(
                        CASE
                            WHEN t.currency_id != fa.currency_id THEN t.amount / c.rate * fc.rate
                            ELSE t.amount
                        END
                    ) AS totalAmount
                    FROM 
                        transactions t
                    INNER JOIN financial_accounts fa ON t.account_id = fa.id
                    LEFT JOIN currencies c ON t.currency_id = c.id
                    LEFT JOIN currencies fc ON fa.currency_id = fc.id
                    GROUP BY 
                        account_id
                ) t ON fa.id = t.account_id
                WHERE 
                    at.name = 'Liability'
            `;

            results.totalAssets = totalAssets[0].totalAssets ? totalAssets[0].totalAssets : 0;
            results.totalLiabilities = totalLiabilities[0].totalLiabilities ? totalLiabilities[0].totalLiabilities : 0;
        }

        return res.status(200).json(results);
    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: "Internal error" });
    }
});

router.put("/:accountId", async (req, res) => {
    try {
        const localUser = res.locals.user as User;
        const accountId = req.params.accountId;
        const updatedAccount = req.body;

        const account = await prisma.financialAccount.findUnique({
            where: {
                id: accountId,
            },
        });

        if (localUser.id !== account?.userId) {
            return res.status(403).json({ message: "Forbidden" });
        }

        await prisma.financialAccount.update({
            where: {
                id: accountId,
            },
            data: updatedAccount,
        });

        return res.status(200).json({ message: "Success" });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: "Internal error" });
    }
});

router.delete("/:accountId", async (req, res) => {
    try {
        const localUser = res.locals.user as User;
        const accountId = req.params.accountId;

        const account = await prisma.financialAccount.findUnique({
            where: {
                id: accountId,
            },
        });

        if (localUser.id !== account?.userId) {
            return res.status(403).json({ message: "Forbidden" });
        }

        await prisma.financialAccount.delete({
            where: {
                id: accountId,
            },
        });

        return res.status(200).json({ message: "Success" });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: "Internal error" });
    }
});

router.post("/categories", async (req, res) => {
    try {
        const localUser = res.locals.user as User;
        const category = req.body as AccountCategory;

        if (localUser.id !== category.userId) {
            return res.status(403).json({ message: "Forbidden" });
        }

        await prisma.accountCategory.create({
            data: category,
        });

        return res.status(200).json({ message: "Success" });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: "Internal error" });
    }
});

router.put("/categories/:categoryId", async (req, res) => {
    try {
        const localUser = res.locals.user as User;
        const categoryId = req.params.categoryId;
        const updatedCategory = req.body;

        const category = await prisma.accountCategory.findUnique({
            where: {
                id: categoryId,
            },
        });

        if (localUser.id !== category?.userId) {
            return res.status(403).json({ message: "Forbidden" });
        }

        await prisma.accountCategory.update({
            where: {
                id: categoryId,
            },
            data: updatedCategory,
        });

        return res.status(200).json({ message: "Success" });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: "Internal error" });
    }
});

router.delete("/categories/:categoryId", async (req, res) => {
    try {
        const localUser = res.locals.user as User;
        const categoryId = req.params.categoryId;

        const category = await prisma.accountCategory.findUnique({
            where: {
                id: categoryId,
            },
        });

        if (localUser.id !== category?.userId) {
            return res.status(403).json({ message: "Forbidden" });
        }

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
