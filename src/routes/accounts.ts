import { AccountCategory, AccountInvite, FinancialAccount, InviteStatus } from '@prisma/client';
import express from 'express';
import { User } from 'lucia';
import { prisma } from '../app.js';
import { ASSET_ID, LIABILITY_ID } from '../lib/constants.js';
import { RawFinancialAccount } from '../types/FinancialAccount.js';
import { createAccountPlanCheck } from '../lib/accounts.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const localUser = res.locals.user as User;
    const account = req.body.account as FinancialAccount;
    const accountInvites = req.body.accountInvites as AccountInvite[];

    if (localUser.id !== account.userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    if (!(await createAccountPlanCheck(account, localUser.mainCurrencyId))) {
      return res.status(403).json({ message: 'Limit reached' });
    }

    const newAccount = await prisma.financialAccount.create({
      data: account,
    });

    for (const accountInvite of accountInvites) {
      const user = await prisma.user.findUnique({
        where: {
          email: accountInvite.email,
        },
      });

      await prisma.accountInvite.create({
        data: {
          status: InviteStatus.PENDING,
          email: accountInvite.email,
          userId: user?.id,
          accountId: newAccount.id,
        },
      });
    }
    return res.status(200).json({ message: 'Success' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Internal error' });
  }
});

router.get('/types/:userId', async (req, res) => {
  try {
    const localUser = res.locals.user as User;
    const userId = req.params.userId;

    if (localUser.id !== userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const accountTypes = await prisma.accountType.findMany({
      include: {
        accountCategories: {
          where: {
            userId,
          },
        },
      },
    });

    return res.status(200).json(accountTypes);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Internal error' });
  }
});

router.get('/invites', async (req, res) => {
  try {
    const localUser = res.locals.user as User;

    const rawAccountInvites = await prisma.accountInvite.findMany({
      where: {
        userId: localUser.id,
        status: InviteStatus.PENDING,
      },
      include: {
        financialAccount: {
          include: {
            accountCategory: true,
            currency: true,
          },
        },
      },
    });
    const accountInvites = JSON.parse(
      JSON.stringify(rawAccountInvites, (_, value) => (typeof value === 'bigint' ? value.toString() : value)),
    );

    return res.status(200).json(accountInvites);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Internal error' });
  }
});

router.post('/invites', async (req, res) => {
  try {
    const localUser = res.locals.user as User;
    const accountInvite = req.body as AccountInvite;

    const account = await prisma.financialAccount.findUnique({
      where: {
        id: accountInvite.accountId,
      },
    });

    if (localUser.id !== account?.userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const user = await prisma.user.findUnique({
      where: {
        email: accountInvite.email,
      },
    });
    accountInvite.userId = user?.id || null;

    await prisma.accountInvite.create({
      data: accountInvite,
    });

    return res.status(200).json({ message: 'send_invite_success' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Internal error' });
  }
});

router.delete('/invites/:inviteId', async (req, res) => {
  try {
    const localUser = res.locals.user as User;
    const inviteId = req.params.inviteId as string;

    const invite = await prisma.accountInvite.findUnique({
      where: {
        id: inviteId,
      },
      include: {
        financialAccount: true,
      },
    });
    if (localUser.id !== invite?.financialAccount.userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    await prisma.accountInvite.delete({
      where: {
        id: inviteId,
      },
    });

    return res.status(200).json({ message: 'send_invite_success' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Internal error' });
  }
});

router.post('/invites/:inviteId/accept', async (req, res) => {
  try {
    const localUser = res.locals.user as User;
    const inviteId = req.params.inviteId as string;

    const accountInvite = await prisma.accountInvite.findUnique({
      where: {
        id: inviteId,
      },
    });

    if (localUser.id !== accountInvite?.userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    await prisma.accountInvite.update({
      where: {
        id: inviteId,
      },
      data: {
        status: InviteStatus.ACCEPTED,
      },
    });

    return res.status(200).json({ message: 'accept_invite_success' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Internal error' });
  }
});

router.post('/invites/:inviteId/decline', async (req, res) => {
  try {
    const localUser = res.locals.user as User;
    const inviteId = req.params.inviteId as string;

    const accountInvite = await prisma.accountInvite.findUnique({
      where: {
        id: inviteId,
      },
    });

    if (localUser.id !== accountInvite?.userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    await prisma.accountInvite.delete({
      where: {
        id: inviteId,
      },
    });

    return res.status(200).json({ message: 'decline_invite_success' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Internal error' });
  }
});

router.get('/:accountId', async (req, res) => {
  try {
    const localUser = res.locals.user as User;
    const accountId = req.params.accountId;

    const checkAccount = await prisma.financialAccount.findUnique({
      include: {
        accountInvites: true,
      },
      where: {
        id: accountId,
      },
    });
    if (!checkAccount) {
      return res.status(404).json({ message: 'Not found' });
    }
    if (
      localUser.id !== checkAccount?.userId &&
      !checkAccount?.accountInvites.some((invite) => invite.userId === localUser.id)
    ) {
      return res.status(403).json({ message: 'Forbidden' });
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
        fa.enable_income_expenses AS "enableIncomeExpenses",
        fa.created_at AS "createdAt",
        fa.updated_at AS "updatedAt",
        jsonb_build_object(
          'id',
          ac.id,
          'name',
          ac.name,
          'typeId',
          ac.type_id,
          'userId',
          ac.user_id,
          'createdAt',
          ac.created_at,
          'updatedAt',
          ac.updated_at,
          'accountType',
          jsonb_build_object(
            'id',
            at.id,
            'name',
            at.name,
            'createdAt',
            at.created_at,
            'updatedAt',
            at.updated_at
          )
        ) AS "accountCategory",
        jsonb_build_object(
          'id',
          c.id,
          'code',
          c.code,
          'name',
          c.name,
          'symbol',
          c.symbol,
          'rate',
          c.rate,
          'createdAt',
          c.created_at,
          'updatedAt',
          c.updated_at
        ) AS "currency",
        jsonb_build_object(
          'id',
          u.id,
          'name',
          u.name,
          'email',
          u.email,
          'createdAt',
          u.created_at,
          'updatedAt',
          u.updated_at
        ) AS "user",
        (
          SELECT
            fa.initial_value + COALESCE(
              SUM(
                CASE
                  WHEN t.currency_id != fa.currency_id THEN t.amount / t.rate
                  ELSE t.amount
                END
              ),
              0
            )
          FROM
            transactions t
          WHERE
            t.account_id = fa.id
        ) AS "currentValue",
        (
          SELECT
            COALESCE(
              jsonb_agg(
                jsonb_build_object(
                  'id',
                  ai.id,
                  'status',
                  ai.status,
                  'email',
                  ai.email,
                  'userId',
                  ai.user_id,
                  'accountId',
                  ai.account_id,
                  'createdAt',
                  ai.created_at,
                  'updatedAt',
                  ai.updated_at,
                  'user',
                  jsonb_build_object(
                    'id',
                    ui.id,
                    'name',
                    ui.name,
                    'email',
                    ui.email,
                    'createdAt',
                    ui.created_at,
                    'updatedAt',
                    ui.updated_at
                  )
                )
                ORDER BY
                  ai.status DESC
              ) FILTER (
                WHERE
                  ai.id IS NOT NULL
              ),
              '[]'
            )
          FROM
            account_invites ai
            LEFT JOIN users ui ON ai.user_id = ui.id
          WHERE
            ai.account_id = fa.id
        ) AS "accountInvites"
      FROM
        financial_accounts fa
        JOIN account_categories ac ON fa.category_id = ac.id
        JOIN account_types at ON ac.type_id = at.id
        JOIN currencies c ON fa.currency_id = c.id
        JOIN users u ON fa.user_id = u.id
      WHERE
        fa.id = ${accountId}
      GROUP BY
        fa.id,
        ac.id,
        at.id,
        c.id,
        u.id
    `;

    const json = JSON.parse(
      JSON.stringify(account, (_, value) => (typeof value === 'bigint' ? value.toString() : value)),
    );

    return res.status(200).json(json[0]);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Internal error' });
  }
});

router.get('/user/:userId', async (req, res) => {
  try {
    const localUser = res.locals.user as User;
    const userId = req.params.userId;
    const startDate = req.query.startDate;

    if (localUser.id !== localUser.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const rawAccounts: RawFinancialAccount[] = await prisma.$queryRaw`
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
        fa.enable_income_expenses AS "enableIncomeExpenses",
        fa.created_at AS "createdAt",
        fa.updated_at AS "updatedAt",
        jsonb_build_object(
          'id',
          ac.id,
          'name',
          ac.name,
          'typeId',
          ac.type_id,
          'userId',
          ac.user_id,
          'createdAt',
          ac.created_at,
          'updatedAt',
          ac.updated_at,
          'accountType',
          jsonb_build_object(
            'id',
            at.id,
            'name',
            at.name,
            'createdAt',
            at.created_at,
            'updatedAt',
            at.updated_at
          )
        ) AS "accountCategory",
        jsonb_build_object(
          'id',
          fc.id,
          'code',
          fc.code,
          'name',
          fc.name,
          'symbol',
          fc.symbol,
          'rate',
          fc.rate,
          'createdAt',
          fc.created_at,
          'updatedAt',
          fc.updated_at
        ) AS "currency",
        jsonb_build_object(
          'id',
          u.id,
          'name',
          u.name,
          'email',
          u.email,
          'createdAt',
          u.created_at,
          'updatedAt',
          u.updated_at
        ) AS "user",
        (
          SELECT
            fa.initial_value + COALESCE(
              SUM(
                CASE
                  WHEN t.currency_id != fa.currency_id THEN t.amount / t.rate
                  ELSE t.amount
                END
              ),
              0
            )
          FROM
            transactions t
          WHERE
            t.account_id = fa.id
        ) AS "currentValue",
        (
          SELECT
            fa.initial_value + COALESCE(
              SUM(
                CASE
                  WHEN t.date < ${startDate}::date THEN CASE
                    WHEN t.currency_id != fa.currency_id THEN t.amount / t.rate
                    ELSE t.amount
                  END
                END
              ),
              0
            )
          FROM
            transactions t
          WHERE
            t.account_id = fa.id
        ) AS "prevValue",
        (
          SELECT
            COALESCE(
              jsonb_agg(
                jsonb_build_object(
                  'id',
                  ai.id,
                  'status',
                  ai.status,
                  'email',
                  ai.email,
                  'userId',
                  ai.user_id,
                  'accountId',
                  ai.account_id,
                  'createdAt',
                  ai.created_at,
                  'updatedAt',
                  ai.updated_at,
                  'user',
                  jsonb_build_object(
                    'id',
                    ui.id,
                    'name',
                    ui.name,
                    'email',
                    ui.email,
                    'createdAt',
                    ui.created_at,
                    'updatedAt',
                    ui.updated_at
                  )
                )
                ORDER BY
                  ai.status DESC
              ) FILTER (
                WHERE
                  ai.id IS NOT NULL
              ),
              '[]'
            )
          FROM
            account_invites ai
            LEFT JOIN users ui ON ai.user_id = ui.id
          WHERE
            ai.account_id = fa.id
        ) AS "accountInvites"
      FROM
        financial_accounts fa
        JOIN account_categories ac ON fa.category_id = ac.id
        JOIN account_types at ON ac.type_id = at.id
        JOIN users u ON fa.user_id = u.id
        JOIN currencies fc ON fa.currency_id = fc.id
      WHERE
        fa.user_id = ${userId}
        OR EXISTS (
          SELECT
            1
          FROM
            account_invites
          WHERE
            account_id = fa.id
            AND user_id = ${userId}
            AND status = 'ACCEPTED'
        )
      GROUP BY
        fa.id,
        ac.id,
        at.id,
        fc.id,
        u.id
    `;
    const accounts = JSON.parse(
      JSON.stringify(rawAccounts, (_, value) => (typeof value === 'bigint' ? value.toString() : value)),
    );

    let prevAssetsValue = 0;
    let prevLiabilitiesValue = 0;
    if (startDate) {
      const prevAssetsValueQuery: { prevAssetsValue: number }[] = await prisma.$queryRaw`
        SELECT
          SUM(
            CASE
              WHEN t.currency_id != fa.currency_id THEN (t.amount / c.rate * fc.rate)
              ELSE t.amount
            END
          ) AS "prevAssetsValue"
        FROM
          transactions t
          INNER JOIN financial_accounts fa ON t.account_id = fa.id
          INNER JOIN account_categories ac ON fa.category_id = ac.id
          INNER JOIN account_types at ON ac.type_id = at.id
          LEFT JOIN currencies c ON t.currency_id = c.id
          LEFT JOIN currencies fc ON fa.currency_id = fc.id
        WHERE
          at.name = 'Asset'
          AND fa.user_id = ${userId}
          AND t.date < ${startDate}::date;
      `;
      const prevLiabilitiesValueQuery: { prevLiabilitiesValue: number }[] = await prisma.$queryRaw`
        SELECT
          SUM(
            CASE
              WHEN t.currency_id != fa.currency_id THEN t.amount / c.rate * fc.rate
              ELSE t.amount
            END
          ) AS "prevLiabilitiesValue"
        FROM
          transactions t
          INNER JOIN financial_accounts fa ON t.account_id = fa.id
          INNER JOIN account_categories ac ON fa.category_id = ac.id
          INNER JOIN account_types at ON ac.type_id = at.id
          LEFT JOIN currencies c ON t.currency_id = c.id
          LEFT JOIN currencies fc ON fa.currency_id = fc.id
        WHERE
          at.name = 'Liability'
          AND fa.user_id = ${userId}
          AND t.date < ${startDate}::date;
      `;

      prevAssetsValue = prevAssetsValueQuery[0].prevAssetsValue ? prevAssetsValueQuery[0].prevAssetsValue : 0;
      prevLiabilitiesValue = prevLiabilitiesValueQuery[0].prevLiabilitiesValue
        ? prevLiabilitiesValueQuery[0].prevLiabilitiesValue
        : 0;
    }

    const assetsInitialValues = await prisma.financialAccount.aggregate({
      _sum: {
        initialValue: true,
      },
      where: {
        accountCategory: {
          accountType: {
            id: ASSET_ID,
          },
        },
      },
    });

    const liabilitiesInitialValues = await prisma.financialAccount.aggregate({
      _sum: {
        initialValue: true,
      },
      where: {
        accountCategory: {
          accountType: {
            id: LIABILITY_ID,
          },
        },
      },
    });

    return res.status(200).json({
      accounts,
      prevAssetsValue,
      prevLiabilitiesValue,
      assetsInitialValues: Number(assetsInitialValues._sum.initialValue),
      liabilitiesInitialValues: Number(liabilitiesInitialValues._sum.initialValue),
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Internal error' });
  }
});

router.put('/:accountId', async (req, res) => {
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
      return res.status(403).json({ message: 'Forbidden' });
    }

    await prisma.financialAccount.update({
      where: {
        id: accountId,
      },
      data: updatedAccount,
    });

    return res.status(200).json({ message: 'Success' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Internal error' });
  }
});

router.delete('/:accountId', async (req, res) => {
  try {
    const localUser = res.locals.user as User;
    const accountId = req.params.accountId;

    const account = await prisma.financialAccount.findUnique({
      where: {
        id: accountId,
      },
    });

    if (localUser.id !== account?.userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    await prisma.financialAccount.delete({
      where: {
        id: accountId,
      },
    });

    return res.status(200).json({ message: 'Success' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Internal error' });
  }
});

router.post('/categories', async (req, res) => {
  try {
    const localUser = res.locals.user as User;
    const category = req.body as AccountCategory;

    if (localUser.id !== category.userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    await prisma.accountCategory.create({
      data: category,
    });

    return res.status(200).json({ message: 'Success' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Internal error' });
  }
});

router.put('/categories/:categoryId', async (req, res) => {
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
      return res.status(403).json({ message: 'Forbidden' });
    }

    await prisma.accountCategory.update({
      where: {
        id: categoryId,
      },
      data: updatedCategory,
    });

    return res.status(200).json({ message: 'Success' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Internal error' });
  }
});

router.delete('/categories/:categoryId', async (req, res) => {
  try {
    const localUser = res.locals.user as User;
    const categoryId = req.params.categoryId;

    const category = await prisma.accountCategory.findUnique({
      where: {
        id: categoryId,
      },
    });

    if (localUser.id !== category?.userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    await prisma.accountCategory.delete({
      where: {
        id: categoryId,
      },
    });

    return res.status(200).json({ message: 'Success' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Internal error' });
  }
});

export default router;
