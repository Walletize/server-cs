import { PrismaClient } from "@prisma/client";
import { seedAccountTypes } from "./accountType";
import { seedAccountSubtypes } from "./accountSubtype";

const prisma = new PrismaClient()

async function main() {
    await seedAccountTypes(prisma)
    await seedAccountSubtypes(prisma)
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
