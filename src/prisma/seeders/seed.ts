import { PrismaClient } from '@prisma/client';
import { seedAccountTypes } from './accountType';
import { seedCurrencies } from './currency';
import { seedPlans } from './plans';
import { seedDefaultTransactionCategories } from './transactionCategory';
import { seedTransactionTypes } from './transactionType';

const prisma = new PrismaClient();

async function main() {
  await seedAccountTypes(prisma);
  await seedTransactionTypes(prisma);
  await seedCurrencies(prisma);
  await seedPlans(prisma);
  await seedDefaultTransactionCategories(prisma);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
