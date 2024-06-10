import { PrismaClient } from "@prisma/client";
import { seedAccountTypes } from "./accountType";
import { seedAccountCategories } from "./accountCategories";
import { seedTransactionTypes } from "./transactionType";
import { seedTransactionCategories } from "./transactionCategory";

const prisma = new PrismaClient()

async function main() {
    await seedAccountTypes(prisma)
    await seedAccountCategories(prisma)
    await seedTransactionTypes(prisma)
    await seedTransactionCategories(prisma)
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
