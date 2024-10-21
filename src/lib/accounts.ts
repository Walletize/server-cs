import { FinancialAccount } from '@prisma/client';
import { prisma } from '../app.js';

export async function createAccountPlanCheck(account: FinancialAccount, mainCurrencyId: string) {
  const activeSubscriptions = await prisma.subscription.findMany({
    where: {
      userId: account.userId,
      status: {
        in: ['active', 'trialing'],
      },
    },
  });
  const isProPlan = activeSubscriptions.length !== 0;
  if (account.currencyId !== mainCurrencyId && !isProPlan) {
    return false;
  }

  const accounts = await prisma.financialAccount.findMany({
    where: {
      userId: account.userId,
    },
  });
  if (accounts.length >= 3 && activeSubscriptions.length === 0) {
    return false;
  }

  return true;
}
