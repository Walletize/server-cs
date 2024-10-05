import { Prisma, Transaction, TransactionCategory } from '@prisma/client';
import express from 'express';
import { User } from 'lucia';
import { RRule } from 'rrule/dist/esm/rrule.js';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../app.js';
import { EXPENSE_ID, INCOME_ID, INCOMING_TRANSFER_ID, OUTGOING_TRANSFER_ID } from '../lib/constants.js';
import { getDateInterval, getPreviousPeriod } from '../lib/utils.js';
import { RawGroupedTransaction } from '../types/Transaction.js';
import { ChartData } from '../types/ChartData.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const localUser = res.locals.user as User;
    const transaction = req.body.transaction as Transaction;
    const selectedReccurence = req.body.selectedReccurence as string;
    const recurrenceEndDate = req.body.recurrenceEndDate as string;

    const account = await prisma.financialAccount.findUnique({
      where: {
        id: transaction.accountId,
      },
    });

    if (localUser.id !== account?.userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    if (selectedReccurence !== 'never') {
      let rrule = new RRule({
        freq: RRule.DAILY,
        dtstart: new Date(transaction.date),
        count: 0,
      });
      if (selectedReccurence === 'everyDay') {
        rrule = new RRule({
          freq: RRule.DAILY,
          dtstart: new Date(transaction.date),
          until: new Date(recurrenceEndDate),
        });
      } else if (selectedReccurence === 'everyTwoDays') {
        rrule = new RRule({
          freq: RRule.DAILY,
          interval: 2,
          dtstart: new Date(transaction.date),
          until: new Date(recurrenceEndDate),
        });
      } else if (selectedReccurence === 'everyWeekday') {
        rrule = new RRule({
          freq: RRule.DAILY,
          byweekday: [RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR],
          dtstart: new Date(transaction.date),
          until: new Date(recurrenceEndDate),
        });
      } else if (selectedReccurence === 'everyWeekend') {
        rrule = new RRule({
          freq: RRule.DAILY,
          byweekday: [RRule.SA, RRule.SU],
          dtstart: new Date(transaction.date),
          until: new Date(recurrenceEndDate),
        });
      } else if (selectedReccurence === 'everyWeek') {
        rrule = new RRule({
          freq: RRule.WEEKLY,
          dtstart: new Date(transaction.date),
          until: new Date(recurrenceEndDate),
        });
      } else if (selectedReccurence === 'everyTwoWeeks') {
        rrule = new RRule({
          freq: RRule.WEEKLY,
          interval: 2,
          dtstart: new Date(transaction.date),
          until: new Date(recurrenceEndDate),
        });
      } else if (selectedReccurence === 'everyFourWeeks') {
        rrule = new RRule({
          freq: RRule.WEEKLY,
          interval: 4,
          dtstart: new Date(transaction.date),
          until: new Date(recurrenceEndDate),
        });
      } else if (selectedReccurence === 'everyMonth') {
        rrule = new RRule({
          freq: RRule.MONTHLY,
          dtstart: new Date(transaction.date),
          until: new Date(recurrenceEndDate),
        });
      } else if (selectedReccurence === 'everyTwoMonths') {
        rrule = new RRule({
          freq: RRule.MONTHLY,
          interval: 2,
          dtstart: new Date(transaction.date),
          until: new Date(recurrenceEndDate),
        });
      } else if (selectedReccurence === 'everyThreeMonths') {
        rrule = new RRule({
          freq: RRule.MONTHLY,
          interval: 3,
          dtstart: new Date(transaction.date),
          until: new Date(recurrenceEndDate),
        });
      } else if (selectedReccurence === 'everySixMonths') {
        rrule = new RRule({
          freq: RRule.MONTHLY,
          interval: 6,
          dtstart: new Date(transaction.date),
          until: new Date(recurrenceEndDate),
        });
      } else if (selectedReccurence === 'everyYear') {
        rrule = new RRule({
          freq: RRule.YEARLY,
          dtstart: new Date(transaction.date),
          until: new Date(recurrenceEndDate),
        });
      }

      const uuid = uuidv4();
      const recurringTransactions: Transaction[] = rrule.all().map((date) => {
        const recurringTransaction = {
          ...transaction,
          date,
          recurrenceId: uuid,
        };
        return recurringTransaction;
      });

      await prisma.transaction.createMany({
        data: recurringTransactions,
      });
    } else {
      await prisma.transaction.create({
        data: transaction,
      });
    }

    return res.status(200).json({ message: 'Success' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Internal error' });
  }
});

