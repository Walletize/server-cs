import { PrismaClient } from "@prisma/client";
import { seedAccountTypes } from "./accountType";
import { seedAccountCategories } from "./accountCategories";

const prisma = new PrismaClient()

async function main() {
    await seedAccountTypes(prisma)
    await seedAccountCategories(prisma)
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
