import { PrismaClient } from "@prisma/client";
import { seedAccountTypes } from "./accountType";
import { seedAccountCategories } from "./accountCategories";
import { seedTransactionTypes } from "./transactionType";
import { seedDefaultTransactionCategories, seedUserTransactionCategories } from "./transactionCategory";
import { seedCurrencies } from "./currency";
import { seedPlans } from "./plans";

const prisma = new PrismaClient()

async function main() {
    await seedAccountTypes(prisma)
    await seedTransactionTypes(prisma)
    await seedCurrencies(prisma)
    await seedPlans(prisma)
    await seedDefaultTransactionCategories(prisma)
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