router.post('/transfer', async (req, res) => {
  try {
    const localUser = res.locals.user as User;
    const originAccountId = req.body.originAccountId as string;
    const originAccountCurrencyId = req.body.originAccountCurrencyId as string;
    const destinationAccountId = req.body.destinationAccountId as string;
    const destinationAccountCurrencyId = req.body.destinationAccountCurrencyId as string;
    const selectedCurrencyId = req.body.selectedCurrencyId as string;
    const date = req.body.date as string;
    const amount = req.body.amount as number;
    const rate = req.body.rate as number | null;
    const categoryId = req.body.categoryId as string | null;
    const typeId = req.body.typeId as string | null;

    const originAccount = await prisma.financialAccount.findUnique({
      where: {
        id: originAccountId,
      },
    });
    const destinationAccount = await prisma.financialAccount.findUnique({
      where: {
        id: destinationAccountId,
      },
    });

    if (localUser.id !== originAccount?.userId || localUser.id !== destinationAccount?.userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const originTranasaction = await prisma.transaction.create({
      data: {
        date,
        amount: -amount,
        rate: selectedCurrencyId !== originAccountCurrencyId ? rate : null,
        accountId: originAccountId,
        currencyId: selectedCurrencyId,
        categoryId: typeId === EXPENSE_ID && categoryId ? categoryId : OUTGOING_TRANSFER_ID,
      },
    });
    const destinationTranasaction = await prisma.transaction.create({
      data: {
        date,
        amount,
        rate: selectedCurrencyId !== destinationAccountCurrencyId ? rate : null,
        accountId: destinationAccountId,
        currencyId: selectedCurrencyId,
        categoryId: typeId === INCOME_ID && categoryId ? categoryId : INCOMING_TRANSFER_ID,
      },
    });
    await prisma.transactionTransfer.create({
      data: {
        originTransactionId: originTranasaction.id,
        destinationTransactionId: destinationTranasaction.id,
      },
    });

    return res.status(200).json({ message: 'Success' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Internal error' });
  }
});

router.post('/update', async (req, res) => {
  try {
    const localUser = res.locals.user as User;
    const description = req.body.description;
    const date = req.body.date;
    const newValue = req.body.newValue;
    const rate = req.body.rate;
    const currencyId = req.body.currencyId;
    const accountId = req.body.accountId;

    const account = await prisma.financialAccount.findUnique({
      where: {
        id: accountId,
      },
    });

    if (localUser.id !== account?.userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const result = await prisma.transaction.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        accountId,
      },
    });
    if (!result._sum.amount) {
      return res.status(500).json();
    }

    await prisma.transaction.create({
      data: {
        description,
        date,
        amount: newValue - Number(result._sum.amount),
        rate,
        accountId,
        currencyId,
        categoryId: '8e46c952-3378-49f6-bcfa-377351882dad',
      },
    });

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

    const transactionTypes = await prisma.transactionType.findMany({
      include: {
        transactionCategories: {
          where: {
            userId,
          },
        },
      },
    });

    return res.status(200).json(transactionTypes);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Internal error' });
  }
});

router.get('/account/:accountId', async (req, res) => {
  try {
    const localUser = res.locals.user as User;
    const accountId = req.params.accountId as string;
    const startDateStr = req.query.startDate as string | undefined;
    const endDateStr = req.query.endDate as string | undefined;
    const page = req.query.page as string | undefined;
    const isRanged = startDateStr && startDateStr !== '' && endDateStr && endDateStr !== '';
    const previousPeriod = isRanged ? getPreviousPeriod(startDateStr, endDateStr) : null;

    const account = await prisma.financialAccount.findUnique({
      where: {
        id: accountId,
      },
    });

    if (localUser.id !== account?.userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const transactionsStartEndDate: [{ max: Date | null; min: Date | null }] = await prisma.$queryRaw`
      SELECT
        MAX(t.date),
        MIN(t.date)
      FROM
        "transactions" t
        JOIN "financial_accounts" fa ON t."account_id" = fa."id"
      WHERE
        "account_id" = ${accountId}
    `;
    const transactionsStartDate = transactionsStartEndDate[0].min || new Date();
    transactionsStartDate.setDate(transactionsStartDate.getDate() - 1);
    const transactionsEndDate = transactionsStartEndDate[0].max || new Date();

    const rawGroupedTransactions: RawGroupedTransaction[] = await prisma.$queryRaw`
      SELECT
        DATE_TRUNC('day', t.date) AS "transactionDate",
        array_agg(
          json_build_object(
            'id',
            t.id,
            'description',
            t.description,
            'amount',
            t.amount,
            'convertedAmount',
            CASE
              WHEN t.currency_id != fa.currency_id THEN t.amount / t.rate
              ELSE t.amount
            END,
            'date',
            t.date,
            'rate',
            t.rate,
            'accountId',
            t.account_id,
            'currencyId',
            t.currency_id,
            'recurrenceId',
            t.recurrence_id,
            'createdAt',
            t.created_at,
            'updatedAt',
            t.updated_at,
            'transactionCategory',
            json_build_object(
              'id',
              tc.id,
              'name',
              tc.name,
              'typeId',
              tc.type_id,
              'icon',
              tc.icon,
              'color',
              tc.color,
              'iconColor',
              tc.icon_color,
              'createdAt',
              tc.created_at,
              'updatedAt',
              tc.updated_at,
              'transactionType',
              json_build_object(
                'id',
                tt.id,
                'name',
                tt.name,
                'createdAt',
                tt.created_at,
                'updatedAt',
                tt.updated_at
              )
            ),
            'financialAccount',
            json_build_object(
              'id',
              fa.id,
              'name',
              fa.name,
              'userId',
              fa.user_id,
              'categoryId',
              fa.category_id,
              'currencyId',
              fa.currency_id,
              'initialValue',
              fa.initial_value,
              'icon',
              fa.icon,
              'color',
              fa.color,
              'iconColor',
              fa.icon_color,
              'createdAt',
              fa.created_at,
              'updatedAt',
              fa.updated_at,
              'currency',
              json_build_object(
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
              ),
              'accountCategory',
              json_build_object(
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
              )
            ),
            'currency',
            json_build_object(
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
            )
          )
          ORDER BY
            t.created_at DESC
        ) AS transactions
      FROM
        transactions t
        JOIN transaction_categories tc ON t.category_id = tc.id
        JOIN transaction_types tt ON tc.type_id = tt.id
        JOIN financial_accounts fa ON t.account_id = fa.id
        JOIN account_categories ac ON fa.category_id = ac.id
        JOIN account_types at ON ac.type_id = at.id
        JOIN currencies c ON t.currency_id = c.id
        JOIN currencies fc ON fa.currency_id = fc.id
        JOIN users u ON fa.user_id = u.id
        JOIN currencies uc ON u.main_currency_id = uc.id
      WHERE
        account_id = ${accountId} ${previousPeriod
        ? Prisma.sql`
            AND t.date >= ${startDateStr}::date
            AND t.date <= ${endDateStr}::date
          `
        : Prisma.sql``}
      GROUP BY
        "transactionDate"
      ORDER BY
        "transactionDate" DESC
      LIMIT
        10
      OFFSET
        ${page ? (parseInt(page) - 1) * 10 : 0};
    `;
    const groupedTransactions = JSON.parse(
      JSON.stringify(rawGroupedTransactions, (_, value) => (typeof value === 'bigint' ? value.toString() : value)),
    );

    const rawGroupedTransactionsCount: [{ count: bigint }] = await prisma.$queryRaw`
      SELECT
        COUNT(*)
      FROM
        (
          SELECT
            DATE_TRUNC('day', t.date) AS "transactionDate"
          FROM
            transactions t
            JOIN transaction_categories tc ON t.category_id = tc.id
            JOIN transaction_types tt ON tc.type_id = tt.id
            JOIN financial_accounts fa ON t.account_id = fa.id
            JOIN account_categories ac ON fa.category_id = ac.id
            JOIN account_types at ON ac.type_id = at.id
            JOIN currencies c ON t.currency_id = c.id
            JOIN currencies fc ON fa.currency_id = fc.id
            JOIN users u ON fa.user_id = u.id
            JOIN currencies uc ON u.main_currency_id = uc.id
          WHERE
            account_id = ${accountId} ${previousPeriod
        ? Prisma.sql`
            AND t.date >= ${startDateStr}::date
            AND t.date <= ${endDateStr}::date
          `
        : Prisma.sql``}
          GROUP BY
            "transactionDate"
        ) AS groupedTransactions;
    `;
    const groupedTransactionsCount = Number(rawGroupedTransactionsCount[0].count);

    let prevIncome = 0;
    let prevExpenses = 0;
    if (previousPeriod) {
      const rawPrevIncome: { prevIncome: number | null }[] = await prisma.$queryRaw`
        SELECT
          SUM(
            CASE
              WHEN t.currency_id != fa.currency_id THEN t.amount / t.rate
              ELSE t.amount
            END
          ) AS "prevIncome"
        FROM
          transactions t
          JOIN transaction_categories tc ON t.category_id = tc.id
          JOIN transaction_types tt ON tc.type_id = tt.id
          JOIN financial_accounts fa ON t.account_id = fa.id
          JOIN users u ON fa.user_id = u.id
          JOIN currencies c ON t.currency_id = c.id
          JOIN currencies fc ON fa.currency_id = fc.id
          JOIN currencies uc ON u.main_currency_id = uc.id
        WHERE
          account_id = ${accountId}
          AND t.date >= ${previousPeriod.startDate}::date
          AND t.date <= ${previousPeriod.endDate}::date
          AND tt.name = 'Income'
      `;
      prevIncome = rawPrevIncome[0].prevIncome || 0;

      const rawPrevExpenses: { prevExpenses: number | null }[] = await prisma.$queryRaw`
        SELECT
          SUM(
            CASE
              WHEN t.currency_id != fa.currency_id THEN t.amount / t.rate
              ELSE t.amount
            END
          ) AS "prevExpenses"
        FROM
          transactions t
          JOIN transaction_categories tc ON t.category_id = tc.id
          JOIN transaction_types tt ON tc.type_id = tt.id
          JOIN financial_accounts fa ON t.account_id = fa.id
          JOIN users u ON fa.user_id = u.id
          JOIN currencies c ON t.currency_id = c.id
          JOIN currencies fc ON fa.currency_id = fc.id
          JOIN currencies uc ON u.main_currency_id = uc.id
        WHERE
          account_id = ${accountId}
          AND t.date >= ${previousPeriod.startDate}::date
          AND t.date <= ${previousPeriod.endDate}::date
          AND tt.name = 'Expense'
      `;
      prevExpenses = rawPrevExpenses[0].prevExpenses || 0;
    }

    const chartData = await prisma.$queryRaw`
      WITH
        date_series AS (
          SELECT
            generate_series(
              ${isRanged ? startDateStr : transactionsStartDate}::date,
              ${isRanged ? endDateStr : transactionsEndDate}::date - interval '1 day',
              ${isRanged
        ? getDateInterval(new Date(startDateStr), new Date(endDateStr))
        : getDateInterval(transactionsStartDate, transactionsEndDate)}::interval
            )::date AS date
          UNION
          SELECT
            ${isRanged ? endDateStr : transactionsEndDate}::date AS date
        ),
        all_dates AS (
          SELECT
            generate_series(
              ${isRanged ? startDateStr : transactionsStartDate}::date,
              ${isRanged ? endDateStr : transactionsEndDate}::date,
              '1 day'::interval
            )::date AS date
        ),
        aggregated_data AS (
          SELECT
            ad.date,
            COALESCE(
              SUM(
                CASE
                  WHEN t.currency_id != fa.currency_id THEN t.amount / t.rate
                  ELSE t.amount
                END
              ),
              0
            ) AS totalAmount,
            COALESCE(
              SUM(
                CASE
                  WHEN tt."name" = 'Income' THEN CASE
                    WHEN t.currency_id != fa.currency_id THEN t.amount / t.rate
                    ELSE t.amount
                  END
                  ELSE 0
                END
              ),
              0
            ) AS totalIncome,
            COALESCE(
              SUM(
                CASE
                  WHEN tt."name" = 'Expense' THEN CASE
                    WHEN t.currency_id != fa.currency_id THEN t.amount / t.rate
                    ELSE t.amount
                  END
                  ELSE 0
                END
              ),
              0
            ) AS totalExpenses
          FROM
            all_dates ad
            LEFT JOIN "transactions" t ON ad.date = t.date
            LEFT JOIN "transaction_categories" tc ON t."category_id" = tc."id"
            LEFT JOIN "transaction_types" tt ON tc."type_id" = tt."id"
            LEFT JOIN "financial_accounts" fa ON t."account_id" = fa."id"
            LEFT JOIN "account_categories" ac ON fa."category_id" = ac."id"
            LEFT JOIN "account_types" at ON ac."type_id" = at."id"
            LEFT JOIN "users" u ON fa."user_id" = u."id"
            LEFT JOIN "currencies" ca ON fa."currency_id" = ca."id"
            LEFT JOIN "currencies" cu ON u."main_currency_id" = cu."id"
          WHERE
            (
              t."account_id" = ${accountId}
              OR fa."id" IS NULL
            )
          GROUP BY
            ad.date
          ORDER BY
            ad.date
        ),
        cumulative_data AS (
          SELECT
            date,
            SUM(totalAmount) OVER (
              ORDER BY
                date
            ) + ${account.initialValue} AS "cumulativeAmount",
            SUM(totalIncome) OVER (
              ORDER BY
                date
            ) AS "cumulativeIncome",
            SUM(totalExpenses) OVER (
              ORDER BY
                date
            ) AS "cumulativeExpenses"
          FROM
            aggregated_data
        )
      SELECT
        cd.date,
        cd."cumulativeAmount",
        cd."cumulativeIncome",
        cd."cumulativeExpenses"
      FROM
        cumulative_data cd
        JOIN date_series ds ON cd.date = ds.date
      ORDER BY
        cd.date;
    `;

    const combinedResults = {
      prevStartDate: previousPeriod ? new Date(previousPeriod.startDate) : null,
      prevEndDate: previousPeriod ? new Date(previousPeriod.endDate) : null,
      prevIncome,
      prevExpenses,
      groupedTransactions,
      groupedTransactionsCount,
      chartData,
    };

    return res.status(200).json(combinedResults);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Internal error' });
  }
});

router.get('/user/:userId', async (req, res) => {
  try {
    const localUser = res.locals.user as User;
    const userId = req.params.userId as string;
    const startDateStr = req.query.startDate as string | undefined;
    const endDateStr = req.query.endDate as string | undefined;
    const page = req.query.page as string | undefined;
    const isRanged = startDateStr && startDateStr !== '' && endDateStr && endDateStr !== '';
    const previousPeriod = isRanged ? getPreviousPeriod(startDateStr, endDateStr) : null;

    if (localUser.id !== userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const transactionsStartEndDate: [{ max: Date | null; min: Date | null }] = await prisma.$queryRaw`
      SELECT
        MAX(t.date),
        MIN(t.date)
      FROM
        "transactions" t
        JOIN "financial_accounts" fa ON t."account_id" = fa."id"
      WHERE
        fa."user_id" = ${userId}
    `;
    const transactionsStartDate = transactionsStartEndDate[0].min || new Date();
    transactionsStartDate.setDate(transactionsStartDate.getDate() - 1);
    const transactionsEndDate = transactionsStartEndDate[0].max || new Date();

    const rawGroupedTransactions: RawGroupedTransaction[] = await prisma.$queryRaw`
      SELECT
        DATE_TRUNC('day', t.date) AS "transactionDate",
        array_agg(
          json_build_object(
            'id',
            t.id,
            'description',
            t.description,
            'amount',
            t.amount,
            'convertedAmount',
            CASE
              WHEN t.currency_id != fa.currency_id THEN t.amount / t.rate
              ELSE t.amount
            END,
            'date',
            t.date,
            'rate',
            t.rate,
            'accountId',
            t.account_id,
            'currencyId',
            t.currency_id,
            'recurrenceId',
            t.recurrence_id,
            'createdAt',
            t.created_at,
            'updatedAt',
            t.updated_at,
            'transactionCategory',
            json_build_object(
              'id',
              tc.id,
              'name',
              tc.name,
              'typeId',
              tc.type_id,
              'icon',
              tc.icon,
              'color',
              tc.color,
              'iconColor',
              tc.icon_color,
              'createdAt',
              tc.created_at,
              'updatedAt',
              tc.updated_at,
              'transactionType',
              json_build_object(
                'id',
                tt.id,
                'name',
                tt.name,
                'createdAt',
                tt.created_at,
                'updatedAt',
                tt.updated_at
              )
            ),
            'financialAccount',
            json_build_object(
              'id',
              fa.id,
              'name',
              fa.name,
              'userId',
              fa.user_id,
              'categoryId',
              fa.category_id,
              'currencyId',
              fa.currency_id,
              'initialValue',
              fa.initial_value,
              'icon',
              fa.icon,
              'color',
              fa.color,
              'iconColor',
              fa.icon_color,
              'createdAt',
              fa.created_at,
              'updatedAt',
              fa.updated_at,
              'currency',
              json_build_object(
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
              ),
              'accountCategory',
              json_build_object(
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
              )
            ),
            'currency',
            json_build_object(
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
            )
          )
          ORDER BY
            t.created_at DESC
        ) AS transactions
      FROM
        transactions t
        JOIN transaction_categories tc ON t.category_id = tc.id
        JOIN transaction_types tt ON tc.type_id = tt.id
        JOIN financial_accounts fa ON t.account_id = fa.id
        JOIN account_categories ac ON fa.category_id = ac.id
        JOIN account_types at ON ac.type_id = at.id
        JOIN currencies c ON t.currency_id = c.id
        JOIN currencies fc ON fa.currency_id = fc.id
        JOIN users u ON fa.user_id = u.id
        JOIN currencies uc ON u.main_currency_id = uc.id
      WHERE
        fa.user_id = ${userId} ${previousPeriod
        ? Prisma.sql`
            AND t.date >= ${startDateStr}::date
            AND t.date <= ${endDateStr}::date
          `
        : Prisma.sql``}
      GROUP BY
        "transactionDate"
      ORDER BY
        "transactionDate" DESC
      LIMIT
        10
      OFFSET
        ${page ? (parseInt(page) - 1) * 10 : 0};
    `;
    const groupedTransactions: RawGroupedTransaction[] = JSON.parse(
      JSON.stringify(rawGroupedTransactions, (_, value) => (typeof value === 'bigint' ? value.toString() : value)),
    );

    const rawGroupedTransactionsCount: [{ count: bigint }] = await prisma.$queryRaw`
      SELECT
        COUNT(*)
      FROM
        (
          SELECT
            DATE_TRUNC('day', t.date) AS "transactionDate"
          FROM
            transactions t
            JOIN transaction_categories tc ON t.category_id = tc.id
            JOIN transaction_types tt ON tc.type_id = tt.id
            JOIN financial_accounts fa ON t.account_id = fa.id
            JOIN account_categories ac ON fa.category_id = ac.id
            JOIN account_types at ON ac.type_id = at.id
            JOIN currencies c ON t.currency_id = c.id
            JOIN currencies fc ON fa.currency_id = fc.id
            JOIN users u ON fa.user_id = u.id
            JOIN currencies uc ON u.main_currency_id = uc.id
          WHERE
            fa.user_id = ${userId} ${previousPeriod
        ? Prisma.sql`
            AND t.date >= ${startDateStr}::date
            AND t.date <= ${endDateStr}::date
          `
        : Prisma.sql``}
          GROUP BY
            "transactionDate"
        ) AS groupedTransactions;
    `;
    const groupedTransactionsCount = Number(rawGroupedTransactionsCount[0].count);

    let prevIncome = 0;
    let prevExpenses = 0;
    let prevAssetsValue = 0;
    let prevLiabilitiesValue = 0;
    if (previousPeriod) {
      const rawPrevIncome: { prevIncome: number | null }[] = await prisma.$queryRaw`
        SELECT
          SUM(
            CASE
              WHEN t.currency_id != fa.currency_id THEN CASE
                WHEN fa.currency_id != u.main_currency_id THEN t.amount * t.rate / fc.rate * uc.rate
                ELSE t.amount / t.rate
              END
              ELSE CASE
                WHEN t.currency_id != u.main_currency_id THEN t.amount / c.rate * uc.rate
                ELSE t.amount
              END
            END
          ) AS "prevIncome"
        FROM
          transactions t
          JOIN transaction_categories tc ON t.category_id = tc.id
          JOIN transaction_types tt ON tc.type_id = tt.id
          JOIN financial_accounts fa ON t.account_id = fa.id
          JOIN users u ON fa.user_id = u.id
          JOIN currencies c ON t.currency_id = c.id
          JOIN currencies fc ON fa.currency_id = fc.id
          JOIN currencies uc ON u.main_currency_id = uc.id
        WHERE
          fa.user_id = ${userId}
          AND t.date >= ${previousPeriod.startDate}::date
          AND t.date <= ${previousPeriod.endDate}::date
          AND tt.name = 'Income'
      `;
      prevIncome = rawPrevIncome[0].prevIncome || 0;

      const rawPrevExpenses: { prevExpenses: number | null }[] = await prisma.$queryRaw`
        SELECT
          SUM(
            CASE
              WHEN t.currency_id != fa.currency_id THEN CASE
                WHEN fa.currency_id != u.main_currency_id THEN t.amount * t.rate / fc.rate * uc.rate
                ELSE t.amount / t.rate
              END
              ELSE CASE
                WHEN t.currency_id != u.main_currency_id THEN t.amount / c.rate * uc.rate
                ELSE t.amount
              END
            END
          ) AS "prevExpenses"
        FROM
          transactions t
          JOIN transaction_categories tc ON t.category_id = tc.id
          JOIN transaction_types tt ON tc.type_id = tt.id
          JOIN financial_accounts fa ON t.account_id = fa.id
          JOIN users u ON fa.user_id = u.id
          JOIN currencies c ON t.currency_id = c.id
          JOIN currencies fc ON fa.currency_id = fc.id
          JOIN currencies uc ON u.main_currency_id = uc.id
        WHERE
          fa.user_id = ${userId}
          AND t.date >= ${previousPeriod.startDate}::date
          AND t.date <= ${previousPeriod.endDate}::date
          AND tt.name = 'Expense'
      `;
      prevExpenses = rawPrevExpenses[0].prevExpenses || 0;

      const rawPrevAssetsValue: { prevAssetsValue: number | null }[] = await prisma.$queryRaw`
        SELECT
          SUM(
            CASE
              WHEN t."currency_id" != fa."currency_id" THEN CASE
                WHEN fa."currency_id" = u."main_currency_id" THEN (t."amount" / t."rate")
                ELSE (t."amount" / t."rate" / ca."rate" * cu."rate")
              END
              ELSE CASE
                WHEN fa."currency_id" = u."main_currency_id" THEN (t."amount")
                ELSE (t."amount" / ca."rate" * cu."rate")
              END
            END
          ) AS "prevAssetsValue"
        FROM
          transactions t
          JOIN "financial_accounts" fa ON t."account_id" = fa."id"
          JOIN "account_categories" ac ON fa."category_id" = ac."id"
          JOIN "account_types" at ON ac."type_id" = at."id"
          JOIN "users" u ON fa."user_id" = u."id"
          JOIN "currencies" ca ON fa."currency_id" = ca."id"
          JOIN "currencies" cu ON u."main_currency_id" = cu."id"
        WHERE
          at.name = 'Asset'
          AND fa.user_id = ${userId}
          AND t.date <= ${previousPeriod.endDate}::date;
      `;
      prevAssetsValue = rawPrevAssetsValue[0].prevAssetsValue || 0;

      const rawPrevLiabilitiesValue: { prevLiabilitiesValue: number | null }[] = await prisma.$queryRaw`
        SELECT
          SUM(
            CASE
              WHEN t."currency_id" != fa."currency_id" THEN CASE
                WHEN fa."currency_id" = u."main_currency_id" THEN (t."amount" / t."rate")
                ELSE (t."amount" / t."rate" / ca."rate" * cu."rate")
              END
              ELSE CASE
                WHEN fa."currency_id" = u."main_currency_id" THEN (t."amount")
                ELSE (t."amount" / ca."rate" * cu."rate")
              END
            END
          ) AS "prevLiabilitiesValue"
        FROM
          transactions t
          JOIN "financial_accounts" fa ON t."account_id" = fa."id"
          JOIN "account_categories" ac ON fa."category_id" = ac."id"
          JOIN "account_types" at ON ac."type_id" = at."id"
          JOIN "users" u ON fa."user_id" = u."id"
          JOIN "currencies" ca ON fa."currency_id" = ca."id"
          JOIN "currencies" cu ON u."main_currency_id" = cu."id"
        WHERE
          at.name = 'Liability'
          AND fa.user_id = ${userId}
          AND t.date <= ${previousPeriod.endDate}::date;
      `;
      prevLiabilitiesValue = rawPrevLiabilitiesValue[0].prevLiabilitiesValue || 0;
    }

    const chartData: ChartData[] = await prisma.$queryRaw`
      WITH
        date_series AS (
          SELECT
            generate_series(
              ${isRanged ? startDateStr : transactionsStartDate}::date,
              ${isRanged ? endDateStr : transactionsEndDate}::date - interval '1 day',
              ${isRanged
        ? getDateInterval(new Date(startDateStr), new Date(endDateStr))
        : getDateInterval(transactionsStartDate, transactionsEndDate)}::interval
            )::date AS date
          UNION
          SELECT
            ${isRanged ? endDateStr : transactionsEndDate}::date AS date
        ),
        all_dates AS (
          SELECT
            generate_series(
              ${isRanged ? startDateStr : transactionsStartDate}::date,
              ${isRanged ? endDateStr : transactionsEndDate}::date,
              '1 day'::interval
            )::date AS date
        ),
        aggregated_data AS (
          SELECT
            ad.date,
            COALESCE(
              SUM(
                CASE
                  WHEN t."currency_id" != fa."currency_id" THEN CASE
                    WHEN fa."currency_id" = u."main_currency_id" THEN (t."amount" / t."rate")
                    ELSE (t."amount" / t."rate" / ca."rate" * cu."rate")
                  END
                  ELSE CASE
                    WHEN fa."currency_id" = u."main_currency_id" THEN (t."amount")
                    ELSE (t."amount" / ca."rate" * cu."rate")
                  END
                END
              ),
              0
            ) AS totalAmount,
            COALESCE(
              SUM(
                CASE
                  WHEN tt."name" = 'Income' THEN CASE
                    WHEN t."currency_id" != fa."currency_id" THEN CASE
                      WHEN fa."currency_id" = u."main_currency_id" THEN (t."amount" / t."rate")
                      ELSE (t."amount" / t."rate" / ca."rate" * cu."rate")
                    END
                    ELSE CASE
                      WHEN fa."currency_id" = u."main_currency_id" THEN (t."amount")
                      ELSE (t."amount" / ca."rate" * cu."rate")
                    END
                  END
                  ELSE 0
                END
              ),
              0
            ) AS totalIncome,
            COALESCE(
              SUM(
                CASE
                  WHEN tt."name" = 'Expense' THEN CASE
                    WHEN t."currency_id" != fa."currency_id" THEN CASE
                      WHEN fa."currency_id" = u."main_currency_id" THEN ABS(t."amount" / t."rate")
                      ELSE ABS(t."amount" / t."rate" / ca."rate" * cu."rate")
                    END
                    ELSE CASE
                      WHEN fa."currency_id" = u."main_currency_id" THEN ABS(t."amount")
                      ELSE ABS(t."amount" / ca."rate" * cu."rate")
                    END
                  END
                  ELSE 0
                END
              ),
              0
            ) AS totalExpenses,
            COALESCE(
              SUM(
                CASE
                  WHEN at."name" = 'Asset' THEN CASE
                    WHEN t."currency_id" != fa."currency_id" THEN CASE
                      WHEN fa."currency_id" = u."main_currency_id" THEN (t."amount" / t."rate")
                      ELSE (t."amount" / t."rate" / ca."rate" * cu."rate")
                    END
                    ELSE CASE
                      WHEN fa."currency_id" = u."main_currency_id" THEN (t."amount")
                      ELSE (t."amount" / ca."rate" * cu."rate")
                    END
                  END
                  ELSE 0
                END
              ),
              0
            ) AS totalAssetsTransactions,
            COALESCE(
              SUM(
                CASE
                  WHEN at."name" = 'Liability' THEN CASE
                    WHEN t."currency_id" != fa."currency_id" THEN CASE
                      WHEN fa."currency_id" = u."main_currency_id" THEN (t."amount" / t."rate")
                      ELSE (t."amount" / t."rate" / ca."rate" * cu."rate")
                    END
                    ELSE CASE
                      WHEN fa."currency_id" = u."main_currency_id" THEN (t."amount")
                      ELSE (t."amount" / ca."rate" * cu."rate")
                    END
                  END
                  ELSE 0
                END
              ),
              0
            ) AS totalLiabilitiesTransactions
          FROM
            all_dates ad
            LEFT JOIN "transactions" t ON ad.date = t.date
            LEFT JOIN "transaction_categories" tc ON t."category_id" = tc."id"
            LEFT JOIN "transaction_types" tt ON tc."type_id" = tt."id"
            LEFT JOIN "financial_accounts" fa ON t."account_id" = fa."id"
            LEFT JOIN "account_categories" ac ON fa."category_id" = ac."id"
            LEFT JOIN "account_types" at ON ac."type_id" = at."id"
            LEFT JOIN "users" u ON fa."user_id" = u."id"
            LEFT JOIN "currencies" ca ON fa."currency_id" = ca."id"
            LEFT JOIN "currencies" cu ON u."main_currency_id" = cu."id"
          WHERE
            (
              fa."user_id" = ${userId}
              OR fa."user_id" IS NULL
            )
          GROUP BY
            ad.date
          ORDER BY
            ad.date
        ),
        initial_value_sum AS (
          SELECT
            COALESCE(
              SUM(
                CASE
                  WHEN at."name" = 'Asset' THEN CASE
                    WHEN fa."currency_id" = u."main_currency_id" THEN fa."initial_value"
                    ELSE fa."initial_value" / ca."rate" * cu."rate"
                  END
                  ELSE 0
                END
              ),
              0
            ) AS assetsInitialValueSum,
            COALESCE(
              SUM(
                CASE
                  WHEN at."name" = 'Liability' THEN CASE
                    WHEN fa."currency_id" = u."main_currency_id" THEN fa."initial_value"
                    ELSE fa."initial_value" / ca."rate" * cu."rate"
                  END
                  ELSE 0
                END
              ),
              0
            ) AS liabilitiesInitialValueSum
          FROM
            "financial_accounts" fa
            LEFT JOIN "account_categories" ac ON fa."category_id" = ac."id"
            LEFT JOIN "account_types" at ON ac."type_id" = at."id"
            LEFT JOIN "users" u ON fa."user_id" = u."id"
            LEFT JOIN "currencies" ca ON fa."currency_id" = ca."id"
            LEFT JOIN "currencies" cu ON u."main_currency_id" = cu."id"
          WHERE
            fa."user_id" = ${userId}
        ),
        cumulative_data AS (
          SELECT
            ag.date,
            SUM(ag.totalAmount) OVER (
              ORDER BY
                ag.date
            ) + ivs.assetsInitialValueSum + ivs.liabilitiesInitialValueSum + ${prevAssetsValue} + ${prevLiabilitiesValue} AS "cumulativeAmount",
            SUM(ag.totalIncome) OVER (
              ORDER BY
                ag.date
            ) AS "cumulativeIncome",
            SUM(ag.totalExpenses) OVER (
              ORDER BY
                ag.date
            ) AS "cumulativeExpenses",
            SUM(ag.totalAssetsTransactions) OVER (
              ORDER BY
                ag.date
            ) + ivs.assetsInitialValueSum + ${prevAssetsValue} AS "cumulativeAssetsTransactions",
            SUM(ag.totalLiabilitiesTransactions) OVER (
              ORDER BY
                ag.date
            ) + ivs.liabilitiesInitialValueSum + ${prevLiabilitiesValue} AS "cumulativeLiabilitiesTransactions"
          FROM
            aggregated_data ag,
            initial_value_sum ivs -- Join to include the initial sum value
        )
      SELECT
        cd.date,
        cd."cumulativeAmount",
        cd."cumulativeIncome",
        cd."cumulativeExpenses",
        cd."cumulativeAssetsTransactions",
        cd."cumulativeLiabilitiesTransactions"
      FROM
        cumulative_data cd
        JOIN date_series ds ON cd.date = ds.date
      ORDER BY
        cd.date;
    `;

    const combinedResults = {
      prevStartDate: previousPeriod ? new Date(previousPeriod.startDate) : null,
      prevEndDate: previousPeriod ? new Date(previousPeriod.endDate) : null,
      prevIncome,
      prevExpenses,
      prevAssetsValue,
      prevLiabilitiesValue,
      groupedTransactions,
      groupedTransactionsCount,
      chartData,
    };

    return res.status(200).json(combinedResults);
  } catch (e) {
    console.error(e);

    return res.status(500).json({ message: 'Internal error' });
  }
});

router.put('/:transactionId', async (req, res) => {
  try {
    const localUser = res.locals.user as User;
    const transactionId = req.params.transactionId;
    const updatedAccount = req.body;

    const transaction = await prisma.transaction.findUnique({
      include: {
        financialAccount: true,
      },
      where: {
        id: transactionId,
      },
    });

    if (localUser.id !== transaction?.financialAccount.userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    await prisma.transaction.update({
      where: {
        id: transactionId,
      },
      data: updatedAccount,
    });

    return res.status(200).json({ message: 'Success' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Internal error' });
  }
});

router.delete('/:transactionId', async (req, res) => {
  try {
    const localUser = res.locals.user as User;
    const transactionId = req.params.transactionId;
    const deleteType = req.body.recurringDeleteType as string;

    const transaction = await prisma.transaction.findUnique({
      include: {
        financialAccount: true,
      },
      where: {
        id: transactionId,
      },
    });

    if (localUser.id !== transaction?.financialAccount.userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    if (deleteType === 'this_and_following') {
      await prisma.transaction.delete({
        where: {
          id: transaction.id,
        },
      });

      await prisma.transaction.deleteMany({
        where: {
          recurrenceId: transaction.recurrenceId,
          date: {
            gte: transaction.date,
          },
        },
      });
    } else if (deleteType === 'all') {
      await prisma.transaction.deleteMany({
        where: {
          recurrenceId: transaction.recurrenceId,
        },
      });
    } else {
      await prisma.transaction.delete({
        where: {
          id: transactionId,
        },
      });
    }

    return res.status(200).json({ message: 'Success' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Internal error' });
  }
});

router.post('/categories', async (req, res) => {
  try {
    const localUser = res.locals.user as User;
    const category = req.body as TransactionCategory;

    if (localUser.id !== category.userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    await prisma.transactionCategory.create({
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

    const category = await prisma.transactionCategory.findUnique({
      where: {
        id: categoryId,
      },
    });

    if (localUser.id !== category?.userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    await prisma.transactionCategory.update({
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

    const category = await prisma.transactionCategory.findUnique({
      where: {
        id: categoryId,
      },
    });

    if (localUser.id !== category?.userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    await prisma.transactionCategory.delete({
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
