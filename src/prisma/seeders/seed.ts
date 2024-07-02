import { PrismaClient } from "@prisma/client";
import { seedAccountTypes } from "./accountType";
import { seedAccountCategories } from "./accountCategories";
import { seedTransactionTypes } from "./transactionType";
import { seedTransactionCategories } from "./transactionCategory";
import { seedCurrencies } from "./currency";

const prisma = new PrismaClient()

async function main() {
    await seedAccountTypes(prisma)
    await seedTransactionTypes(prisma)
    await seedCurrencies(prisma)
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
