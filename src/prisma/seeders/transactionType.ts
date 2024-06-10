import { PrismaClient } from "@prisma/client"

export async function seedTransactionTypes(prisma: PrismaClient) {
    await prisma.transactionType.create({
        data: {
            id: "a6f2747a-8d68-49f7-9aab-3a9dcaaee850",
            name: "Income"
        },
    })

    await prisma.transactionType.create({
        data: {
            id: "62919f5b-047d-45c7-96d9-1cd21a946d3a",
            name: "Expense"
        },
    })

    await prisma.transactionType.create({
        data: {
            id: "1139551e-7723-49e3-89cd-a73fa6600580",
            name: "Transfer"
        },
    })
}
